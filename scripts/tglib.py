#!/usr/bin/env python3
"""AWEAR canonical Telegram layer — the ONE way to talk to the Telegram API.

Every sender (telegram_send.py, telegram_bot.py, scripts/tg.sh, CI workflows,
scripts/daily_report.py) routes through here, so delivery hardening lives in
exactly one place:

  * 4096-char chunking (Telegram hard limit) — long reports arrive split, never vanish
  * Markdown -> plain-text fallback — a parse error must not kill the message
  * retry with backoff, including HTTP 429 (honors Telegram's retry_after)
  * every terminal failure is appended to .claude/telegram_failures.log (audit trail)
  * getUpdates offset persistence helpers for pollers

CLI (drop-in behind scripts/tg.sh):
  python3 scripts/tglib.py text  "message"            # also reads stdin if no arg
  python3 scripts/tglib.py photo /tmp/shot.png "caption"
  python3 scripts/tglib.py doc   docs/x.md "caption"

Exit codes: 0 = delivered (or telegram env unset -> logged skip, matching the old
tg.sh contract so CI callers don't fail on missing secrets); 1 = delivery failed
after retries (and the failure is in the audit log).
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FAIL_LOG = ROOT / ".claude" / "telegram_failures.log"

MAX_TEXT = 4096      # Telegram sendMessage hard limit
MAX_CAPTION = 1024   # Telegram photo/document caption hard limit
RETRIES = 3


class TgError(Exception):
    """Terminal Telegram failure (after retries). Message includes the API detail."""


def _load_dotenv_if_available() -> None:
    try:
        from dotenv import load_dotenv  # optional — CI sets env vars directly
        load_dotenv(ROOT / ".env")
    except Exception:  # noqa: BLE001
        pass


def get_token() -> str:
    _load_dotenv_if_available()
    # Strip ALL whitespace — a trailing newline in the env var makes the request
    # URL malformed and every send silently fails (see FAILURES history).
    return "".join(os.getenv("TELEGRAM_BOT_TOKEN", "").split())


def get_chat_id() -> str:
    _load_dotenv_if_available()
    chat = "".join(os.getenv("TELEGRAM_CHAT_ID", "").split())
    if chat:
        return chat
    saved = ROOT / ".tg_chat"  # saved by telegram_bot.py — avoids a getUpdates conflict
    try:
        return saved.read_text().strip()
    except Exception:  # noqa: BLE001
        return ""


def log_failure(context: str, detail: str) -> None:
    """Append a terminal failure to the audit log. Failures must leave a trace —
    a dropped escalation with no record is the worst failure mode this layer has."""
    line = f"{datetime.now(timezone.utc).isoformat(timespec='seconds')} | {context} | {detail[:400]}\n"
    try:
        FAIL_LOG.parent.mkdir(parents=True, exist_ok=True)
        with open(FAIL_LOG, "a", encoding="utf-8") as f:
            f.write(line)
    except Exception:  # noqa: BLE001
        pass
    print(f"tglib FAILURE: {context}: {detail[:200]}", file=sys.stderr)


def _read_response(resp_bytes: bytes) -> dict:
    try:
        return json.loads(resp_bytes.decode())
    except Exception:  # noqa: BLE001
        return {}


def api(method: str, params: dict | None = None, *, token: str | None = None,
        timeout: int = 30, retries: int = RETRIES,
        files: dict[str, str] | None = None) -> dict:
    """Call a Telegram Bot API method with retry/backoff. Returns the parsed
    response dict (check .get("ok")). Raises TgError only after all retries fail
    on transport errors; API-level {"ok": false} is returned for the caller to
    interpret (parse errors need a caller-side fallback, not a retry)."""
    tok = token or get_token()
    if not tok:
        raise TgError("TELEGRAM_BOT_TOKEN not set")
    url = f"https://api.telegram.org/bot{tok}/{method}"
    last_err = ""
    for attempt in range(1, retries + 1):
        try:
            if files:
                body, content_type = _encode_multipart(params or {}, files)
                req = urllib.request.Request(url, data=body,
                                             headers={"Content-Type": content_type})
            else:
                data = urllib.parse.urlencode(params or {}).encode()
                req = urllib.request.Request(url, data=data)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return _read_response(r.read())
        except urllib.error.HTTPError as e:
            res = _read_response(e.read())
            if e.code == 429:
                # Rate limited — honor Telegram's own backoff hint, then retry.
                wait = int((res.get("parameters") or {}).get("retry_after", attempt * 3))
                time.sleep(min(wait, 30))
                last_err = f"429 rate limited (retry_after honored, attempt {attempt})"
                continue
            # Other 4xx (e.g. Markdown parse error, message too long) are not
            # transient — return them so the caller can pick the right fallback.
            return res or {"ok": False, "error_code": e.code, "description": str(e)}
        except Exception as e:  # noqa: BLE001 — timeouts, DNS, connection resets
            last_err = f"{type(e).__name__}: {e}"
            time.sleep(attempt * 3)
    raise TgError(f"{method} failed after {retries} attempts: {last_err}")


def _encode_multipart(params: dict, files: dict[str, str]) -> tuple[bytes, str]:
    """Minimal stdlib multipart/form-data encoder (for sendPhoto/sendDocument)."""
    boundary = uuid.uuid4().hex
    parts: list[bytes] = []
    for name, value in params.items():
        parts.append(
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n".encode()
        )
    for name, path in files.items():
        filename = os.path.basename(path)
        with open(path, "rb") as f:
            content = f.read()
        parts.append(
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"; "
            f"filename=\"{filename}\"\r\nContent-Type: application/octet-stream\r\n\r\n".encode()
            + content + b"\r\n"
        )
    parts.append(f"--{boundary}--\r\n".encode())
    return b"".join(parts), f"multipart/form-data; boundary={boundary}"


def chunk_text(text: str, limit: int = MAX_TEXT) -> list[str]:
    """Split text into <=limit chunks, preferring newline boundaries so reports
    stay readable. A single overlong line is hard-split."""
    if len(text) <= limit:
        return [text]
    chunks: list[str] = []
    current = ""
    for line in text.split("\n"):
        while len(line) > limit:  # single line longer than the limit
            space = limit if not current else limit - len(current) - 1
            if space <= 0:
                chunks.append(current)
                current = ""
                continue
            head, line = line[:space], line[space:]
            current = f"{current}\n{head}" if current else head
            chunks.append(current)
            current = ""
        candidate = f"{current}\n{line}" if current else line
        if len(candidate) > limit:
            chunks.append(current)
            current = line
        else:
            current = candidate
    if current:
        chunks.append(current)
    return chunks


def send_text(text: str, chat_id: str | None = None, *, markdown: bool = True,
              token: str | None = None) -> bool:
    """Send text, chunked to the 4096 limit. Markdown parse errors fall back to
    plain text per chunk (an unformatted report beats a vanished one). Returns
    True only if EVERY chunk was delivered; terminal failures hit the audit log."""
    chat = chat_id or get_chat_id()
    if not chat:
        log_failure("send_text", "no chat id (TELEGRAM_CHAT_ID / .tg_chat missing)")
        return False
    chunks = chunk_text(text)
    if len(chunks) > 1:
        print(f"tglib: message is {len(text)} chars -> {len(chunks)} chunks", file=sys.stderr)
    for i, chunk in enumerate(chunks, 1):
        try:
            res = {}
            if markdown:
                res = api("sendMessage", {"chat_id": chat, "text": chunk,
                                          "parse_mode": "Markdown"}, token=token)
                if not res.get("ok"):
                    print(f"tglib: markdown rejected ({res.get('description', '?')}) "
                          f"-> plain-text fallback", file=sys.stderr)
            if not res.get("ok"):
                res = api("sendMessage", {"chat_id": chat, "text": chunk}, token=token)
            if not res.get("ok"):
                log_failure("send_text", f"chunk {i}/{len(chunks)}: {res}")
                return False
        except TgError as e:
            log_failure("send_text", f"chunk {i}/{len(chunks)}: {e}")
            return False
    return True


def send_file(kind: str, path: str, caption: str = "", chat_id: str | None = None,
              *, token: str | None = None) -> bool:
    """kind: 'photo' or 'document'. Overlong captions are truncated (1024 limit)
    and the remainder is sent as a follow-up text message."""
    chat = chat_id or get_chat_id()
    if not chat:
        log_failure(f"send_{kind}", "no chat id")
        return False
    if not os.path.isfile(path):
        log_failure(f"send_{kind}", f"file not found: {path}")
        return False
    method = "sendPhoto" if kind == "photo" else "sendDocument"
    field = "photo" if kind == "photo" else "document"
    cap, overflow = caption[:MAX_CAPTION], caption[MAX_CAPTION:]
    try:
        res = api(method, {"chat_id": chat, "caption": cap}, files={field: path},
                  token=token, timeout=120)
    except TgError as e:
        log_failure(f"send_{kind}", f"{path}: {e}")
        return False
    if not res.get("ok"):
        log_failure(f"send_{kind}", f"{path}: {res}")
        return False
    if overflow:
        send_text(overflow, chat_id=chat, markdown=False, token=token)
    return True


# ── getUpdates offset persistence (pollers) ─────────────────────────────────

def load_offset(path: str | Path) -> int:
    try:
        return int(Path(path).read_text().strip())
    except Exception:  # noqa: BLE001
        return 0


def save_offset(path: str | Path, offset: int) -> None:
    p = Path(path)
    tmp = p.with_suffix(p.suffix + ".tmp")
    tmp.write_text(str(offset))
    tmp.replace(p)  # atomic — a crash mid-write must not corrupt the offset


# ── CLI (tg.sh delegates here) ──────────────────────────────────────────────

def main(argv: list[str]) -> int:
    mode = argv[0] if argv else "text"
    if not get_token() or not get_chat_id():
        # Match the historic tg.sh contract: missing env = skip, not a hard fail,
        # so CI callers without secrets don't explode. Still leaves a trace.
        print("tglib: telegram env not set — skipping", file=sys.stderr)
        return 0
    if mode == "text":
        text = " ".join(argv[1:]).strip() or sys.stdin.read().strip()
        if not text:
            print("usage: tglib.py text \"message\"", file=sys.stderr)
            return 1
        ok = send_text(text)
    elif mode in ("photo", "doc"):
        if len(argv) < 2:
            print(f"usage: tglib.py {mode} <path> [caption]", file=sys.stderr)
            return 1
        kind = "photo" if mode == "photo" else "document"
        ok = send_file(kind, argv[1], argv[2] if len(argv) > 2 else "")
    else:
        print(f"tglib: unknown mode '{mode}' (use text|photo|doc)", file=sys.stderr)
        return 1
    print(f"tglib: {mode} {'sent' if ok else 'FAILED (see .claude/telegram_failures.log)'}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
