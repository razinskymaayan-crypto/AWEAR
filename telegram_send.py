"""
Send a summary message to the founders' Telegram chat.

Thin CLI over scripts/tglib.py — the canonical Telegram layer (chunking, retries,
markdown fallback, failure audit log all live THERE, not here).

One-time setup (30 sec):
  1. In Telegram, open @BotFather -> /newbot -> follow prompts -> copy the bot TOKEN.
  2. Open your new bot and send it any message (e.g. "hi") so it can find your chat.
  3. Add the token to .env:   TELEGRAM_BOT_TOKEN=123456:ABC...
Then run:
  venv312/bin/python telegram_send.py "your message"
It auto-detects your chat id (prints it so you can save TELEGRAM_CHAT_ID in .env).
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "scripts"))
import tglib  # noqa: E402


def resolve_chat_id() -> str | None:
    chat = tglib.get_chat_id()  # env var, then .tg_chat saved by telegram_bot.py
    if chat:
        return chat
    # Last resort: ask getUpdates (only works if the founder messaged the bot recently
    # and no poller consumed the update).
    try:
        res = tglib.api("getUpdates")
    except tglib.TgError:
        return None
    for upd in reversed(res.get("result", [])):
        msg = upd.get("message") or upd.get("edited_message") or upd.get("channel_post")
        if msg and msg.get("chat", {}).get("id") is not None:
            return str(msg["chat"]["id"])
    return None


def send(text: str) -> None:
    if not tglib.get_token():
        print("❌ אין TELEGRAM_BOT_TOKEN ב-.env — צרו בוט ב-@BotFather והוסיפו אותו.")
        sys.exit(1)
    chat_id = resolve_chat_id()
    if not chat_id:
        print("❌ לא נמצא chat id — שלחו הודעה אחת לבוט שלכם בטלגרם ונסו שוב.")
        sys.exit(1)
    if tglib.send_text(text, chat_id=chat_id):
        print(f"✅ נשלח לטלגרם (chat {chat_id})")
        if not tglib.get_chat_id():
            print(f"💡 לשמירה, הוסיפו ל-.env:  TELEGRAM_CHAT_ID={chat_id}")
    else:
        print("❌ שגיאת טלגרם — הפרטים ב-.claude/telegram_failures.log")
        sys.exit(1)


if __name__ == "__main__":
    msg = " ".join(sys.argv[1:]).strip() or sys.stdin.read().strip()
    if not msg:
        print("שימוש: telegram_send.py \"הודעה\"")
        sys.exit(1)
    send(msg)
