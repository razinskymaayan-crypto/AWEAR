"""
AWEAR — one-time Google OAuth setup
Run this ONCE to authorize Google Calendar access.
Saves a token to google_token.json — keep it out of git.

Usage:
    venv312/bin/python setup_google_auth.py
"""

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/gmail.send",
]

flow = InstalledAppFlow.from_client_secrets_file("google_credentials.json", SCOPES)
creds = flow.run_local_server(port=0)

with open("google_token.json", "w") as f:
    f.write(creds.to_json())

print("Authorization complete. google_token.json saved.")
