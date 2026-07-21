# Definition-of-Done Audit — INBOX "## הושלם" items
**Audited:** 2026-07-21 by ayalon lane  
**Method:** grep / git-log / code-presence checks  
**Purpose:** Confirm each "done" item has verifiable evidence before investor demo

---

## Summary
| # | Feature | Status | Gap |
|---|---------|--------|-----|
| 1 | AI Stylist "Today's Look" daily hero | ✅ VERIFIED | — |
| 2 | Core-screens editorial pass (Feed/Item/Profile) | ✅ VERIFIED | — |
| 3 | Public profile → real users (Tamar/Carmel/Maayan) | ✅ VERIFIED | — |
| 4 | Stories row → real users | ✅ VERIFIED | — |
| 5 | Real Claude-Vision scan e2e | ⚠️ PARTIAL | UI HITL confirm screen not shipped; live API test needs human step |
| 6 | WOW item screen (closet match + stylist looks + Where it sells) | ✅ VERIFIED | — |
| 7 | Store Insight redesign | ✅ VERIFIED | — |
| 8 | Store screenshot + feature guide (TG) | ℹ️ DOC-ONLY | No code change — TG message delivered, cannot re-verify |
| 9 | Weather feature removed from Home | ✅ VERIFIED | — |
| 10 | Nav tab order: feed → store → AI → DM → profile | ✅ VERIFIED | — |
| 11 | Analytics survey (wardrobe statistics) | ✅ VERIFIED | — |

**9 of 11 fully verified. 1 partial (action required). 1 documentation-only.**

---

## Detail

### 1. AI Stylist "Today's Look" ✅
- **Commit:** `84d3251 feat(ai-stylist): "Today's Look" daily contextual hero on the AI tab`
- **Code:** `static/app.js:2279` (shared occasion engine); `static/app.js:3190` ("Today's Look" daily hero function)
- **Gate:** Gabbana 9/10 PASS; post-fix confirmation survey `90b63d8`; check-render OK
- **Evidence:** `grep -n "Today.*Look" static/app.js` → 5 matches

### 2. Core-screens editorial pass (Feed, item sheet, profile) ✅
- **Commits:** `ac7f725` (Feed survey), `b88c5fc` (item-sheet survey), `9ccefd1` (Profile survey), `f68b70e` (ledger)
- **Gate:** Gabbana ≥8.5 for each screen; post-change confirmation surveys on record
- **Evidence:** Commit graph confirms sequential audit→fix→re-gate for all 3 screens

### 3. Public profile → real users ✅
- **Code:** `static/app.js:1461–1463` (looks with real photo paths); `static/app.js:5810–5812` (profiles cache with avatar paths for Tamar/Carmel/Maayan)
- **Gate:** Gabbana 9/10 PASS; Tamar+Carmel screenshots verified; check-render OK
- **Evidence:** `grep -n "Tamar\|Carmel\|Maayan" static/app.js` → confirmed real user data

### 4. Stories row → real users ✅
- **Commit:** `0fe5377 feat(stories): real 24h ephemeral outfit stories wired to /api/stories + full-screen viewer`
- **Code:** `static/app.js` — `renderStories` appears 8 times
- **Gate:** Gabbana 8.5 PASS; screenshot verified; commit confirmed on main
- **Evidence:** `grep -c "renderStories" static/app.js` → 8

### 5. Real Claude-Vision scan e2e ⚠️ PARTIAL
- **Backend (DONE):**
  - `app.py:706` — scan outcome recorder
  - `app.py:719` — `GET /api/scan-health` with `?probe=1` liveness check
  - `app.py:495–517` — `_corrections_context()` learning loop (scan→corrections→closet→re-injection)
  - 2 closet endpoints: `POST /api/closet/confirm` + `GET /api/closet` (`grep "@app.*closet" app.py` → 2 matches)
  - `scan_corrections` learning ledger and re-injection into LIVE Claude call
- **UI (NOT SHIPPED):**
  - "Did we get it right?" HITL confirm screen not wired in `static/app.js` (no `closet/confirm` call in JS)
  - NEEDS_YOU (2026-07-15): "prioritize the 'Did we get it right?' confirm screen going live before the meeting — the moat demo depends on it"
- **Live test gap:** Final live API smoke test requires human with `ANTHROPIC_API_KEY` (`python3 scripts/scan_smoke.py`)
- **Action needed:** Mark lane wires the HITL confirm screen (INBOX founder direction item 3, backend handoff in `notes/scan-closet-hitl-backend.md`). Human runs `scan_smoke.py` on keyed box to confirm LIVE mode.

### 6. WOW item screen ✅
- **Code:**
  - `static/app.js:314` — brand wordmark SVGs for "Where it sells" rows
  - `static/app.js:357` — `storeRowHTML()` retailer row builder
  - `static/app.js:378–381` — `buy_options` resolution (API → fallback)
  - `static/app.js:643–658` — "Where it sells" block (retail rows + Depop resale row)
- **Gate:** Gabbana 8.5 PASS; check-render green; sheet screenshot verified; commit `44f5919`
- **Evidence:** `grep -c "storeRowHTML\|Where.*sells\|buy_options" static/app.js` → multiple matches

### 7. Store Insight redesign ✅
- **Code:**
  - `static/app.js:4441` — `#ms-insight-btn` click → `openStoreInsight`
  - `static/app.js:5295–5341` — full `ms-insight-sheet` render (Store Health, KPIs, recommendation cards)
  - `static/app.js:5614` — insight button in My Store header
- **Gate:** Gabbana 9.5; check-render OK
- **Evidence:** `grep -c "ms-insight" static/app.js` → 8 matches

### 8. Store screenshot + feature guide ℹ️ DOC-ONLY
- No code change — this was a Telegram message with a screenshot and written guide
- Cannot re-verify from git (TG messages are ephemeral); accepted as delivered

### 9. Weather feature removed ✅
- **Evidence:** `grep -c "fetchWeather\|weather-card\|weather_card\|moreWeather" static/app.js` → **0**
- Weather card HTML, CSS, and `fetchWeather` JS confirmed absent from the codebase

### 10. Nav tab order (feed → store → AI → DM → profile) ✅
- **Code:** `static/index.html:276–280`
  ```
  data-view="feed"        → Feed
  data-view="marketplace" → Store
  data-view="outfits"     → AI
  data-view="dm"          → DM
  data-view="closet"      → Profile
  ```
- Order matches the founder-specified sequence exactly

### 11. Analytics survey (wardrobe statistics) ✅
- **Code:**
  - `static/app.js:2854` — `renderAnalytics()`
  - `static/app.js:2880` — `utilizationPct` (real computation from closet data)
  - `static/app.js:2905–2908` — rewear ratio vs community (disambiguation documented in comment)
  - `static/app.js:2915–2916` — composite `healthScore` (utilization 40% + active-wear 30% + rewear 30%)
- **Gate:** Gabbana 8.5; charts + doc sent to Telegram
- **Evidence:** `grep -n "healthScore\|rewear\|utilization" static/app.js` → confirmed real computation

---

## Action items for other lanes

| Priority | Lane | Action |
|----------|------|--------|
| P0 (blocks moat demo) | mark / valentino | Wire "Did we get it right?" HITL confirm screen → `POST /api/closet/confirm`; pass `?user_id=` on scan. Handoff spec: `notes/scan-closet-hitl-backend.md` |
| P0 (founder-gated) | human (Carmel) | Run `python3 scripts/scan_smoke.py` on box with `ANTHROPIC_API_KEY` set to confirm LIVE Claude Vision mode |

---

*This audit supersedes "I think it works" — evidence cited per OW-002.*
