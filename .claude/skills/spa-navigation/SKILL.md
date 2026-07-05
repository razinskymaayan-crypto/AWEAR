---
name: spa-navigation
description: Orientation map for AWEAR's static/index.html — an ~11,800-line vanilla JS SPA. Use before editing any frontend code to find the right function, HTML target, line range, or pattern. Covers view routing, render function map, i18n, localStorage state, and the global const/let order critical for TDZ safety. Not for backend (app.py) or mobile/ work.
allowed-tools: Read, Grep, Glob, Bash
---

# SPA Navigation — static/index.html

11,754 lines · ~296 functions · vanilla JS/HTML/CSS · no build step · served by FastAPI.

> **Verified 2026-07-05 against 11,754 lines. Line numbers drift — trust the grep pattern; the number is only a hint (grep is the truth).** If `wc -l static/index.html` differs by more than ~200 lines, regenerate this skill.

Patterns detail — adding a view, render-function template, i18n, localStorage helpers, TDZ
declaration map, key helpers — lives in **`function-map.md` in this skill dir**.

## File Structure — where you are

| Zone | ~Lines | Find it with |
|------|--------|--------------|
| CSS (`<style>`) | 15–2702 | `grep -n "^<style>\|^</style>" static/index.html` |
| HTML views (`<main>`) | 2717–2957 | `grep -n "<main id=\|</main>" static/index.html` |
| Bottom nav (`<nav>`) | 2959–2966 | `grep -n "data-view=" static/index.html \| head -6` |
| JS (`<script>`) | 3050–11752 | `grep -n "^<script>\|^</script>" static/index.html` |

## The Only Router: `showView(name)` — `grep -n "function showView"` (~L3316)

Every screen transition goes through one function. It:
1. Toggles `.active` on `<section class="view" id="name">` elements and nav buttons
2. Calls the render/init function for that view
3. Sets `feed-mode` / `chat-mode` class on `<main>`, hides nav for chat, updates `VIEW_TITLES` header

**To navigate programmatically:** call `showView('viewname')`. Never toggle `.active` directly.

**Default view is `feed`** (not home): `<section id="feed" class="view active">`, booted by `requestAnimationFrame(() => showView('feed'))` — `grep -n "Auto-render feed on load"` (~L5020).

---

## View Map — all 22 screens

Sections: `grep -n '<section id=.*class="view'` (~L2719–2956)

| `showView(name)` | Function | ~Line | Grep pattern | Render target |
|-----------------|----------|-------|--------------|---------------|
| `home` | `renderHome()` | 5292 | `"function renderHome"` | `#home-wrap` |
| `closet` | `renderCloset()` | 4314 | `"function renderCloset"` | `#closet-body` |
| `feed` | `renderFeed()` | 4699 | `"function renderFeed"` | `#feed-scroll` |
| `explore` | `initExplore()` | 9561 | `"function initExplore"` | `#ex-wrap` |
| `analytics` | `renderAnalytics()` | 5830 | `"function renderAnalytics"` | `#analytics-wrap` |
| `season-recap` | `renderSeasonRecap(getActiveSeason())` | 5558 | `"function renderSeasonRecap"` | `#season-recap-wrap` |
| `outfits` | `initOutfitGen()` | 6142 | `"function initOutfitGen"` | `#og-wrap` |
| `rewards` | `renderRewards()` | 6724 | `"function renderRewards"` | `#rw-wrap` |
| `wallet` | `renderWallet()` | 6795 | `"function renderWallet"` | `#wl-wrap` (see ⚠ below) |
| `agents` | `renderAgents()` | 6877 | `"function renderAgents"` | `#agents-wrap` |
| `sustainability` | `renderSustainability()` | 6970 | `"function renderSustainability"` | `#sus-wrap` |
| `marketplace` | `renderMarketplace()` | 7157 | `"function renderMarketplace"` | `#mp-wrap` |
| `publicclosets` | `renderPublicClosets()` | 8835 | `"function renderPublicClosets"` | `#pc-wrap` |
| `seasonal` | `renderSeasonalReport()` | 8921 | `"function renderSeasonalReport"` | `#sr-wrap` |
| `wishlist` | `renderWishlist()` | 9085 | `"function renderWishlist"` | `#wl-list` |
| `chat` | `initChat()` | 9172 | `"function initChat"` | `#chat-messages` |
| `dm` | `renderDM()` | 9325 | `"function renderDM("` | `#dm-outer` (list ~9330 / thread ~9393) |
| `admin` | `renderAdminDashboard()` | 10871 | `"function renderAdminDashboard"` | `#adm-wrap` |
| `stylists` | `renderStylistMarketplace()` | 10949 | `"function renderStylistMarketplace"` | `#styl-wrap` |
| `shopping` | `initShoppingFeed()` | 11086 | `"function initShoppingFeed"` | `#shopping` section |
| `compare` | `initCompare()` | 11160 | `"function initCompare"` | `#cmp-wrap` |
| `user-profile` | `renderUserProfile()` | 11416 | `"function renderUserProfile"` | `#up-wrap` |

⚠ **Duplicate id gotcha:** both the wallet section (~L2745) and wishlist section (~L2866) contain a `<div id="wl-wrap">`. `getElementById` returns the wallet one (first in DOM); wishlist renders into `#wl-list` instead. Don't add a third.

---

## TDZ Safety — the one rule to never break

`showView('feed')` fires at startup, so any global `const`/`let` that startup rendering touches
must be declared **above** that line (`grep -n "Auto-render feed on load"`). **Safe zone for a new
global constant:** right after the localStorage helpers (`grep -n "const WARDROBE_KEY"`), before
`renderCloset()`. `function` declarations hoist; `const`/`let` do not.

Full declaration-order map + localStorage helpers + render pattern + i18n: **`function-map.md`**.
See also the `js-tzdead-zone` skill for the incident story and audit recipe.

## Quick anchors

- `esc()` / `attr()` — `grep -n "function esc("` — always escape user-visible / attribute values
- `icon(name, size)` — `grep -n "function icon("` — ICONS object has ~67 entries; check before adding SVG
- `t(key, vars?)` — `grep -n "function t("` — new strings go in both `static/i18n/en.json` + `he.json`
- Event delegation — `grep -n "dataset.action"` — ~108 `data-action` attributes in the wild
