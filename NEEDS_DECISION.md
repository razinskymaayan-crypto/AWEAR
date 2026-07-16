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

### 6. Investor-deck unit economics — honest model applied (2026-07-14, ayalon/tobi)
The deck claimed contribution ~$11/user/month, LTV/CAC >4x today, M18 $800K ARR base — numbers Tobi's diligence analysis (`.claude/master/strategy/05-unit-economics.md`) shows are off by ~20-40× and would burn investor trust. FOUNDER_QUESTIONS item open since 2026-07-06, meeting in 2-4 weeks.
- **Options**: (a) keep the old headline numbers; (b) honest framing — $2.98 net/attributed order, ~80% GM, staged 4-phase engine, M12 $60-160K ARR base / $800K upside, D30 ≥10%.
- **Recommendation & default applied**: (b) — applied to `docs/PITCH_DECK.md` + `docs/BUSINESS_PLAN.md`, both flagged in-doc as pending your override. Sub-decision bundled: AWEAR Pro $5.99/mo shown as Phase 2 marked "⚠️ pending founder approval". MASTER_PLAN חלק ז' still has old numbers (out of lane) — sync after your call.

### 7. Pitch-deck Slide 3 moat edits — analysis done, deck deliberately NOT touched (2026-07-15, ayalon/bernard)
Strategy riddle 06 (`.claude/master/strategy/06-moat-differentiation.md`) is now written — the adversarially-tested moat thesis behind Slide 3. It flags 4 deck tensions: (1) "Moat #2 — agentic company" should be relabeled "Advantage #2" (execution advantage, not a moat — a sharp investor will say it first); (2) speaker-note phrase "data you can't scrape or buy" reads as an aggregate-dataset claim that dies at small N — replace with "the moat grows with each user's tenure, not total user count"; (3) positive update: the correction-ledger flywheel is now shipped server-side (2026-07-15) — Slide 3 may honestly say "runs in code today"; (4) add a "Whering + Google money" row to the risks appendix (they raised $7M from eBay Ventures + Google AI Futures on 2026-07-07 at 10M users).
- **Options**: (a) approve all 4 edits (~1 hour, ayalon lane applies next run); (b) approve subset; (c) leave deck as-is.
- **Recommendation**: (a). **Default applied**: deck left untouched — Slide 3 was edited 3 runs in a row (oscillation guard) and the doc itself marks these as needing your call. Also decide riddle-06 rec: name Whering + its raise proactively in the meeting (recommended: yes).

### 8. Company structure + raise instrument — riddle 08 written, 6 decisions before the meeting (2026-07-16, ayalon/bernard)
Strategy riddle 08 (`.claude/master/strategy/08-company-legal-fundraising.md`) is now written — incorporation, instrument, tax hygiene, and the raise narrative behind the $70-80K ask, adversarially tested and web-verified (2026 facts cited inline). Locked decisions (ask size, riddle-05 numbers, deck) untouched.
- **Decisions**: (1) incorporation — Israeli Ltd. now, Delaware flip only on a US-lead trigger; (2) instrument — post-money SAFE, $3M cap (negotiation range $2.5-4M), no discount, MFN, 36-month date-conversion fallback, drafted to the ITA SAFE safe-harbor; (3) book a startup lawyer + accountant session THIS WEEK (registration, founders' agreement, IP assignment, SAFE draft) — human-only, no default possible; (4) proactively offer the uncle an accountant check on the Angels-Law up-to-~33% credit (expires 2026-12-31; may require shares → the one scenario reviving a minimal priced round); (5) reserve a 10% ESOP pool in the charter at incorporation; (6) IIA/Tnufa grants — recommendation: reject (royalties + IP-in-Israel lock that taxes a future flip).
- **Recommendation & default applied**: all six as stated above are the narrative defaults in the riddle doc; nothing signed or filed — (3) cannot be defaulted and blocks the rest. Real lawyer/accountant review required before any signature.

## Answered
(none yet)
