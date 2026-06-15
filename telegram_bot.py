"""
AWEAR — Telegram agent bot (two-way).

Lets the founders (Maayan & Carmel) talk to their Awear AI co-founder from their phone,
anywhere. Text the bot -> it answers as the Awear agent team, with full product context.

One-time setup:
  1. In Telegram, open @BotFather -> /newbot -> copy the bot TOKEN.
  2. Add it to .env:   TELEGRAM_BOT_TOKEN=123456:ABC...
  3. Run:   venv312/bin/python telegram_bot.py
  4. Open your bot in Telegram, send /start, and just chat.

Keep this running (in its own terminal) while you want to work remotely.
"""

import json
import os
import time
import urllib.parse
import urllib.request

import anthropic
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
BASE = f"https://api.telegram.org/bot{TOKEN}"
MODEL = "claude-opus-4-8"
MAX_HISTORY = 20  # keep last N messages per chat

client = anthropic.Anthropic()  # uses ANTHROPIC_API_KEY from .env

SYSTEM_PROMPT = (
    "אתה הסוכן הראשי של Awear — צוות ה-AI שמנהל ובונה את הסטארטאפ יחד עם שני המייסדים, "
    "מעיין וכרמל (לא טכניים). הם כותבים לך מהטלגרם כדי לעבוד מרחוק על החברה.\n\n"
    "על Awear: אפליקציית אופנה ל-Gen-Z (בת 17, ת\"א, אקטיבית בטיקטוק/אינסטגרם). 5 רבדים — "
    "(1) ארון דיגיטלי: צילום תלבושת → AI מזהה פריטים → פיד בסגנון TikTok; (2) קנייה מהפיד "
    "(Shop the Look) דרך affiliate, בלי תלות באישור מותגים; (3) מרקטפלייס יד-שנייה; (4) סטייליסט AI; "
    "(5) רעיונות שהסוכנים מפתחים. מודל: עמלות affiliate/dropshipping + יד-שנייה + שיווק ממומן. "
    "גיוס $70-80K, פגישת משקיע (הדוד של כרמל) בקרוב. זווית-על: החברה נבנית ע\"י צוות אייג'נטים.\n\n"
    "סגנון: ענה בעברית, קצר וענייני וישיר. תן המלצה אחת ברורה, לא סקירה. כשצריך — שאל שאלה אחת "
    "ממוקדת. דבר כמו שותף-מייסד מנוסה, לא כמו עוזר. אם מבקשים ממך משימה שדורשת לכתוב קוד או קבצים, "
    "הסבר מה צריך לעשות בצ'אט של Claude Code על המחשב (שם בונים בפועל)."
)

histories: dict[int, list] = {}


def _save_chat_id(chat_id: int) -> None:
    """Persist the chat id so the autonomous loop can report here via telegram_send.py."""
    try:
        with open(".tg_chat", "w") as f:
            f.write(str(chat_id))
    except Exception:  # noqa: BLE001
        pass


def _log_inbox(text: str) -> None:
    """Append the founders' messages so the autonomous improvement loop can read & act on them."""
    try:
        with open(".tg_inbox", "a") as f:
            f.write(text.replace("\n", " ").strip() + "\n")
    except Exception:  # noqa: BLE001
        pass


def tg(method: str, params: dict, timeout: int = 60) -> dict:
    data = urllib.parse.urlencode(params).encode()
    req = urllib.request.Request(f"{BASE}/{method}", data=data)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def reply_for(chat_id: int, text: str) -> str:
    history = histories.setdefault(chat_id, [])
    history.append({"role": "user", "content": text})
    history[:] = history[-MAX_HISTORY:]
    try:
        resp = client.messages.create(
            model=MODEL,
            max_tokens=1500,
            system=SYSTEM_PROMPT,
            messages=history,
        )
        answer = next((b.text for b in resp.content if b.type == "text"), "…")
    except Exception as exc:  # noqa: BLE001
        return f"⚠️ שגיאה מול ה-AI: {exc}"
    history.append({"role": "assistant", "content": answer})
    return answer


def main() -> None:
    if not TOKEN:
        print("❌ אין TELEGRAM_BOT_TOKEN ב-.env — צרו בוט ב-@BotFather והוסיפו אותו.")
        return
    me = tg("getMe", {})
    if not me.get("ok"):
        print("❌ הטוקן לא תקין:", me)
        return
    print(f"✅ הבוט @{me['result']['username']} רץ. כתבו לו /start בטלגרם. (Ctrl+C לעצור)")

    offset = 0
    while True:
        try:
            updates = tg("getUpdates", {"offset": offset, "timeout": 30}, timeout=40)
        except Exception as exc:  # noqa: BLE001
            print("poll error:", exc)
            time.sleep(3)
            continue

        for upd in updates.get("result", []):
            offset = upd["update_id"] + 1
            msg = upd.get("message")
            if not msg or "text" not in msg:
                continue
            chat_id = msg["chat"]["id"]
            text = msg["text"].strip()
            _save_chat_id(chat_id)
            _log_inbox(text)

            if text == "/start":
                tg("sendMessage", {
                    "chat_id": chat_id,
                    "text": "היי! אני הסוכן של Awear 👗 כתבו לי כל דבר — אסטרטגיה, מוצר, גיוס, שיווק — "
                            "ואני פה. במה נתחיל?",
                })
                histories[chat_id] = []
                continue

            tg("sendChatAction", {"chat_id": chat_id, "action": "typing"})
            answer = reply_for(chat_id, text)
            tg("sendMessage", {"chat_id": chat_id, "text": answer})


if __name__ == "__main__":
    main()
