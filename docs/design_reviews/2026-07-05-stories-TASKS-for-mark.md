# Fix tasks for Mark (Head of Design) — Stories audit 2026-07-05

> Filed by Gabbana. This SHOULD live in `.claude/agents/assignments/mark.md`, but `.claude/**` writes
> are permission-blocked for agents in this run (see NEEDS_YOU.md). Mark: copy these into your
> queue verbatim. Full evidence + line refs: `docs/design_reviews/2026-07-05-stories.md` (score 4/10).

## Stories — P0 (fix before any live-demo story post)

- [ ] **STO-1 (P0-1+P0-2, one task):** Stories must render a real display identity, never `user_key` (raw client IP / "anon"), AND real stories must MERGE with the seeded Tamar/Carmel/Maayan batches instead of replacing them (`static/index.html:10551-10575`). Today, posting ONE story turns the bar into `[Your story] [84.229.11.7]` and deletes all three real users. Owner: shira (frontend merge + identity fallback "You"/profile name) + sam (attach display_name/avatar to story rows or join at GET) — coordinate via steve. Verify by POSTing a real story and screenshotting the bar.
- [ ] **STO-2 (P0-3):** Story viewer is unreadable in light theme — username/caption/progress-fill use `var(--text)` (near-black) over the always-dark letterboxed surface (`static/index.html:565-626`). Scope the viewer to forced light-on-dark (Instagram convention), ~20 lines CSS inside `.story-viewer`. Owner: dolce or netta. Verify with a light-theme viewer screenshot.

## Stories — P1

- [ ] **STO-3:** `created_at` naive-UTC (`app.py:3721` `utcnow().isoformat()`, no offset) → browser parses as local → fresh stories show "1m" for 3h in Israel TZ. One-line fix: `datetime.now(timezone.utc).isoformat()`. Owner: sam.
- [ ] **STO-4:** Ring semantics — make UNSEEN rings the accent→accent2 gradient, seen `var(--line)`, demote the add-ring to quiet + accent plus badge (`static/index.html:536-562`). Also add DS-004 fallbacks to `var(--text)`/`var(--bg2)` there. Owner: netta.
- [ ] **STO-5:** `.story-item` keyboard a11y (role=button, tabindex, Enter/Space) + seed stories get plausible `created_at` so the viewer header isn't missing its timestamp. Owner: shira.

## Stories — P2 (batch when touching the area; OW-011 — one polish pass, don't zigzag)

- [ ] **STO-6:** hold-to-pause + center-tap advance in viewer; hardcoded caption "Today's look" → empty or 1-line input; `margin-left:auto` → `margin-inline-start` in viewer head (RTL); ring thumb consistency (avatar vs story photo — pick one).
