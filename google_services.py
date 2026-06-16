"""
AWEAR — Google integration
Gmail SMTP: send meeting summaries to company inbox
Google Calendar API: create events per agent with color coding
"""

import os
import smtplib
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

COMPANY_EMAIL = "awearteam66@gmail.com"
SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
]
TOKEN_FILE = "google_token.json"
CREDS_FILE = "google_credentials.json"

# Google Calendar color IDs — matches org.md color assignments
AGENT_CALENDAR_COLORS = {
    "board":   "11",  # Tomato — board meetings
    "carmel":  "3",   # Grape
    "maayan":  "4",   # Flamingo
    "jeff":    "6",   # Tangerine
    "ayalon":  "5",   # Banana
    "steve":   "10",  # Sage
    "mark":    "8",   # Basil
    "varan":   "7",   # Peacock
    "sam":     "9",   # Blueberry
}

AGENT_DISPLAY_NAMES = {
    "jeff":    "ג׳ף — CEO",
    "ayalon":  "איילון — Product",
    "steve":   "סטיב — CTO",
    "mark":    "מארק — Dev",
    "varan":   "וראן — Mobile",
    "sam":     "סאם — Backend",
    "board":   "Board — AWEAR",
    "carmel":  "כרמל",
    "maayan":  "מעיין",
}

# All agents share the company calendar — swap individual emails here when ready
AGENT_EMAILS = {
    "jeff":   COMPANY_EMAIL,
    "ayalon": COMPANY_EMAIL,
    "steve":  COMPANY_EMAIL,
    "mark":   COMPANY_EMAIL,
    "varan":  COMPANY_EMAIL,
    "sam":    COMPANY_EMAIL,
    "board":  COMPANY_EMAIL,
    "carmel": COMPANY_EMAIL,
    "maayan": COMPANY_EMAIL,
}


# ---------------------------------------------------------------------------
# Gmail — send summary email
# ---------------------------------------------------------------------------

def send_summary_email(agent: str, department: str, summary: dict) -> bool:
    """Send meeting summary to company inbox via Gmail SMTP."""
    app_password = os.getenv("GMAIL_APP_PASSWORD")
    if not app_password:
        print("GMAIL_APP_PASSWORD not set — skipping email")
        return False

    date_str = datetime.now().strftime("%d.%m.%Y")
    subject = f"[AWEAR] {department} — סיכום {date_str}"

    completed   = "\n".join(f"- {x}" for x in summary.get("completed", [])) or "—"
    in_progress = "\n".join(f"- {x}" for x in summary.get("in_progress", [])) or "—"
    decisions   = "\n".join(f"- {x}" for x in summary.get("decisions", [])) or "—"
    board_items = "\n".join(f"- {x}" for x in summary.get("board_approval", [])) or "אין"

    body = f"""מחלקה: {department}
תאריך: {date_str}
נוכחים: {summary.get("attendees", AGENT_DISPLAY_NAMES.get(agent, agent))}

---

תמצית
{summary.get("summary", "")}

---

מה הושלם
{completed}

מה בתהליך
{in_progress}

החלטות שהתקבלו
{decisions}

נושאים שדורשים אישור דירקטוריון
{board_items}

הצעד הבא
{summary.get("next_step", "")}
"""

    msg = MIMEMultipart()
    msg["From"] = COMPANY_EMAIL
    msg["To"] = COMPANY_EMAIL
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain", "utf-8"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(COMPANY_EMAIL, app_password)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False


# ---------------------------------------------------------------------------
# Google Calendar — get authenticated service
# ---------------------------------------------------------------------------

def _get_calendar_service():
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(CREDS_FILE):
                print(f"Missing {CREDS_FILE} — run setup_google_auth.py first")
                return None
            flow = InstalledAppFlow.from_client_secrets_file(CREDS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())
    return build("calendar", "v3", credentials=creds)


# ---------------------------------------------------------------------------
# Google Calendar — create event
# ---------------------------------------------------------------------------

def create_calendar_event(
    agent: str,
    title: str,
    start_iso: str,
    end_iso: str,
    description: str = "",
    attendees: Optional[List[str]] = None,
) -> Optional[str]:
    """
    Create a Google Calendar event.
    start_iso / end_iso: ISO 8601, e.g. '2026-06-18T10:00:00+03:00'
    Returns the event URL or None on failure.
    """
    service = _get_calendar_service()
    if not service:
        return None

    color_id = AGENT_CALENDAR_COLORS.get(agent.lower(), "1")
    event = {
        "summary": title,
        "description": description,
        "start": {"dateTime": start_iso, "timeZone": "Asia/Jerusalem"},
        "end":   {"dateTime": end_iso,   "timeZone": "Asia/Jerusalem"},
        "colorId": color_id,
    }
    if attendees:
        event["attendees"] = [{"email": a} for a in attendees]

    try:
        result = service.events().insert(calendarId="primary", body=event).execute()
        return result.get("htmlLink")
    except Exception as e:
        print(f"Calendar error: {e}")
        return None


# ---------------------------------------------------------------------------
# Google Calendar — schedule meeting between agents
# ---------------------------------------------------------------------------

def schedule_agent_meeting(
    organizer: str,
    participants: List[str],
    title: str,
    start_iso: str,
    end_iso: str,
    description: str = "",
) -> Optional[str]:
    """
    Create a calendar meeting between agents.
    organizer: agent key (e.g. 'jeff') — determines event color
    participants: list of agent keys to invite (e.g. ['steve', 'mark'])
    Returns the event URL or None on failure.
    """
    all_agents = [organizer] + [p for p in participants if p != organizer]
    attendee_emails = list({AGENT_EMAILS[a] for a in all_agents if a in AGENT_EMAILS})

    participant_names = ", ".join(
        AGENT_DISPLAY_NAMES.get(a, a) for a in all_agents
    )
    full_description = f"משתתפים: {participant_names}\n\n{description}".strip()

    return create_calendar_event(
        agent=organizer,
        title=title,
        start_iso=start_iso,
        end_iso=end_iso,
        description=full_description,
        attendees=attendee_emails,
    )
