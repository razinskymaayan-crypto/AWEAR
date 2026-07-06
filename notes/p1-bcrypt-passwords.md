# P1 — bcrypt password hashing (steve lane, 2026-07-06)

Task: assignments/steve.md item 3 — replace unsalted SHA-256 (`_pw_hash`) with bcrypt + per-user salt, migration path, pytest fail-before/pass-after.

## Result — DONE (sam)
- `app.py`: `_pw_hash` → `bcrypt.hashpw(pw, gensalt())`; new `_pw_verify` (bcrypt via `$2` prefix, legacy SHA-256 via `hmac.compare_digest`); login switched from hash-equality SELECT to fetch-by-email + verify; successful legacy login self-heals row to bcrypt in the same transaction. Auth header comment updated.
- `requirements.txt`: `bcrypt>=3.2` (CI runner ships 3.2.2; >=4.0 would force a fresh wheel build for nothing).
- `tests/test_app.py`: +3 tests (salted-hashes-differ+`$2` prefix, login round-trip incl. wrong-password 401, legacy-row migrates on login). Fail-before proven: old `_pw_hash` returns identical unsalted digest → test (a) asserts fail.
- Verified: `python3 -m py_compile` OK; `python3 -m pytest -q` 33/33; `npm run check-render` green; `git diff` touches only the 3 permitted files.
- Gotcha (worth a be.md learning when `.claude/` writes reopen): fail-before via copying old app.py to a temp dir — pytest's sys.path put repo root first and silently re-imported the FIXED module; verify `appmod.__file__` before trusting a fail-before run.

## PENDING META-UPDATES — blocked by the known `.claude/` write-permission issue (NEEDS_YOU.md 2026-07-05 entry). Apply these when writes reopen (next run: check first, apply, then delete this section):

1. `.claude/agents/assignments/steve.md` — check off item 3:
   `## [x] P1 — Passwords are unsalted SHA-256`
   `> DONE 2026-07-06 (sam, branch auto/steve): _pw_hash → bcrypt per-user salt (bcrypt>=3.2 in requirements.txt); login = fetch-by-email + _pw_verify (bcrypt $2 sniff / legacy SHA-256 constant-time); legacy login self-heals row to bcrypt. 3 new pytests, fail-before proven, suite 33/33.`

2. `.claude/agents/activity_log.md` — append:
   `| 2026-07-06 | sam (steve lane) | auto/steve / app.py + tests/test_app.py + requirements.txt | done | P1 bcrypt: _pw_hash -> bcrypt per-user salt; login fetch-by-email + _pw_verify (legacy SHA-256 constant-time + self-healing rehash on login); 3 new pytests, fail-before proven, suite 33/33 |`

3. `.claude/agents/contributions/2026-07-06.md` — append:
   `| 12:10 | sam | steve | ~74k | bcrypt password upgrade: app.py hash/verify/login + 3 pytests + requirements.txt |`
   `| 11:45 | steve | steve | ~40k | rejection triage (out-of-lane already resolved by merge), gate analysis, task coordination, verify, commit |`

4. `.claude/agents/knowledge/OW.md` + INDEX row — NEW CODE OW-013 (rejection→learning for the 2026-07-06 04:40Z jeff REJECT "out-of-lane files: static/app.css static/app.js static/index.html"):

   ### OW-013 | Lane scope = hard boundary — diff נגד main לפני commit, לא רק כוונה
   **מקור:** jeff-merge rejection של steve lane (2026-07-06 04:40Z) — הריצה נגעה ב-`static/app.css`/`static/app.js`/`static/index.html` (קבצי mark lane) והעבודה כולה נדחתה בשער, כולל החלקים התקינים.
   **לקח:** lane ownership נאכף דטרמיניסטית (jeff GATE 0). קובץ אחד מחוץ ל-lane = כל ה-branch נדחה. "רק חיווט קטן ב-UI כדי לחבר את ה-backend" הוא בדיוק המקרה — החיווט שייך ל-lane של הקובץ, ומועבר כ-follow-up בהערת ה-assignment/activity_log.
   **מנגנון:** לפני commit ב-lane אוטונומי — `git diff origin/main...HEAD --name-only` וודא שכל קובץ ברשימת ה-OWNS של ה-lane (+ קבצי meta מותרים per SHARED regex ב-jeff-merge.yml). קובץ זר → `git checkout origin/main -- <file>` והעבר את הצורך כ-follow-up ל-lane הנכון.

   INDEX row (under OW-012):
   `| OW-013 | Lane scope = hard boundary — diff נגד main לפני commit; קובץ זר → checkout מ-main + follow-up | [[OW.md]] |`

   Note: the out-of-lane files themselves were already purged from auto/steve by the 10:52 merge with main (verified: `git diff origin/main...HEAD --name-only` shows only in-lane files) — the learning entry is the only remaining piece of the rejection protocol.

5. `.claude/agents/knowledge/be.md` — candidate learning from sam (text in "Gotcha" above): hash-scheme migration pattern (format-sniff + verify-in-Python + self-heal on login) and the pytest sys.path fail-before gotcha.
