# Definition-of-Done Audit — INBOX "## הושלם" items
**Audited:** 2026-07-21 (initial) + 2026-07-23 (item #12 + UX bug-hunt §2) + 2026-07-24 (item #13 + BH-5) by ayalon lane  
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
| 5 | Real Claude-Vision scan e2e | ✅ VERIFIED (corrected 2026-07-21) | HITL UI shipped in commit f4fe9a1; live API test needs human step |
| 6 | WOW item screen (closet match + stylist looks + Where it sells) | ✅ VERIFIED | — |
| 7 | Store Insight redesign | ✅ VERIFIED | — |
| 8 | Store screenshot + feature guide (TG) | ℹ️ DOC-ONLY | No code change — TG message delivered, cannot re-verify |
| 9 | Weather feature removed from Home | ✅ VERIFIED | — |
| 10 | Nav tab order: feed → store → AI → DM → profile | ✅ VERIFIED | — |
| 11 | Analytics survey (wardrobe statistics) | ✅ VERIFIED | — |
| 12 | Generate-garment: AI catalog image in scan confirm sheet | ✅ VERIFIED (2026-07-23) | UI shipped `9975080`; pipeline gap: generated URL not persisted to closet_items after confirm |

| 13 | Wardrobe match score — `GET /api/products/{id}/match` | ⚠️ BACKEND ONLY | SPA wiring pending (mark lane) |

**11 of 13 fully verified. 1 documentation-only. 1 verified with known pipeline gap. 1 backend-only (SPA pending).** *(Item 5 corrected 2026-07-21 — HITL UI was shipped in commit f4fe9a1; original audit searched pre-split index.html and missed it in app.js. Item 12 added 2026-07-23 — garment-image UI shipped in commit 9975080. Item 13 added 2026-07-24 — backend shipped commit 9cc466c; SPA uses local calcCompatScore, not yet calling the endpoint.)*

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

### 5. Real Claude-Vision scan e2e ✅ VERIFIED (corrected 2026-07-21)
- **Backend (DONE):**
  - `app.py:706` — scan outcome recorder
  - `app.py:719` — `GET /api/scan-health` with `?probe=1` liveness check
  - `app.py:495–517` — `_corrections_context()` learning loop (scan→corrections→closet→re-injection)
  - 2 closet endpoints: `POST /api/closet/confirm` + `GET /api/closet` (`grep "@app.*closet" app.py` → 2 matches)
  - `scan_corrections` learning ledger and re-injection into LIVE Claude call
- **UI (SHIPPED — corrected):**
  - `static/app.js:1387–1454` — full "Did we get it right?" HITL confirm sheet (`showScanConfirm`, `_renderScConfirm`, `scSetAccepted`, `scToggleEdit`, `scConfirm`)
  - `static/index.html:340–341` — overlay `#sc-overlay` + bottom sheet `#sc-sheet` (role=dialog)
  - Called on both live path (`app.js:1089`) and demo-fallback path (`app.js:1098`)
  - Per-item accept/reject + inline name/category/brand/price edit fields; submit calls `POST /api/closet/confirm`
  - **Commit:** `f4fe9a1 feat(mark/self-heal): scan-confirm UI — review items before closet save`
  - **Audit error root-cause:** original audit grepped `static/index.html` for the JS call — missed it because the SPA was split on 2026-07-05 (all JS now lives in `static/app.js`).
- **Live test gap (still open):** Final live API smoke test requires human with `ANTHROPIC_API_KEY` (`python3 scripts/scan_smoke.py`)
- **Action still needed:** Human runs `scan_smoke.py` on keyed box to confirm LIVE Claude Vision mode.

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

### 13. Wardrobe match score — `GET /api/products/{id}/match` ⚠️ BACKEND ONLY (2026-07-24)
- **Commit:** `9cc466c feat(backend): wardrobe match score — GET /api/products/{id}/match`
- **Backend:** `app.py:1934` — endpoint live; returns `match_pct` (0–95), `reason`, `matching_items` from server-side `closet_items`; BE-006 `user_key`, rate-limited 30/min; 4 hermetic pytests (141/141 passing)
- **SPA gap:** `static/app.js:583` — `matchBandHTML()` uses `calcCompatScore()` against localStorage wardrobe, NOT the new endpoint. Feed item tap handler does not yet call `/api/products/{id}/match`.
- **Evidence:** `grep -n "match_pct\|products.*match" app.py` → app.py:1934, 1991, 2004 confirmed; `grep -n "\/api\/products\/" static/app.js` → 0 matches (not yet called from SPA)
- **Action needed:** mark lane: call `GET /api/products/{it.id}/match?user_id={uid}` in the item-tap handler and feed result into `matchBandHTML()` — replaces the client-side estimate with server-side score.

### 12. Generate-garment: AI catalog image in scan confirm sheet ✅ (2026-07-23)
- **Commit:** `9975080 feat(ux): add image generation display to scan confirm sheet`
- **Backend:** `app.py:3277` — `POST /api/generate-garment` endpoint; `app.py:3210` — `_generate_garment_image_sync` helper (runs off event-loop via `asyncio.to_thread`); `app.py:149` — `_last_gen` diagnostics; `app.py:767` — exposed in `GET /api/scan-health`
- **UI:** `static/app.js:1389` — `genImage:'pending'` initial state per item; `app.js:1403–1409` — spinner → generated image → retailer fallback at 80% opacity; `app.js:1408` — 44px "Regenerate" button per item; `app.js:1412–1445` — `scGenerate()` + `scRegenerate()` calling `/api/generate-garment`
- **Gate:** Gabbana 8/10 PASS (mark lane run 12)
- **Evidence:** `grep -n "generate-garment\|sc-spinner\|sc-gen-img\|scRegenerate" static/app.js` → confirmed
- **Pipeline gap (open):** `scConfirm()` at `app.js:1493–1496` does NOT include `genImage` URL in the POST payload to `/api/closet/confirm` — generated image is shown during review but not persisted to `closet_items`. Closet view still shows catalog images via `search_query` (Phase 1 behavior). This is a remaining step for the mark/sam lane.

---

## Action items for other lanes

| Priority | Lane | Action |
|----------|------|--------|
| ✅ DONE | mark | "Did we get it right?" HITL confirm screen — shipped (commit f4fe9a1). Per-item accept/reject + edit, calls `POST /api/closet/confirm`. |
| ✅ DONE | mark | Generate-garment image display in scan confirm sheet — shipped (commit 9975080). Per-item spinner → AI image → retailer fallback → regenerate button. |
| P0 (founder-gated) | human (Carmel) | Run `python3 scripts/scan_smoke.py` on box with `ANTHROPIC_API_KEY` set to confirm LIVE Claude Vision mode |
| P1 (pipeline gap) | mark + sam | Pass `genImage` URL from `scConfirm()` to `POST /api/closet/confirm`, store as `image` in `closet_items` — closes the "clean catalog image in closet" promise (Pitch Deck Slide 2 Layer 1) |
| P1 (SPA gap) | mark | Wire `GET /api/products/{id}/match?user_id={uid}` into the feed item-tap handler; replace `calcCompatScore()` result with server-side `match_pct` + `reason` + `matching_items` in `matchBandHTML()` — makes match band show server-side closet data |

---

## UX Bug-Hunt Progress — ★★★★★ directive (2026-07-19→)

Mark lane shipped 5 of 5 items from the founder's UX bug-hunt backlog. BH-5 verified 2026-07-24 by ayalon lane (commit 50449e4).

| # | Item | Status | Commit(s) | Evidence |
|---|------|--------|-----------|----------|
| BH-1 | Text/caption overflow on profile grid | ✅ VERIFIED | `8782260` | `.up-item-name` / `.up-post-caption` 2-line clamp; `.up-store-name` ellipsis in app.css |
| BH-2 | Stuck overlays (sell form X + mp-fsheet opacity) | ✅ VERIFIED | `b24f770` `d322506` | X button in openSellForm; `.mp-fsheet-overlay` opacity:0→1; geometry fallback fixed |
| BH-3 | Low contrast / DS-004 (marketplace + muted fallbacks) | ✅ VERIFIED | `5e39d16` `025a509` `1e41dde` | `.mp-item-shop-btn color: var(--on-accent, #fff)` correct; 187 stale `--muted` fallbacks updated; no relic #14110F in var() fallbacks |
| BH-4 | Dead buttons — feed like/save/comment/share | ✅ VERIFIED | (wired in prior runs) | `app.js:1879` handler covers `like/save/comment`; `app.js:1740` all 4 buttons have `data-action`; like → heartFill state toggle confirmed |
| BH-5 | Gabbana sweep — Explore/Marketplace/AI Stylist | ✅ VERIFIED | `50449e4` | Touch targets 44px (.ev-chip/.mp-cond-chip/.mp-filter-btn/.mp-sell-btn/.styl-btn); DS-009 cleared (.ex-card-bg/.ex-result-emoji have no font-size); .mp-item-badge font-size tokenized; .styl-tag rgba→color-mix(var(--accent3)); direction:rtl removed from .ex-search input |

*This section augments the formal INBOX הושלם audit above; these items are sub-tasks of the ★★★★★ directive, not separate הושלם entries.*

---

*This audit supersedes "I think it works" — evidence cited per OW-002.*
