"""
Send a summary message to the founders' Telegram chat.

One-time setup (30 sec):
  1. In Telegram, open @BotFather -> /newbot -> follow prompts -> copy the bot TOKEN.
  2. Open your new bot and send it any message (e.g. "hi") so it can find your chat.
  3. Add the token to .env:   TELEGRAM_BOT_TOKEN=123456:ABC...
Then run:
  venv312/bin/python telegram_send.py "your message"
It auto-detects your chat id (prints it so you can save TELEGRAM_CHAT_ID in .env).
"""

import json
import os
import sys
import urllib.parse
import urllib.request

from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "").strip()
BASE = f"https://api.telegram.org/bot{TOKEN}"


def _call(method: str, params: dict | None = None) -> dict:
    url = f"{BASE}/{method}"
    if params:
        req = urllib.request.Request(url, data=urllib.parse.urlencode(params).encode())
    else:
        req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def resolve_chat_id() -> str | None:
    if CHAT_ID:
        return CHAT_ID
    if os.path.exists(".tg_chat"):  # saved by telegram_bot.py — avoids getUpdates conflict
        try:
            cid = open(".tg_chat").read().strip()
            if cid:
                return cid
        except Exception:  # noqa: BLE001
            pass
    res = _call("getUpdates")
    for upd in reversed(res.get("result", [])):
        msg = upd.get("message") or upd.get("edited_message") or upd.get("channel_post")
        if msg and msg.get("chat", {}).get("id") is not None:
            return str(msg["chat"]["id"])
    return None


def send(text: str) -> None:
    if not TOKEN:
        print("❌ אין TELEGRAM_BOT_TOKEN ב-.env — צרו בוט ב-@BotFather והוסיפו אותו.")
        sys.exit(1)
    chat_id = resolve_chat_id()
    if not chat_id:
        print("❌ לא נמצא chat id — שלחו הודעה אחת לבוט שלכם בטלגרם ונסו שוב.")
        sys.exit(1)
    res = _call("sendMessage", {"chat_id": chat_id, "text": text, "parse_mode": "Markdown"})
    if res.get("ok"):
        print(f"✅ נשלח לטלגרם (chat {chat_id})")
        if not CHAT_ID:
            print(f"💡 לשמירה, הוסיפו ל-.env:  TELEGRAM_CHAT_ID={chat_id}")
    else:
        print("❌ שגיאת טלגרם:", res)
        sys.exit(1)


if __name__ == "__main__":
    msg = " ".join(sys.argv[1:]).strip() or sys.stdin.read().strip()
    if not msg:
        print("שימוש: telegram_send.py \"הודעה\"")
        sys.exit(1)
    send(msg)
