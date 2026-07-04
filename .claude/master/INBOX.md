# INBOX — משימות לסוכנים

**איך נותנים משימה:** פשוט כתוב שורה תחת "משימות חדשות". בעברית רגילה. שורה אחת = משימה אחת.
אין צורך בתגיות, תאריכים או פורמט מיוחד. כל מה שכתוב שם — הסוכנים יעשו.

כשמסיימים, הם מעבירים את המשימה ל"הושלם" וכותבים לידה מה עשו.

═══════════════════════════════════════

## משימות חדשות

הקשר־על: יעד = דמו מלוטש. החזון המלא ב-docs/PRODUCT_VISION.md — קראו אותו לפני עבודה. עבדו לפי הסדר, משימה אחת לכל ריצה, מקצה לקצה, עם VALUE GATE אמיתי. אל תעשו סקרים/מחקר כל עוד יש כאן משימות.


[מערכת — תהליך אוטומטי] Phase 5 (דיווח): כוונו את הדוח היומי ל-20:00 שעון ישראל (daily-report.yml / retrospective.yml), וודאו שכל הודעת סוכן בטלגרם חתומה בשם הסוכן.

[מערכת — נמצא בביקורת 2026-07-05] באג: id="wl-wrap" כפול ב-static/index.html — גם בסקציית ה-wallet (~L2745) וגם בסקציית ה-wishlist (~L2866). renderWallet תופס את הראשון; ה-wishlist מרנדר ל-#wl-list. לתקן: לתת id ייחודי לאחד מהם + grep לכל השימושים (OW-008 — לחווט לפי ה-class/id האמיתי מאתר ה-render).

═══════════════════════════════════════

## הושלם
- AI Stylist daily look — done (Phase 1): shipped "Today's Look" daily contextual hero at top of the AI tab — adapts to real day-of-week + hour (shared occasion engine reused from home), builds a look from the user's own closet, quiet "See the full look" CTA, graceful empty state; surfaced Chat-with-Abigail + Style-Swipe as secondary entries beneath it. Gabbana 9/10 PASS, check-render OK, screenshot verified. Premium quota documented (3 free looks/day, IDEAS #35). NOTE: chat already existed; Tinder-style LOOK swiping (vs the existing taste-archetype swipe) is deferred to Phase 2 (IDEAS #36) — task NOT fully closed on that sub-feature.
- Core-screens editorial pass (Feed, item sheet, profile) — DONE. All three brought to Zara×Vogue minimal-premium, each Gabbana 8.5+ across audit→fix→re-gate. Item-detail sheet (this run): killed pink-glow Buy CTA + rainbow gradient price, weight-700 ceiling, off-token→DS tokens, light-mode color-bug fix; confirmation survey 6.5→8.06 no SEVERE. (Feed + Profile passes done in prior runs.)
- Public profile → real users — done (rewrote bios for Tamar/Carmel/Maayan to on-brand vibes; populated each public profile Posts grid with their REAL look photos via a profile-only manifest — Tamar 3, Maayan 3, Carmel 12 — seeded posts first, deduped image-only tiles, no fabricated items/prices, global feed untouched; Gabbana fixes: scrim-pill likes badge for contrast over light/dark photos, "More looks coming" filler for sparse grids, "Shop this look — coming soon" row on image-only sheets; Gabbana 9/10 PASS, check-render OK, Tamar+Carmel screenshots verified).
- Stories row → real users — done (replaced 6 fictional stories with Add story + Tamar/Carmel/Maayan real avatar photos; tap opens each user's public profile; fixed avatar/initials overlap CSS; Gabbana 8.5 PASS, screenshot verified).
- Real Claude-Vision scan e2e — done (agent side complete: verified full wiring camera->/api/analyze->structured Claude Vision->closet->buy_options + correct GA SDK call shape; added GET /api/scan-health?probe=1 liveness check that proves the key is actually VALID, /api/analyze beta-parse fallback so an older deploy SDK runs LIVE not demo, scan_smoke.py one-command LIVE/DEMO+key_valid check. Final LIVE confirmation is a human one-command step on the keyed box — see TODO_FOR_TAMAR/NEEDS_YOU).
- WOW item screen (founder #1) — done (all 3 chunks now ship in the feed item bottom sheet: (1) prominent % closet-match band, (2) 2-3 stylist looks pairing the item with the user's own closet pieces, (3) NEW "Where it sells" buy-to-source block — "From $X" headline + real retailer rows via storeRowHTML + one subtle Depop resale row at 50% — footer Buy-at-source intact. Chunk 3 routed mark->valentino, Gabbana 8.5 PASS, check-render green, sheet screenshot verified).
- Store Insight redesign — done (rebuilt the My Store Insight sheet from a stats-duplicate into an actionable advisor: Store Health score + 3 distinct KPIs, a "Do next" stack of recommendation cards — refresh stale listings, complete incomplete listings, fix pricing outliers, list unworn closet items — a conversion funnel with a diagnostic line, and a weekly sales goal. Removed the duplicated Performance/Audience/Category/Top-performer blocks. Gabbana 9.5, check-render OK).
- צילום מסך החנות + הסבר על כל פיצ'ר — done (sent Telegram: Store screenshot + full feature guide covering Shop/Community/My Store tabs, search, AI Stylist bar, category filters, Filter & Sort sheet, Matches My Closet, product-card badges/compat/CO2, and seller storefront).
- הסרת פיצ'ר מזג האוויר מדף הבית — done (removed weather card HTML/CSS + fetchWeather JS from home view; tightened greeting spacing).
- שנו את סדר הטאבים בניווט התחתון: feed, store, AI, DM, profile — done (commit 91d29f7: nav reordered, Feed is now default).
- סקר משתמשים על סטטיסטיקת הארון (Analytics) — done (100-expert panel ≈6.4/10; shipped 5 fixes: conic progress-arc rings, actionable Health hint, utilization/rewear disambiguation, Hidden Cost→sell, tap feedback; Gabbana 8.5; charts+doc to Telegram).
