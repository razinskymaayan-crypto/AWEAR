#!/usr/bin/env python3
"""Tiny local server for the AWEAR company dashboard. Run on its own port,
separate from the product app (app.py / port 8000), so it never touches
the live product.

GET /          -> dashboard HTML
GET /api/data  -> fresh JSON (rebuilds from transcripts + live_status.json
                   on every request, so it's always current when polled)
"""
import os
import sys
import json
from datetime import datetime, timezone
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
import uvicorn

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import dashboard_build

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dashboard.html")
NOTES_PATH = os.path.join(REPO_ROOT, "agents", "agent_notes.json")

app = FastAPI()

# allows the VS Code webview (vscode-webview:// origin) to fetch/post here too
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/data")
def get_data():
    data = dashboard_build.build()
    return JSONResponse(data)


@app.post("/api/notes/{persona}")
async def add_note(persona: str, request: Request):
    body = await request.json()
    text = (body.get("text") or "").strip()
    if not text:
        return JSONResponse({"error": "empty"}, status_code=400)

    notes = {}
    if os.path.exists(NOTES_PATH):
        with open(NOTES_PATH, encoding="utf-8") as f:
            notes = json.load(f)
    notes.setdefault(persona, []).append({
        "text": text,
        "from": "carmel",
        "at": datetime.now(timezone.utc).isoformat(),
    })
    with open(NOTES_PATH, "w", encoding="utf-8") as f:
        json.dump(notes, f, ensure_ascii=False, indent=2)
    return JSONResponse({"ok": True})


@app.get("/", response_class=HTMLResponse)
def get_dashboard():
    with open(HTML_PATH, encoding="utf-8") as f:
        return f.read()


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
