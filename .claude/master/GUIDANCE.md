# GUIDANCE — standing founder direction (consult BEFORE asking)

**Why:** so agents ask fewer, better questions. Before writing a question to
`FOUNDER_QUESTIONS.md`, resolve the fork from: **MASTER_PLAN → docs/SURFACE_SPECS.md → this file.**
Only a genuinely unresolved DIRECTION fork becomes a question (and when still unsure, err toward
asking — OW-012).

**This file compounds:** when the founders answer a question and it states a reusable principle, that
principle is appended here (to the matching section). Over time the same class is never asked twice.
Authority to change a line here: Carmel/Razi (or Mark/Ayalon with a cited metric).

---

## Product priority & roadmap
- 🧭 **North star = The Loop works for real** (SCAN→MATCH→LOOKS→BUY→EARN). The single most valuable
  work is moving a loop stage from SEEDED to REAL. (MASTER_PLAN)
- 🧭 **Priority order:** CI-fix · answered founder directive · INBOX · advance-the-loop · bug/infra ·
  polish. **Polish is the lowest tier**, capped at 1/run, and never re-touches a done area (OW-011).
- 🧭 **MVP correctness beats polish.** A loop stage that *works* outranks a screen that *looks* nicer.
- 🧭 **Deferred (do NOT build now unless a directive says so):** on-body try-on (flat-lay only for
  now), React-Native mobile (web SPA is the surface), real payment fulfilment (in-app facade is
  enough for the demo).
- 🧭 **Demo integrity:** never show a broken image or an error in the demo path; prefer a polished
  fallback over a real-but-fragile call.

## Design taste (boundaries)
- 🎨 **Benchmark = Instagram · Pinterest · Zara.** NOT TikTok (too loud), Depop (too grungy),
  Linear/Farfetch (too cold). (DS-015)
- 🎨 **Premium but friendly, never cold.** "The image is the star — the UI is the stage." Editorial
  confidence, accessible luxury — anyone can belong.
- 🎨 **The Buy CTA stays present and prominent** — do not quiet/demote it (reverted before, hurt
  purchase-intent: SURFACE_SPECS, IDEAS #29/#31/#32).
- 🎨 **No emoji in UI chrome** — `icon()`/inline SVG only (DS-008). **No hardcoded hex** —
  `var(--token, fallback)` (DS-004). **No font-size on image containers** (DS-009).
- 🎨 **Locked per-surface decisions live in `docs/SURFACE_SPECS.md`** — treat them as taste law; do
  not re-litigate.

---

## (added as we go)
_Monetization/economics, scope/risk-tolerance, and brand-voice sections get added here when a
founder answer establishes a principle in that area._
