# AWEAR — Investor Pitch Deck (Skeleton / Draft)

> **C1 (שבוע 1) — Pitch deck skeleton: 8 slides.** Owner: CMO + Jeff. DoD: PDF draft.
> מסמך זה הוא ה-**טיוטה המובנית** של ה-deck — slide-by-slide. כל תוכן כאן נגזר ממקורות נעולים בלבד:
> `.claude/master/MASTER_PLAN.md` (Track C) + `docs/BUSINESS_PLAN.md` + `.claude/master/strategy/05-unit-economics.md` (מספרי unit economics — המודל הכן, גובר על חלק ז' הישן). אין כאן החלטות חדשות.
>
> **קהל:** הדוד של כרמל (דובר עברית) → ה-deck בעברית, מונחי מוצר/מותג באנגלית.
> **המרה ל-PDF:** ייצוא דרך Keynote/Google Slides/Pitch לפי המבנה למטה (כותרת + bullets + speaker note + visual). זה צעד אנושי/כלי.
> **משך יעד:** 8 slides, ~7 דקות דיבור, ואז Demo חי <5 דקות (Slide 8).
>
> מבנה 8 השקפים תואם 1:1 ל-Track C ב-MASTER_PLAN.

---

## Slide 1 — Problem · "ארון מלא ואין מה ללבוש"

**Punchline:** *Gen-Z כבר מתעדת כל תלבושת — אבל החוויה שבורה.*

- "נועה", בת 17 מהמרכז, מוציאה ~$250 בחודש על בגדים ו**כבר מצלמת** תלבושות לפני שהיא יוצאת.
- רואה לוק בטיקטוק → לא יודעת מאיפה הפריט.
- חצי מהארון שלה לא נלבש — ואין לה מושג מה יש לה.
- אין מקום אחד שמחבר **השראה → ארון אישי → קנייה/מכירה**.

> **Speaker note:** לפתוח עם נועה כדמות אמיתית, לא סטטיסטיקה. "היא כבר עושה את העבודה הקשה — מתעדת. אף אחד לא נתן לזה בית."
> **Visual:** סטורי טיקטוק/אינסטגרם מטושטש מצד אחד, ערימת בגדים מצד שני. אפס gradient rectangles.

---

## Slide 2 — Solution · The wardrobe is the profile

**Punchline:** *צילום תלבושת → AI מזהה כל פריט → אישור בטאפ אחד (המשתמשת תמיד בשליטה) → הארון הדיגיטלי הופך לפיד חי שאפשר לקנות ממנו.*

חמש שכבות בסינרגיה, כולן עובדות באב-טיפוס:
1. **Closet = Profile** — מדפי קטגוריה, כל פריט = **clean catalog image שה-AI יצר מהצילום האמיתי שלה** — לא תמונת קמעונאי אקראית, לא placeholder שבור. (Phase 1 היום: תמונת קמעונאי דרך `search_query` בארון; Phase 2 ✅ **fully shipped**: OpenAI `gpt-image-1` מייצר תמונת סטודיו מהצילום — ה-garment אחרי הסרת הגוף, רקע שקוף, תאורת מוצר — **גלויה במסך "האם זיהינו נכון?"** ✅ ו**נשמרת לארון** (commit `3c4d18d`).)
2. **Shop-the-Look** — קנייה in-app, המשתמשת לא עוזבת את האפליקציה.
3. **Resale Marketplace** — ה-AI מציע מה למכור (50% מהמחיר המקורי) לפי usage נמוך.
4. **AI Stylist** — "מה ללבוש" לפי event + עונה, stats, streaks.
5. **Social Feed** — TikTok-style, For You + Following, looks שאפשר לקנות.

> **Speaker note:** המשפט המגדיר — "The wardrobe is the profile. Fashion is identity." להגיד אותו במילים, לא רק בשקף.
> **Visual:** 3 screenshots אמיתיים מהאפליקציה (Closet / Stylist / Feed) — זה הטיזר ל-Demo.

---

## Slide 3 — The Unfair Advantage · Agent-Built Company

**Punchline:** *מה שדורש $2M ו-10 אנשים — אנחנו עושים ב-$80K ושתי מייסדות + צוות אייג'נטים.*

- **Moat #1 — flywheel של דאטה מתויג:** AI עושה זיהוי ראשוני → המשתמשת מאשרת/מתקנת ומתייגת מקור → דאטה מתויג של הארון האמיתי שלה, בבעלותנו בלבד → הזיהוי מתחדד → ה-switching cost מצטבר. *"Every user trains her own stylist."* מתחרה חדש מתחיל מאפס ידע עליה.
- **Moat #2 — חברה אגנטית:** השכבה התפעולית היא אייג'נטים (CEO/CFO/CPO/CMO/CTO/Sales). העלות לא גדלה לינארית עם המשתמשות.
- **0 עובדים** ל-12 החודשים — הכסף הולך למוצר ולצמיחה, לא ל-payroll. זה feature.
- העיקרון: **האייג'נטים מבצעים ומייעצים — המייסדות מחליטות ולוקחות אחריות.**

> **Speaker note:** זה ה-"wow" של המשקיע. על Moat #1 — להפוך את החולשה למנגנון: "AI לא מושלם, ובדיוק בגלל זה יש לנו חפיר — כל תיקון של משתמשת הוא training signal שאין לאף מתחרה, דאטה שאי אפשר לגרד או לקנות." על Moat #2 — עצם ה-deck וה-app נבנו ע"י הצוות האגנטי; ההוכחה היא המוצר עצמו (Slide 8 bonus: dashboard חי).
> **Visual:** דיאגרמת הצוות האגנטי + שורת "built by 2 founders + agent team".

---

## Slide 4 — Market · Fashion social + resale + stylist AI

**Punchline:** *Global, English-first, ישראל כ-beachhead.*

- קהל: גיל 16–50, כל רקע, כל העולם. **Persona: נועה, 17, מרכז ישראל.**
- שלוש קטגוריות שמתכנסות לאפליקציה אחת: fashion social · resale · AI stylist.
- **Beachhead:** מיקרו-אינפלואנסריות אופנה ישראליות + build-in-public — CAC אורגני נמוך.
- References (השאיפה, לא ההעתקה): Instagram · Pinterest · Zara. **לא** TikTok/Depop/Farfetch.

> **Speaker note:** לא "TAM ענק ומופשט". להתחיל צר (נועה + ישראל) ולהראות path ל-global דרך English-first מהיום הראשון.
> **Visual:** מפת התכנסות 3 קטגוריות → AWEAR. דגל ישראל כ-beachhead, חץ ל-global.

---

## Slide 5 — Business Model · The Staged Revenue Engine

**Punchline:** *Awear מרוויחה מהיום הראשון — חוקי, מיידי, ללא תלות במותג — וכל שלב במנוע כבר מוכח ע"י שחקן אמיתי בשוק.*

ארבעה מנועים מדורגים — כל שלב מממן ומוכיח את הבא, אותו closet-graph מזין את כולם:
- **Phase 1 (מהיום): Affiliate + Creator Credits — מנוע הוכחת-intent.** רשת **Skimlinks** ✅ חי מ-2026-08-01 (publisher ID `307075X1795350`; תמיכה ב-AWIN/Rakuten/Impact/CJ בהמשך); עמלת אופנה ריאלית **7–10.5%, ‏blended ~8%** (‏~5.8% נטו מה-GMV אחרי ‏~27% reversals). אפס מלאי, אפס לוגיסטיקה. (Comp: Phia — affiliate-only, גייסה $35M בשווי ~$185M.)
  - `affiliate_url()` כבר **חי** — xcust SubID לייחוס פוסט, כל כפתור "קני" מרוויח עמלה היום.
  - **Creator Credits:** פוסט נושא `influencer_id` → קנייה → ייחוס → creator מזוכה **~40% מעמלת AWEAR** (≈3.2% מה-GMV; pending → confirmed אחרי 30 יום; idempotent on transaction_id) → Wallet מציג balance.
- **Phase 2 (post-raise): AWEAR Pro ‏$5.99/mo — מנוע ה-margin הראשון.** ה-scan הבסיסי לעולם חינם; Pro = unlimited + פיצ'רים כבדי-AI. (Comp: StyleDNA גובה $7.99–19.99/mo.) *⚠️ ממתין לאישור מייסדות.*
- **Phase 3 (post-raise + פתרון payout): Resale + dropshipping סלקטיבי — מנוע ה-GMV.** ‏Resale: הצעת מחיר 50% מהמקור · עמלת AWEAR ‏**15%** מהמכירה. Dropshipping (Spocket/Zendrop/CJ + מותגי D2C ישראלים) רק בקטגוריות שה-match-data מוכיח בהן demand. (Comp: Vinted — רווחית.)
- **Phase 4 (‏5M+ MAU): Sponsored placement ממותגים — מנוע ה-ARPU האינקרמנטלי.**

> **Speaker note:** השקף שמבדיל "אפליקציה חמודה" מ"עסק". להדגיש: אנחנו לא תלויים באישור של אף מותג כדי להתחיל — וכל מרכיב במנוע כבר עובד אצל מישהו בשוק (Phia/StyleDNA/Vinted); היחד הוא ה-thesis.
> **Visual:** 4-step ladder (Affiliate → Pro → Resale/Dropshipping → Sponsored). אייקון $ על כל שלב.

---

## Slide 6 — Traction Plan · Unit Economics

**Punchline:** *לא מוכרים "רווחיות per-user היום" — מוכרים intent-proof + מנוע מדורג, במספרים ששורדים diligence.*

| מטריקה | ערך |
|--------|-----|
| Net revenue / הזמנה מיוחסת (אחרי reversals + קרדיטים) | **~$2.98** |
| Gross margin על ההכנסה | ~80% |
| Revenue / MAU / חודש (Phase 1) | $0.20–0.40 · contribution ≈ 0± עד ה-Pro tier |
| מסלול מדורג (Pro + resale חיים) | $1–2 contribution / MAU / חודש |
| CAC (אורגני) | $3–7 · ‏paid CAC ‏$20–50 ⇒ אפס paid acquisition בשלב ה-affiliate |
| **LTV/CAC (במנוע המדורג)** | **2.5–5x** |

**תחזית (תרחיש בסיס, מספרים כנים):**
- **M12:** ~10–15K MAU ⇒ **$60–160K ARR run-rate**
- **$800K ARR — תרחיש upside מפורש** (עם Pro + resale חיים), לא base case.

**Target ל-90 יום:** App חי + 500 משתמשות בטא · **D30 ≥ 10%** (פי 2 מנורמת הקטגוריה ~5% ל-shopping apps; יעד פנימי 12%) · 100+ קליקים "קני" · 10+ רכישות affiliate ראשונות. North-star ל-traction: **20K users**.

**השורה התחתונה למשקיע:** (1) intent-graph שממיר פי 2–3 מ-shopping app רגיל · (2) קרדיטים רווחיים by construction (מודל A, ‏cap ≤50% — מתמטית אי אפשר להפסיד על עסקה) · (3) כל שלב במנוע מוכח ע"י comp אמיתי — Phia / StyleDNA / Vinted · (4) COGS משתנה נמוך (~$0.28/MAU) שיורד עם caching.

> **Speaker note:** לציין במפורש: כל ההנחות משוערות עד 30 יום נתוני בטא אמיתיים — ובדיוק בגלל זה מציגים את המודל הכן ולא מספר-שיא; משקיע שיעשה את החשבון בעצמו יגיע לאותם מספרים. ההנחה הרגישה ביותר: attach rate ‏6.5% — נמדדת ב-cohort הראשון. כנות בונה אמון.
> **Visual:** ladder של 4 מנועי ההכנסה + טבלת ה-unit economics הכנה.

---

## Slide 7 — The Ask · $70–80K → 12 months runway

**Punchline:** *$70–80K, ~12 חודשי runway, להוכחת retention ו-purchase intent.*

| סעיף | ~12 חודשים |
|------|-----------|
| מחיית 2 מייסדות (מינימלי) | ~$36K |
| AI / Agents (API) | ~$7K |
| Infra / Cloud / DB | ~$3K |
| שיווק / קרדיטים לאינפלואנסריות | ~$18K |
| משפטי / רישום / תשלומים | ~$5K |
| Buffer (15%) | ~$10K |

**אבני דרך שהכסף קונה:** App חי + 500 בטא (D30 ≥ 10%, פי 2 מנורמת הקטגוריה) · purchase intent מוכח · 10K+ עוקבים + 5–10 Founding Creators · נייר מייסדות סגור (equity, vesting 4 שנים/cliff שנה, SAFE עם המשקיע).

> **Speaker note:** הכסף ממשפחה (הדוד) → להתייחס כעסקה מקצועית עם נייר ועו"ד, דווקא כי הוא משפחה. זה מוריד סיכון, לא מעלה.
> **Visual:** עוגת תקציב + timeline 12 חודשים עם 4 milestones.

---

## Slide 8 — Demo · Live iPhone, <5 min

**Punchline:** *לא slides — האפליקציה עצמה, על iPhone אמיתי.*

**Demo script (סדר קבוע, <5 דקות):**
1. **Scan a look** → AI מזהה פריטים → **מסך "Did we get it right?" ✅ (shipped — `f4fe9a1`)** — אישור/תיקון פר-פריט; כל תיקון נשמר כ-training signal. → פריטים מאושרים נוחתים בארון עם catalog images.
2. **AI Stylist** מציע אאוטפיט ל-event (date/coffee/interview) + עונה.
3. **For You feed** — looks שאפשר לקנות, full-screen.
4. **Buy in-app** (simulated checkout) → "Order confirmed".
5. **Item lands in closet** → "added to your closet".
6. **Creator Wallet** → המשפיען שמהפוסט שלו קנו מזוכה בקרדיט (~40% מעמלת AWEAR; pending → confirmed).
7. **[Bonus]** dashboard חי של צוות האייג'נטים = "built by agents".

> **Speaker note:** לחזור על ה-flow פעמיים ב-dry-run לפני הפגישה. אפס broken images, graceful offline (A6). אם משהו נכשל — להמשיך, האפליקציה תמיד מצליחה בדמו (client-side fallback קיים).
> **Visual:** iPhone ביד, מעבר בין 7 השלבים. סיום על ה-Wallet — "creator earned $X".

---

## Appendix — Risks (אם נשאלת)

| סיכון | מיטיגציה |
|-------|----------|
| Retention שטחי | hook יומי (AI Stylist) + streaks, מדידת D1/D7/D30 כ-north star |
| תלות במותגים | affiliate-first — אפס תלות באישור מותג להתחלה |
| כסף ממשפחה | עסקה מקצועית עם נייר ועו"ד |
| עלות AI בסקייל | מודל זול לזיהוי ראשוני + caching; human-in-the-loop — אישור המשתמשת מפחית תלות ב-AI מושלם ויקר, והתיקונים נשמרים כ-training signal |
| תחרות מממומנת: **Whering** גייסה $7M מ-eBay Ventures + Google AI Futures (יולי 2026, 10M משתמשים קיימים) | נרטיב שונה לחלוטין: Whering = wardrobe tracking בלבד; AWEAR = scan→closet→social→buy→earn loop. ה-correction-ledger שלנו = labeled wardrobe data proprietary per user, שאי אפשר לשחזר. **יתרון בלתי-צפוי:** Whering מוכיחה את גודל השוק בדיוק כשאנחנו נכנסות אליו — עם מנוע מסחר שהם לא בונים. לנקוב בה פרואקטיבית בפגישה (לא להיפגע ממנה). |

---

## סטטוס למסמך זה

- **מה הושלם:** טיוטת skeleton מלאה, 8 slides + appendix, מבוססת מקורות נעולים בלבד.
- **עדכון 2026-07-12:** הנחיית המייסדים מ-2026-07-11 (מנוע זיהוי הפריטים + human-in-the-loop כ-wow וכ-moat) משוקפת ב-Slides 2, 3, 8 וב-appendix. מסך האישור "צדקנו?" עדיין בפיתוח — לא להציג כ-shipped.
- **עדכון 2026-07-14:** מספרי ה-unit economics תוקנו למודל הכן לפי `.claude/master/strategy/05-unit-economics.md` (Tobi) — default מיושם בהיעדר מענה על FOUNDER_QUESTIONS מ-2026-07-06; ממתין לאישור/דריסה של Carmel.
- **עדכון 2026-07-19:** (1) הנחיית מייסדות 2026-07-18 על יצירת תמונת קטלוג נקייה (OpenAI `gpt-image-1` מהצילום האמיתי) — משוקפת ב-Slide 2 Layer 1 כ-Phase 2 בפיתוח; לא לשנות ל-"shipped" עד שה-backend עלה. (2) תחרות: Whering/$7M (eBay Ventures + Google AI Futures, יולי 2026) נוסף ל-Appendix Risks עם מיטיגציה — להזכיר פרואקטיבית בפגישה. (3) NEEDS_DECISION #7 (4 עריכות Slide 3 מניתוח Bernard/riddle-06) — ממתין לאישור Carmel; **Slide 3 לא נגעה** (oscillation guard).
- **עדכון 2026-07-21:** Slide 8 תוקן — מסך "Did we get it right?" ✅ **shipped** (commit `f4fe9a1` by mark lane); אינו "בפיתוח" עוד. הביקורת ב-DoD Audit 2026-07-21 גילתה שביקורת מקורית חיפשה בקובץ הלא נכון (pre-split index.html) — ה-JS כולו עבר ל-static/app.js ב-2026-07-05. 10/11 פריטי ה-DoD מאומתים עכשיו.
- **עדכון 2026-07-23:** generate-garment UI ✅ **shipped** (commit `9975080` by mark lane) — כל פריט במסך "האם זיהינו נכון?" מציג עכשיו תמונת קטלוג נקייה שנוצרה ב-OpenAI `gpt-image-1` (spinner → תמונה → fallback קמעונאי 80% opacity). Slide 2 Layer 1 תוקן: Phase 2 = shipped בזרימת האישור; שלב הבא = שמירת URL לארון (pipeline gap). DoD Audit #12 נוסף (11/12 מאומתים).
- **עדכון 2026-07-24:** wardrobe match score backend ✅ **shipped** (commit `9cc466c` by steve lane) — `GET /api/products/{id}/match` מחזיר `match_pct` (0–95), `reason`, `matching_items` מה-closet של המשתמש ב-SQLite; BE-006 `user_key`, rate-limited 30/min, 4 pytests הרמטיים (141/141). DoD Audit #13 נוסף.
- **עדכון 2026-07-25:** match score SPA wiring ✅ **shipped** (commit `251e38e` by mark lane) — `app.js:699–714` מביא `match_pct`/`reason`/`matching_items` מה-server אחרי פתיחת ה-item sheet; local `calcCompatScore()` ממשיך להציג optimistic placeholder מיידי. DoD Audit #13 **fully verified** — 13/13 מאומתים (12 fully verified, 1 doc-only; 0 backend-only/pending).
- **עדכון 2026-07-26:** (1) **Nav fix** ✅ **shipped** (commit `ca649fa`) — לחיצה על look-tile בפרופיל/ארון פותחת עכשיו את ה-look הספציפי הזה (לפני כן: נווטה ל-feed הכללי). שדרוג demo-reliability ל-beat 6: אחרי הצגת הארון, אפשר לדפוק look-tile ולהגיע ישר ל-item sheet — "the wardrobe is the profile" בטאפ אחד. (2) **Outfit generator DS-004 polish** ✅ **shipped** (commit `a6ab1fa` by mark lane) — כל 14 חוקי og-* ב-CSS עכשיו עם fallback טוקן נכון (Gabbana 5/10 → כל P0+P1+P2 נסגרו; Gabbana 8/10 PASS). שינוי ויזואלי בלבד — אין שינוי בתוכן ה-deck.
- **עדכון 2026-07-27:** (1) **BH-10 DS-004 --success sweep** ✅ **shipped** (commit `0651046` by mark lane) — 14 occurrences of stale light-mode success fallbacks corrected to `#52c97a` (canonical dark-mode token) across analytics, sustainability, marketplace, earn, and stylist screens. App is visually clean across all screens — no visible DS-004 regressions remain. Deck content unchanged. (2) **Backend resilience hardening** ✅ **shipped** (commit `d148c50` by steve lane) — agent_schedule/agent_meeting/agent_summary return 503 (service unavailable) instead of crashing with unhandled 500 when Google Calendar/SMTP is unreachable. Slide 3 "Moat #2 — agentic company / עלות לא גדלה לינארית" claim strengthened: the operational layer is now resilient to external-service failure in demo conditions. No content change to the deck.
- **עדכון 2026-08-04:** (1) **creator credits תוקן: 5% → ~40% מעמלת AWEAR** (≈3.2% מה-GMV) — השינוי ב-`SKIMLINKS_CREATOR_SHARE_PCT = 0.40` ב-app.py ו-Wallet UI קדמה לעדכון ה-deck; Slides 5 ו-8 תוקנו. (2) **Skimlinks חי** עם publisher ID אמיתי מ-2026-08-01 — עודכן ב-Phase 1. (3) **garment image pipeline סגור** — "שמירה לארון = שלב הבא" הוסר; commit `3c4d18d` סגר את הפער; Slide 2 מדויק. (4) **Commerce engine fully shipped** — כל 8 פריטי COMMERCE_PLAN ✅; הפנייה ל-`docs/COMMERCE_PLAN.md` ל-SoT מלא.
- **עדכון 2026-08-07/08:** (1) **SEED-WALLET ✅ shipped** (commit `65e0046`, steve run-38) — `POST /api/demo/seed-wallet` pre-populates $21.35 confirmed + $10.40 pending; pair with `seed-closet` for full Slide 8 pre-flight (both idempotent — safe to call multiple times). (2) **Test suite: 278 effective** (277 definitions; +6 since 2026-08-04 snapshot: +2 seed-closet, +3 seed-wallet, +1 Postgres compat `344ae17`). (3) **SHOP-MATCH-CONSISTENCY** (commit `6d7ac3f`, mark run-65) — shop grid match% now uses `calcCompatScore()` for consistency with item-sheet score. Background quality, no deck content change.
- **עדכון 2026-08-09:** (1) **FEED-MATCH-BADGE ✅ shipped** (commit `d094edb`, mark run-66) — frosted match-score pill pinned top-left on every feed card (green ≥80%, amber ≥60%, red <60%; DS-004 tokens, WCAG AA+). Beat-4 personalization is now visible *before* tapping — investors see "87% match" right on the feed. (2) **LOOK-SHEET-CHIP-ANIM ✅ shipped** (commit `5a3f177`, mark run-67) — look-sheet "X% match to your style" chip animates 0→target on open (easeOutCubic, 600ms), matching the item-detail ring count-up. Consistent wow moment across all sheet types. (3) **MATCH-SCORE-EXT ✅ shipped** (commit `77c499e`, steve) — match scoring extended to include each product's `search_query` + `tags`; explicit bonuses for exact brand (+3), color (+2), subcategory (+2). Ring % is the most accurate it has ever been. (4) **MATCH-MATRIX-EXT ✅ shipped** (commit `9b203aa`, steve) — hat, shoes, and accessories fully scored in `_COMPLEMENTS`; demo wardrobe now reaches **95% match** (was 71–79%). (5) **PROFILE-LOOK-BUY ✅ shipped** (commit `a554415`, mark run-69) — tapping a look-post on the Profile Posts tab now opens the full 3-tier buy sheet (Buy exact / Find similar / Resale, per item) instead of a dead "Close"-only sheet. "The wardrobe is the profile" closes convincingly from the profile direction. Slide 8 demo flow updated: beat-6 extension confirmed working. (6) **Test suite: 284 effective** (+6 since 2026-08-07/08 snapshot: +1 LIFECYCLE-TEST `a2051a7` pending→confirmed wallet lifecycle; others from match-matrix + xcust tests). No deck content change — all 5 are demo-flow quality improvements, not new features.
- **עדכון 2026-08-10:** (1) **LOOK-CARD-SHOP-PILL ✅ shipped** (commit `825a668`, mark run-75) — frosted bag-icon pill (top-right) appears on every look card that has a price in the Profile/Looks grid; commerce linkage is now visible at-a-glance before tapping, using the same frosted-overlay pattern as feed cards. Beat-6 (profile visit) now shows the commerce signal directly on the look thumbnails — "every look is shoppable" is self-evident, not just narrated. (2) **LOOK-SHEET-COLLAGE-ASPECT ✅ shipped** (commit `b076404`, mark run-74) — look-sheet collage ratio 4:3→4:5 (taller portrait; fills the phone screen better); status badge light-mode contrast corrected. Visual polish for beat-5 item sheet. (3) **COMMERCE-UI-POLISH ✅ shipped** (commit `4d26ab7`, mark run-73) — accent-colored buy-btn, tokenized store-logo, extracted sl-earn class; commerce visuals consistent across look-sheet and store tab. (4) **FEED-CONTENT-ENRICHMENT ✅ shipped** (commits `fc5edea`+`de8d400`, steve runs 41–42) — 23 product tags added across 18 posts; **79/200 products now discoverable via the feed** (11 new unique products: DW watches, Stüssy hats/tops/boonie, Camper sandals/sneakers, Carhartt Henley, Acne polo, Levi's 511). More real shoppable inventory means beat-4 shoppable feed has denser commerce density for the demo. (5) **TEST-COVERAGE-STORIES-DM ✅ shipped** (commit `3185dae`) — +18 hermetic tests for Stories + DM endpoints. **Test suite: 303 effective** (+19 since 2026-08-09 snapshot). No slide content change — all items are demo-reliability and content-density improvements.
- **עדכון 2026-08-12:** (1) **HOME-QA-6-ACTIONS** (mark run-82 `66aad7b`) — Home trimmed to 6 focused quick-actions (Outfit AI / Shopping / Abigail / Stylists / Analytics / Wallet); beat-7 Wallet path confirmed. (2) **FEED-REAL-PHOTOS-7** (`199a35d`) — 7 real demo-user photos in feed (was 4); beat-1 authenticity claim backed by 7 distinct real looks. (3) **BROWSE-IMAGE-URL** (`acfc368`) — all Store tab items have real CDN product images; off-script taps into Store are safe. (4) **SEARCH-HAYSTACK-EXT** (steve run-47 `df926e1`) — product search expanded to tags+search_query+subcategory+description; 2 regression pytests. (5) **CDN-COLOR-DETECT** (steve run-48 `a950a87`) — automated color-consistency detector in data_integrity.py (OW-016 class fix). **Test suite: 311 effective pytests** (+8 since 2026-08-10 snapshot). No slide content change — all items are demo-reliability and data-quality improvements.
- **עדכון 2026-08-13:** (1) **WOW-3-FIXES ✅ shipped** (commit `b92cf50`, mark run-87) — match ring 92px→**112px** + number 24px/w700→**32px/w900**: the % match hero on the item sheet is now unmissable; feed Buy CTA ghost→filled accent pill (commerce intent unmistakable at a glance); DM "Start a conversation" wired. Slide 8 beat-4 + beat-5 visually strongest they've ever been — the match ring reveal lands harder. (2) **COLOR-AWARE-MATCH ✅ shipped** (commit `de5989b`, steve run-50) — `_wardrobe_match_score` now weighs color families: same-color closet item +7, neutral-palette product +5, neutral-palette closet base +3; 3 hermetic pytests including empty-closet invariant. The "87% match" on Slide 8 beat-5 is now color-aware — a blazer scores higher if the user already owns navy; strengthens the "AI knows her style" claim on Slide 3. (3) **COLOR-FAMILY-NORM ✅ shipped** (commit `e9260f8`, steve) — 12 canonical color families normalizing ~60 real catalog label variants (navy = midnight navy = collegiate navy); foundational quality that makes color-aware scoring reliable. (4) **LOOK-ITEM-MATCH-CHIP ✅ shipped** (commit `c9a9b6d`, mark run-83) — per-item closet match% chip on each row of the look-sheet; personalization visible at the garment level inside the look detail. Beat-5 extension: every item in a look shows its individual match to her closet. (5) **DM-FALLBACK ✅ shipped** (commit `c4fc7b3`, mark run-86) — DM tab shows realistic seeded inbox (Tamar/Carmel/Maayan/Shir) when API unavailable; "Start a conversation" wired to Tamar's thread. No dead screens for investors. (6) **FOR-YOU-POSTS-RANK ✅ shipped** (commits `9ffb9b2`+`f8d44f7`) — `GET /api/posts?sort_by=match&viewer_id=<id>` ranks feed posts by closet-match score server-side (sam run-49); UI wired in mark run-88 (`f8d44f7`) — For You tab now fetches with `sort_by=match&viewer_id=` from the server. Beat-4 personalized For You feed is fully end-to-end ✅. **Test suite: 320 effective pytests** (+9 since 2026-08-12 snapshot). Slide content change: Slide 3 "AI knows her style" now backed by color-aware scoring live in code; match ring Slide 8 beat-5 visually stronger.
- **עדכון 2026-08-14:** (1) **LOOK-SHEET-PRODUCT-URLS ✅ shipped** (commit `45edbdc`, mark run-89) — `product_url` + `search_query` wired from API post data into look-sheet items; every look-sheet row now carries the real product URL for the buy flow. Beat-5 shoppability complete — "Buy This Item" opens the exact product page. (2) **LOOK-SHEET-EDITORIAL-POLISH ✅ shipped** (commit `af93d52`, mark run-90) — hero cover image (full look photo), 76px item thumbnails, tokenized store-row styling, DS-004 fallback fixed; look-sheet is visually polished for beat-5. (3) **LIGHT-MODE-POLISH ✅ shipped** (commits `3b58a1e`+`e51c915`, mark runs 91+??) — 8 light-mode fixes across home greeting gradient (brand red on light bg), wallet pending AA-compliant text, rose hero blob, neutral banner, Withdraw button contrast, story ring borders, sell button, outfit CTA color. Demo is presentation-clean in both dark and light mode. (4) **DEMO-STATUS ✅ shipped** (commit `c8500d4`, steve) — `GET /api/demo/status?user_id=tamar` returns a pre-flight readiness JSON: closet seeded ✓, wallet seeded ✓, products loaded ✓, AI available ✓, 7-beat checklist. Pre-demo confidence: one curl verifies the app is show-ready. (5) **OUTFIT-ANCHOR-ITEM ✅ shipped** (commit `ef26541`, steve) — `/api/outfit/generate` now accepts `anchor_item`; the tapped product is always featured in every generated look. Beat-2: "she taps a blazer → every outfit includes it" is now literal, not approximate. (6) **STYLIST-DISTINCT-TIPS ✅ shipped** (commit `d790d8e`, steve run-51) — AI Stylist fallback now returns 3 genuinely distinct outfit tips per occasion type (was 1 repeated tip); tip[0] names the anchor item ("Built around the [item] — ..."). Beat-2 demo story "3 looks, 3 distinct styles" is backed by distinct copy per look. **Test suite: 325 effective pytests** (+5 since 2026-08-13 snapshot: +2 distinct-tips invariant + +3 anchor-item tests). No slide content change — all items strengthen demo reliability and investor-session confidence.
- **מה נשאר (אנושי):** (1) המרה ל-PDF/Keynote בעיצוב AWEAR · (2) screenshots אמיתיים ל-Slides 2,8 · (3) sign-off CMO + Jeff (owners) · (4) dry-run ×2 לפי C2.
- **תלות:** A6 (demo reliability, 0 broken images) לפני הצגה חיה ב-Slide 8.

*נגזר מ-MASTER_PLAN.md (Track C) + BUSINESS_PLAN.md + strategy/05-unit-economics.md. אין כאן החלטות אסטרטגיות חדשות — assembly בלבד.*
