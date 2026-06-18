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
from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse
import uvicorn

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import dashboard_build

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dashboard.html")

app = FastAPI()


@app.get("/api/data")
def get_data():
    data = dashboard_build.build()
    return JSONResponse(data)


@app.get("/", response_class=HTMLResponse)
def get_dashboard():
    with open(HTML_PATH, encoding="utf-8") as f:
        return f.read()


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
