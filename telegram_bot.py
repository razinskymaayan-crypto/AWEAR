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

from __future__ import annotations

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

# ── Two-way control: founder auth, agent routing, pause/status ──────────────
# Only these Telegram user IDs may issue commands / route tasks. Sources, unioned:
#   1) env TG_ALLOWED_IDS (comma-separated), and
#   2) tg_whoami.json — IDs the whoami workflow captured when a founder messaged the bot.
# Empty from both => FAIL CLOSED (deny everyone). An empty allowlist used to mean
# "allow everyone", which left the command channel (/pause, @agent <task>) open to
# anyone who found the bot. Set TG_ALLOW_ALL=1 explicitly for local dev only.
def _load_allowed() -> set[int]:
    ids = {int(x) for x in os.getenv("TG_ALLOWED_IDS", "").replace(" ", "").split(",") if x.strip().isdigit()}
    try:
        with open("tg_whoami.json") as f:
            ids |= {int(k) for k in json.load(f).keys()}
    except Exception:  # noqa: BLE001
        pass
    return ids

ALLOWED = _load_allowed()

# Agents that can be addressed directly with @name. Managers + ICs + Jeff.
AGENTS = {
    "jeff", "mark", "steve", "ayalon", "varan",          # managers / CEO
    "dolce", "valentino", "netta", "gabbana",             # design ICs
    "sam", "oren", "shira",                               # backend / social ICs
}
ASSIGN_DIR = ".claude/agents/assignments"
PAUSE_FLAG = ".agents_paused"
BUDGET_STATE = ".agent_budget.json"


def _is_allowed(user_id: int) -> bool:
    if ALLOWED:
        return user_id in ALLOWED
    # FAIL CLOSED: no allowlist configured => deny, unless dev explicitly opts out.
    return os.getenv("TG_ALLOW_ALL", "") == "1"


def _route_to_agent(agent: str, task: str, who: str) -> bool:
    """Queue a task for a specific agent — its run reads this file each cycle.
    Returns True only if the write actually succeeded (honest acks, no fake ✅)."""
    try:
        os.makedirs(ASSIGN_DIR, exist_ok=True)
        with open(f"{ASSIGN_DIR}/{agent}.md", "a") as f:
            f.write(f"- [ ] (from {who} via Telegram) {task.strip()}\n")
        return True
    except Exception:  # noqa: BLE001
        return False


def _queue_inbox(task: str, who: str) -> bool:
    """Untagged /task -> shared INBOX 'new tasks' section (Jeff routes it).
    Returns True only if the task landed in INBOX.md itself. The old silent fallback
    to .tg_inbox (gitignored => invisible to CI agents) reported success while the
    task was effectively lost — now it is reported as a failure to the founder."""
    line = f"{task.strip()}  _(from {who} via Telegram)_\n"
    try:
        with open(".claude/master/INBOX.md", "r") as f:
            content = f.read()
        marker = "## משימות חדשות\n"
        if marker in content:
            content = content.replace(marker, marker + "\n" + line, 1)
            with open(".claude/master/INBOX.md", "w") as f:
                f.write(content)
            return True
    except Exception:  # noqa: BLE001
        pass
    try:
        with open(".tg_inbox", "a") as f:  # local trace only — NOT a delivery
            f.write(line)
    except Exception:  # noqa: BLE001
        pass
    return False


def _set_pause(paused: bool) -> None:
    if paused:
        open(PAUSE_FLAG, "w").close()
    elif os.path.exists(PAUSE_FLAG):
        os.remove(PAUSE_FLAG)


def _status_text() -> str:
    paused = os.path.exists(PAUSE_FLAG)
    parts = ["⏸️ מושהה" if paused else "▶️ פעיל"]
    try:
        with open(BUDGET_STATE) as f:
            b = json.load(f)
        spent, cap = b.get("spent_tokens", 0), b.get("daily_cap_tokens", 0)
        parts.append(f"טוקנים היום: {spent:,}/{cap:,}" if cap else f"טוקנים היום: {spent:,}")
        if b.get("active_lane"):
            parts.append(f"רץ עכשיו: {b['active_lane']}")
    except Exception:  # noqa: BLE001
        parts.append("(תקציב: אין נתון עדיין)")
    return " · ".join(parts)


def _parse_command(text: str, who: str) -> str | None:
    """Handle /commands and @agent routing. Returns a reply, or None for free chat."""
    low = text.lower()
    if low.startswith("/status"):
        return _status_text()
    if low.startswith("/pause"):
        _set_pause(True)
        return "⏸️ הסוכנים יושהו אחרי הריצות הפעילות. /resume כדי להמשיך."
    if low.startswith("/resume"):
        _set_pause(False)
        return "▶️ הסוכנים ימשיכו לעבוד."
    if low.startswith("/task"):
        task = text[len("/task"):].strip()
        if not task:
            return "כתבי /task ואז המשימה. או @<סוכן> משימה כדי לכוון לסוכן ספציפי."
        if _queue_inbox(task, who):
            return "✅ נכנס ל-INBOX. ג'ף ינתב לסוכן הנכון בריצה הקרובה."
        return "❌ לא הצלחתי לכתוב ל-INBOX — המשימה לא נקלטה. נסי שוב, ואם זה חוזר ספרי לצוות."
    if text.lstrip().startswith("@"):
        tag, _, task = text.lstrip()[1:].partition(" ")
        agent = tag.lower().rstrip(":,.")
        if agent in AGENTS and task.strip():
            if _route_to_agent(agent, task, who):
                return f"✅ נשלח ל-{agent}. הוא יבצע במחזור הקרוב ויחזור אליך חתום בשמו."
            return f"❌ הניתוב ל-{agent} נכשל — המשימה לא נקלטה. נסי שוב."
        if agent in AGENTS:
            return f"מה לבקש מ-{agent}? כתבי: @{agent} <המשימה>"
        return f"לא מכיר סוכן בשם '{agent}'. סוכנים: {', '.join(sorted(AGENTS))}"
    return None


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
            frm = msg.get("from", {})
            user_id = frm.get("id", 0)
            who = frm.get("first_name") or frm.get("username") or str(user_id)
            _save_chat_id(chat_id)

            # Founder-only: only Carmel & Razi (TG_ALLOWED_IDS) may use the bot.
            if not _is_allowed(user_id):
                tg("sendMessage", {"chat_id": chat_id,
                                   "text": "מצטער, הבוט הזה פרטי לצוות Awear."})
                continue

            if text == "/start":
                tg("sendMessage", {
                    "chat_id": chat_id,
                    "text": "היי! אני הצוות של Awear 👗\n"
                            "• כתבי חופשי — אסטרטגיה/מוצר/גיוס.\n"
                            "• /task <משימה> — מכניס לתור (ג'ף ינתב).\n"
                            "• @<סוכן> <משימה> — ישר לסוכן (dolce/sam/valentino/...).\n"
                            "• /status · /pause · /resume — שליטה.",
                })
                histories[chat_id] = []
                continue

            # Commands + @agent routing take precedence over free chat.
            cmd_reply = _parse_command(text, who)
            if cmd_reply is not None:
                tg("sendMessage", {"chat_id": chat_id, "text": cmd_reply})
                continue

            tg("sendChatAction", {"chat_id": chat_id, "action": "typing"})
            answer = reply_for(chat_id, text)
            tg("sendMessage", {"chat_id": chat_id, "text": answer})


if __name__ == "__main__":
    main()
