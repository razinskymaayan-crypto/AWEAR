# NEEDS_DECISION — founder decisions required

> Rule: work never blocks on these. Each item has a best-guess default that is already applied; a founder answer overrides it. Answered items move to the bottom with the decision recorded.

## Open

### 1. Rotate credentials (hygiene, not breach)
`.env` (ANTHROPIC_API_KEY, GMAIL_APP_PASSWORD) and Google OAuth JSONs are **NOT in git** (verified — gitignored, untracked), but they live in plaintext in the repo directory on this machine.
- **Options**: (a) rotate all keys now; (b) leave as-is.
- **Recommendation**: (a) — cheap insurance before this skeleton is cloned to 5 projects.
- **Default applied**: none (human-only action; nothing for agents to do).

### 2. Untrack `data/awear.db`
Tracked in git despite `.gitignore` declaring it "regenerated, not source of truth". Untracking means fresh clones start with an empty DB built by `_init_db()` + seed JSONs.
- **Options**: (a) `git rm --cached data/awear.db`; (b) keep tracking as demo snapshot.
- **Recommendation & default applied**: (a), in Phase 9. If demo data in the DB matters, say so and we keep (b).

### 3. mobile/ — archive or keep dormant
Dormant since 2026-06-28; web-first is the locked strategy.
- **Options**: (a) keep in place, dormant, docs tightened; (b) move to `archive/mobile` branch and delete from main.
- **Recommendation & default applied**: (a) — cheap to keep, tokens.js chain still referenced by the design-token SoT.

### 4. Agent resume cadence (after overhaul)
Agents were paused for quota burn. When resumed, current cadences (engine ~15min, lanes */30, telegram-poll */2min) will burn again.
- **Options**: (a) resume with reduced cadence — engine hourly, lanes every 2-3h, telegram-poll */10min; (b) resume as-was; (c) stay paused until founders decide.
- **Recommendation**: (a). **Default applied**: (c) — I will prepare the cadence table in the workflows but leave `.agents_paused` in place.

### 5. index.html modularization — separate project?
11,754-line single-file SPA. Splitting into ES modules is high-risk (TDZ, load order) and out of scope for this overhaul.
- **Options**: (a) dedicated future project with the new eval/verify harness as safety net; (b) fold into this overhaul.
- **Recommendation & default applied**: (a) — Phase 9 only adds section markers + navigation map updates.

## Answered
(none yet)
