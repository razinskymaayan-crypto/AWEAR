# Daily Digest — 2026-06-28

- Done: Oren shipped backend integration hardening — /api/dm/send now rejects unknown recipients (404) so the DM store never accrues orphaned ghost threads (fail-open on empty cache). Verified with FastAPI TestClient. | Proposed: nothing new this run. | Blocked: a future "Message seller" link from Community store pages needs an ID-namespace reconciliation (Community u1-style ids vs DM user_NNN) — flagged by steve as a separate larger task, not attempted.
