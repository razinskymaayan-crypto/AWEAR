# INBOX — משימות לסוכנים

**איך נותנים משימה:** פשוט כתוב שורה תחת "משימות חדשות". בעברית רגילה. שורה אחת = משימה אחת.
אין צורך בתגיות, תאריכים או פורמט מיוחד. כל מה שכתוב שם — הסוכנים יעשו.

כשמסיימים, הם מעבירים את המשימה ל"הושלם" וכותבים לידה מה עשו.

═══════════════════════════════════════

## משימות חדשות

הקשר־על: יעד = דמו מלוטש. החזון המלא ב-docs/PRODUCT_VISION.md — קראו אותו לפני עבודה. עבדו לפי הסדר, משימה אחת לכל ריצה, מקצה לקצה, עם VALUE GATE אמיתי. אל תעשו סקרים/מחקר כל עוד יש כאן משימות.

★★★ [כיוון מייסד חדש — 2026-07-11 — עדיפות עליונה על הכל] ★★★
המיקוד מעכשיו הוא הליבה הטכנולוגית: **מנגנון זיהוי המוצר.** כשמשתמש מעלה פוסט או מצלם תמונה — ה-AI חייב לזהות כל פריט לבוש בצורה אמינה ולהוסיף אותו לארון. זה ה-wow וה-moat של האפליקציה. (backend/steve — זו המשימה #1 שלך, לפני כל שאר ה-backlog):
1. `/api/analyze` (app.py, Claude Vision, MODEL=claude-opus-4-8): לזהות אמין כל פריט בתמונה (ריבוי פריטים), להחזיר שדות נקיים (name, category, brand_vibe, color, search_query מדויק, price_estimate_usd). לוודא ש-search_query מספיק מדויק כדי למצוא את המוצר האמיתי גלובלית.
2. הצינור scan→closet: פריט שזוהה חייב **באמת לנחות בארון של המשתמש** (persisted). לעקוב אחרי הזרימה מ-/api/analyze → נתוני הארון, ולסגור פערים.
3. **HUMAN-IN-THE-LOOP (עקרון מרכזי — כיוון מייסד):** אל תצפו שה-AI יהיה מושלם. ה-AI עושה מעבר ראשון (מזהה מועמדים), ואז **המשתמש מאשר/מדייק/מתקן ומסמן את המקור** (מותג/חנות/פריט מדויק) — למשל בוחר מבין 2-3 התאמות, או מתקן שם, או מדביק לינק. זה (א) מקפיץ את הדיוק מיד, (ב) יוצר **סיגנל למידה** שמשפר את המודל לאורך זמן (לשמור את התיקונים של המשתמש). ה-UX: אחרי הסריקה, מסך "האם זיהינו נכון?" עם אישור/תיקון פר-פריט לפני שנכנס לארון.
4. חוסן: ריבוי פריטים, זיהוי חלקי, ו-fallback כן (לעולם לא תוצאה מזויפת; לסמן ביטחון נמוך → בקש מהמשתמש לדייק).
5. כל שינוי עם pytest (mock ל-vision; לוודא את חוזה ה-parse + closet-add + שמירת התיקון של המשתמש).
> STATUS (steve lane, 2026-07-15): backend HALF DONE and on main — items 1/2/3/5 shipped (multi-item /api/analyze + confidence contract; SQLite closet_items + POST /api/closet/confirm HITL gate + GET /api/closet; scan_corrections learning ledger; 11 pytests, commit 0151c98). THIS RUN: learning loop CLOSED — /api/analyze?user_id= now injects the user's past corrections/rejections + confirmed brands into the live Vision call and returns corrections_used (5 more pytests, 58/58). REMAINING = UI half (mark lane): post-scan "Did we get it right?" confirm screen wired to /api/closet/confirm + pass ?user_id= on scan — see notes/scan-closet-hitl-backend.md HANDOFF.

[UX-QA — mark — P1] ה-sheet של הפריט תוקן ל-iOS: (א) max-height שמבטיח פער עליון ≥56px כך שה-X מעל סרגל הסטטוס, (ב) גרירה-למטה-לסגור על כל ה-sheet (gated על scrollTop). **החל את אותו דפוס על כל שאר ה-bottom-sheets** שלא ייתקעו ב-iOS: mp-fsheet (filter), ms-insight-sheet, comments-sheet, diary-sheet, book-sheet, ו-modal-overlay (purchase-modal, edit-profile). לכל אחד: סגירה אמינה (X גלוי / גרירה / הקשה על רקע) בלי פקדים מחוץ למסך. אמת עם `node scripts/check-interactions.mjs` (הרחב אותו לפתוח כל overlay ולוודא שנסגר) + הערה שנבדק בסימולטור iOS (הטסט הדסקטופ לא תופס off-screen).


[מערכת — תהליך אוטומטי] Phase 5 (דיווח): כוונו את הדוח היומי ל-20:00 שעון ישראל (daily-report.yml / retrospective.yml), וודאו שכל הודעת סוכן בטלגרם חתומה בשם הסוכן.

[מערכת — נמצא בביקורת 2026-07-05] באג: id="wl-wrap" כפול ב-static/index.html — גם בסקציית ה-wallet (~L2745) וגם בסקציית ה-wishlist (~L2866). renderWallet תופס את הראשון; ה-wishlist מרנדר ל-#wl-list. לתקן: לתת id ייחודי לאחד מהם + grep לכל השימושים (OW-008 — לחווט לפי ה-class/id האמיתי מאתר ה-render).

[עתידי — מייסד 2026-07-11] מסכי הכניסה וההרשמה: סרטון רקע שרץ (loop, muted, autoplay) מאחורי הטופס — בסגנון Depop (fashion/lifestyle cinematic). וידאו קשור לאופנה, עם overlay כהה עדין לקריאוּת הטקסט, fallback לתמונה סטטית אם הווידאו לא נטען, וקל-משקל (לא לתקוע את הטעינה). scope: onboarding/register/login.

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
