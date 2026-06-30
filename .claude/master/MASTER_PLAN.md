# AWEAR — תוכנית אב
*מסמך עליון. כל שאר התוכניות כפופות לו. סתירה = המסמך הזה מנצח.*
*מאוחד מ-20+ מסמכים | מבוסס על: lucky-percolating-wind.md (רזי) כ-north star*
*19.06.2026 | מורשים לשנות: כרמל + רזי (דירקטוריון) בלבד*

---

## חלק א׳ — הצהרת מטרה (North Star)

> **פגישת משקיע: ~2–4 שבועות. דוד של כרמל. $70–80K.**
> **המטרה האחת:** אפליקציה native iOS, investor-ready, כל 5 שכבות מלוטשות, demo בפחות מ-5 דקות מגיע ל-"wow".

כל החלטה שלא מקדמת את זה ב-4 השבועות הקרובים — נדחית.

### החזון התפעולי — The Loop (north star שכל משימה נמדדת מולו)
> **הצפון האחד: הלולאה עובדת באמת.** ה-demo מרשים כשהלולאה אמיתית, לא seeded.
> כל משימה נשאלת: *"האם זה מקדם שלב בלולאה מ-SEEDED ל-REAL?"*

| שלב | מה | סטטוס (06-30) |
|-----|-----|---------------|
| **SCAN** | מצלמים פריט → Claude-Vision מפרק לפריטים | wiring קיים (`/api/analyze`), צריך אימות LIVE end-to-end |
| **MATCH** | % התאמה לארון | היום heuristic של tags — צריך להיות אמיתי/אמין |
| **LOOKS** | ה-AI בונה לוקים מהארון | חלקית אמיתי (`/api/outfit/generate`) |
| **BUY** | קנייה in-app (P2P + dropshipping facade) | wired (`/api/orders`) — צריך fulfilment אמיתי |
| **EARN** | יוצרת מרוויחה credit | backend קיים — צריך UX מלא |

### סדר עדיפויות לכל dispatch (דטרמיניסטי, לא תחושה)
`1` תקלת CI/בילד שבור · `2` directive שעונה ב-FOUNDER_QUESTIONS · `3` INBOX מייסדים · `4` קידום שלב בלולאה (seeded→real) · `5` באג/infra · `6` **polish (הכי נמוך; מוגבל ל-1 לריצה; לעולם לא חזרה לאותו אזור/נושא — OW-011)**.
> ה-MVP שעובד נכון תמיד מנצח ליטוש. ליטוש שחוזר לאזור שכבר טופל = זגזוג, אסור.

---

## חלק ב׳ — מי אנחנו

### המשפט שמגדיר כל החלטה
> **"The wardrobe is the profile. Fashion is identity. Everyone deserves to look like they mean it."**

### יוקרה נגישה — מה זה אומר
| מה כן | מה לא |
|--------|--------|
| Premium שמרגיש friendly | קר ומרוחק |
| Editorial confidence | Intimidating |
| התמונה היא הכוכב — ה-UI הוא הבמה | ה-UI מתחרה בתוכן |
| כל אחת יכולה להשתייך | "רק people of taste" |

**References:** Instagram · Pinterest · Zara
**לא:** TikTok (too loud) · Depop (too grungy) · Linear/Farfetch (too cold)

### הקהל
גיל 16–50, כל רקע, כל העולם. English-first, ישראל beachhead.
**Persona:** נועה, 17, מרכז ישראל — מצלמת תלבושות לפני שיוצאת, קונה בטיקטוק, חצי הארון לא נלבש.

### הקלף הייחודי — שניים
1. **גרף ידע מצטבר:** ככל שמשתמשת מצלמת יותר → המלצות מדויקות יותר → switching cost עולה. מתחרה חדש מתחיל מאפס.
2. **חברה אגנטית:** מה שדורש $2M ו-10 אנשים — אנחנו עושים ב-$80K ו-2 מייסדות + agent team.

---

## חלק ג׳ — החלטות נעולות (אין דיון)

| # | החלטה | מי החליט | תאריך |
|---|--------|----------|--------|
| 1 | Platform iOS = **Capacitor wrap** של web SPA. לא React Native. | רזי | 19.06.2026 |
| 2 | Market = Global, English-first, ישראל beachhead | רזי + כרמל | 19.06.2026 |
| 3 | Scope = כל 5 שכבות מלוטשות, Gabbana 8+ | רזי | 19.06.2026 |
| 4 | Timeline = 2–4 שבועות | רזי | 19.06.2026 |
| 5 | Light + Dark mode, auto לפי מכשיר | בורד | 19.06.2026 |
| 6 | Benchmark = Instagram · Pinterest · Zara | מארק + כרמל | 19.06.2026 |
| 7 | מטבע = USD פנימי | איילון | 18.06.2026 |
| 8 | FX = static table בv1, live API = אישור ג'ף/בורד | איילון | 18.06.2026 |
| 9 | Resale suggestion = 50%, עמלת AWEAR = 15% | איילון | 18.06.2026 |
| 10 | Affiliate day-1 (AWIN/Rakuten/CJ) → Dropshipping בסקייל | רזי + כרמל | 19.06.2026 |
| 11 | Creator credits: ledger append-only, idempotent | רזי | 19.06.2026 |
| 12 | Admin dashboard = לא מקולקל, לא ב-i18n scope | איילון | 18.06.2026 |

---

## חלק ד׳ — מה אנחנו בונים (5 שכבות)

### Core Loop
```
scan clothes → scroll feed → AI stylist suggests looks
→ influencers post shoppable looks → buy IN-APP via dropshipping
→ item lands in closet → creator earns credits
```

### Daily Hook (מנוע retention)
**תיעוד תלבושת יומי פרטי** → habit + Duolingo-style streaks.
זהו גם ה-data engine מאחורי stats + "מה למכור" suggestions.

### 5 השכבות

**L1 — Closet = Profile**
מדפי category (shoes / tops / bottoms / accessories) · Looks (posts) · Marketplace area.
כל פריט = **clean catalog image שה-AI מצא** — לא emoji, לא raw photo, לא ריבוע ריק.
Items מגיעים מ: scan, posts, in-app purchase, wishlist.

**L2 — Commerce: Shop-the-Look**
**In-app checkout** — המשתמשת לא עוזבת את האפליקציה. לא redirect.
Backend: affiliate networks day-1. UX: in-app flow מלא (simulated בdemo).

**L3 — Resale Marketplace**
Feature בתוך הCloset — לא pillar נפרד.
Smart closet מציע מה למכור לפי usage נמוך מה-diary.
AI מציע מחיר: 50% מהמחיר המקורי.

**L4 — AI Stylist (השכבה הכי עשירה)**
(a) המלצות לפי event (date/coffee/interview) + עונה
(b) Chat — שאלות על הארון
(c) Stats + summaries יומי/שבועי/חודשי
(d) Tinder-swipe על looks ללמידת טעם
(e) Streaks + gamification (Duolingo-style)
(f) ממליץ גם מהארון וגם לקנות חדש (shoppable)

**L5 — Social Feed**
TikTok-style full-screen. For You + Following tabs. Shoppable looks. Influencers = growth channel.

### Upload Types
- **Public post** — נראה לכולם, מזין פיד
- **Friends-only post** — circle מצומצם
- **Private daily diary** — רק למשתמשת, מזין stats + resale suggestions

---

## חלק ה׳ — ארכיטקטורה טכנית

### Stack
```
Backend:   FastAPI (app.py) + SQLite (data/awear.db)
Web SPA:   Vanilla JS (static/index.html, 18 screens, ~5500 lines)
iOS:       Capacitor wrap → static/ → Native iOS Simulator + TestFlight
Server:    venv312/bin/uvicorn app:app --reload --port 8000
Dashboard: tools/dashboard_server.py, פורט 8001
```

### iOS — Capacitor Strategy (A1)
```
@capacitor/ios: webDir → static/
Camera:        @capacitor/camera (לא expo-camera)
Native:        safe-areas, status bar, splash screen, app icon
Target:        iOS Simulator FIRST → TestFlight שבוע 3
```
**הכרעה על mobile/:** ה-React Native codebase נדחה לpost-investment. Capacitor הוא ה-path ל-investor demo.

### DB Schema — טבלאות שחסרות (לבנות)
```sql
CREATE TABLE orders (
  id TEXT PRIMARY KEY, user_id TEXT, post_id TEXT,
  product_id TEXT, amount_usd REAL, status TEXT,
  influencer_id TEXT, created_at TEXT
);
CREATE TABLE credits (
  id TEXT PRIMARY KEY, user_id TEXT, order_id TEXT,
  amount_usd REAL, type TEXT, created_at TEXT
);
```

### נקודת הכנסה — affiliate
```python
def affiliate_url(product_id: str, network: str = "awin") -> str:
    # שורה אחת → כל כפתור "קני" מכניס כסף
```

---

## חלק ו׳ — חזון עיצובי

*פירוט מלא: `docs/VISUAL_VISION.md` — source of truth לכל token ו-component.*

### עקרונות (לא ניתן לוויתור)
1. **התמונה היא הכוכב** — ה-UI לא מתחרה בתוכן
2. **אפס emoji ב-UI chrome** — עולמית, תמיד, ללא יוצא מן הכלל
3. **tokens בלבד** — אין hex, אין px לא מתוך הרשימה
4. **photograph-first** — אין placeholder, אין gradient rectangle

### שאלת העל (גבאנה — לפני כל merge)
> **"אם AWEAR הייתה מפרסמת screenshot מהמסך הזה ב-Instagram story — האם הייתה מתביישת?"**
אם כן — חוסמת. לא checkbox. תשובה מפורשת בכל PR.

### Tokens נוכחיים (Dark Mode — מיושמים)
```
--bg:#0e0c0f  --card:#1e1a22  --accent:#e8526a  --accent2:#c4855a  --accent3:#7a6af0
--fg:#f0ecf5  --muted:#8a8498  --line:#2e2836
```
*Cycle 3: migration → terracotta/camel מלא + light mode tokens*

### Typography
| שימוש | גופן |
|-------|------|
| Headlines (EN) | DM Serif Display |
| Body + UI | Inter |
| עברית/RTL | Heebo |
| מחירים/מספרים | Poppins |

סקאלה: `--t-micro(11)` ← ... → `--t-display(32)`. **`--t-sm/md/lg` לא קיימים.**

### Grid
- Feed + Wardrobe: **2 עמודות**, 4:5 portrait, 16px gap
- Profile: **3 עמודות**, 1:1 square

### Motion
- Tap feedback: **80ms** (scale 0.96 + opacity 0.85)
- Card open: **320ms** spring(tension:280, friction:22)
- Screen transition: **260ms** slide+fade spring
- **אין parallax — החלטת board**

---

## חלק ז׳ — מודל עסקי

### מנגנון הכנסה — 3 שלבים

**שלב 1 (מהיום):** Affiliate
AWIN, Rakuten, Sovrn/Skimlinks, Impact, CJ.
5–15% עמלה. `affiliate_url()` = נקודת הכנסה אחת. אפס מלאי, אפס לוגיסטיקה.

**שלב 2 (בסקייל):** Dropshipping suppliers
Spocket, Zendrop, CJ Dropshipping. מותגי D2C ישראלים. API + מילוי הזמנות.

**שלב 3 (post-PMF):** Dropshipping מלא
רק אחרי 1,000+ משתמשות active ו-purchase intent מוכח.

### Creator Credits
```
פוסט נושא influencer_id
→ קנייה → ייחוס בחלון זמן
→ creator מזוכה בקרדיט (ledger append-only)
→ Wallet מציג balance + earnings history
→ "withdraw above $X" = simulated בdemo, Stripe Connect = post-investment
```

### Economics
| מדד | ערך |
|-----|-----|
| Resale suggestion | 50% מהמחיר (RESALE_SUGGESTION_PCT = 0.5) |
| עמלת AWEAR | 15% מהמכירה (AWEAR_COMMISSION_PCT = 0.15) |
| Contribution/user/month | ~$11 |
| Gross margin | ~85% |
| CAC אורגני | $3–7 |
| LTV/CAC | >4x |

### תחזית (12 חודש)
M6: ~2,100 users / ~$9K monthly | M12: ~7,000 / ~$31K | M18: ~$800K ARR

### תקציב $70–80K
מחיית מייסדות $36K · AI/API $7K · Infra $3K · שיווק $18K · משפטי $5K · Buffer $10K

---

## חלק ח׳ — מבנה הצוות

### דירקטוריון (סמכות עליונה)
**כרמל** — חזון מוצר, החלטות אסטרטגיות
**מעיין** — חזון עסקי, החלטות אסטרטגיות
**רזי** — co-founder, תוכנית אב

### הנהלה (כפופים לדירקטוריון)
**ג'ף (CEO)** — תיאום כל ראשי צוותות, Board Sync, merge authority
**איילון (Product)** — scope, product decisions, ממשק משתמש→business
**סטיב (CTO)** — ארכיטקטורה, אבטחה, iOS infra, code quality
**מארק (Head of Design)** — כיוון עיצובי, עדיפויות עיצוב, לא כותב קוד
**וראן (Mobile Lead)** — mobile direction, Dana + Roei ownership

### ICs
| שם | מה | תחת |
|----|-----|------|
| דולצ'ה | UI/screens ביצוע | מארק |
| גבאנה | Design QA critic (לא כותבת קוד) | מארק |
| נטה | Design system, tokens | מארק |
| דנה | Camera, Onboarding, Profile (RN — נדחה לpost-Capacitor) | וראן |
| רועי | Feed, Wardrobe, i18n (RN — נדחה לpost-Capacitor) | וראן |
| סאם | Backend, API, DB | סטיב |
| אורן | Integration (cross-layer) | סטיב |
| שירה | Social features | איילון |

### כלל דיווח
IC → ראש צוות ישיר בלבד. ראש צוות → ג'ף. ג'ף → דירקטוריון.
עקיפת שכבה = כשל מבני (MG-002).

---

## חלק ט׳ — תוכנית ביצוע (4 שבועות)

### שבוע 1 — תשתית Investor Demo
| # | משימה | owner | DoD |
|---|-------|-------|-----|
| A1 | Capacitor iOS shell: config + ios/ + Simulator | Steve + Oren | רץ ב-Simulator, camera works |
| A2 | Clean product images: search_query → catalog, fallback SVG 4:5 | Dolce + Netta + Sam | grep emoji fields = 0, Gabbana 8+ |
| A3 | In-app checkout: product page → bag → "ordered" → item in closet (simulated) | Sam + Dolce | Playwright: flow completes |
| B1 | BUSINESS_PLAN.md update: global + dropshipping + creator-credits | Jeff + Ayalon | מעיין מאשרת |
| C1 | Pitch deck skeleton: 8 slides | CMO + Jeff | PDF draft |

### שבוע 2 — 5 שכבות + Demo Content
| # | משימה | owner | DoD |
|---|-------|-------|-----|
| A4a | L1 polish: Looks tab + category shelves + marketplace area | Dolce + Ayalon | Gabbana 8+ |
| A4b | L4 stylist: event recs + chat + stats + streak UI | Sam + Dolce | Gabbana 8+ |
| A4c | L5 feed: For You + Following tabs | Dolce + Sam | Playwright 0 errors |
| A7 | Creator Wallet screen + credits backend | Sam + Shira + Dolce | wallet renders with balance |
| C2 | Demo script draft: 5-min iPhone flow | CMO + Ayalon | dry-run done |

### שבוע 3 — TestFlight + Rehearsal
| # | משימה | owner | DoD |
|---|-------|-------|-----|
| A1b | TestFlight build: signing, provisioning profile | Steve | installed on real iPhone |
| A6 | Demo reliability: zero broken images, graceful offline | Steve | Playwright 0 errors all screens |
| B2 | Creator-credits economics doc: take-rate + withdrawal threshold | Jeff | PDF ready |
| C1b | Pitch deck final | CMO + Jeff | print-ready |
| — | Dry-run עם non-team tester | כרמל + רזי | "wow in <5 min" confirmed |

### שבוע 4 — Buffer + Final Polish
| # | משימה | DoD |
|---|-------|-----|
| Fix dry-run findings | כל P0 מהrec closed |
| Final Playwright + curl sweep | 0 errors, all endpoints 200 |
| App icon + splash screen | Gabbana approved |
| Deck rehearsal ×2 | timing locked |

---

## חלק י׳ — Tracks B + C (עסקי + Pitch)

### Track B — עסקי
**B1** — BUSINESS_PLAN.md: global + Israel-beachhead + dropshipping model + creator-credits economics + USD. Owner: Jeff + Ayalon. מאושר על ידי מעיין.

**B2** — מודל creator-credits: take-rate split (AWEAR commission → creator share) + withdrawal threshold + partnership path (affiliate day-1 → fashion retailers at scale). לשים ב-`docs/CREATOR_ECONOMICS.md`. Owner: Jeff.

### Track C — Pitch Deck (חסר לחלוטין — P0)
**מבנה:**
1. Problem: נועה + "ארון מלא ואין מה ללבוש"
2. Solution: closet = profile + 5 layers
3. Agent-built company thesis: $80K במקום $2M
4. Market: fashion social + resale + stylist AI
5. Model: affiliate → dropshipping → creator credits
6. Traction plan: 20K users, D30 > 25%
7. Raise/Use: $70-80K → 12 months runway + first milestones
8. Demo: live iPhone, <5 min

**Demo Script:**
```
iPhone → scan a look → clean catalog images on shelves →
stylist suggests event outfit → For You feed →
buy in-app (simulated checkout) → item in closet →
Wallet shows creator earned credit →
[bonus] show live agent dashboard = "built by agents"
```

---

## חלק י"א — ניהול יומי (Daily Model)

### 3 סוגי ימים
| Build Day (ברירת מחדל) | Align Day | Strategy Day |
|------------------------|-----------|--------------|
| עבודה עמוקה, output מקסימלי | תיאום, החלטות, חסמים | roadmap + ביקורת מוצר |

### Board Sync — מחזור רציף
```
עבודה מקבילה → Board Sync → ג'ף מסכם לכרמל → dispatch חדש → חזור
```
כל IC: commit ראשון תוך 48 שעות מdispatch. בלי commit = stall alert אוטומטי.

### Scope Report (פותח כל Board Sync)
```
סוכן | scope | status | חסם | action
```
PR-001: זה action list, לא status update.

---

## חלק י"ב — כללי ברזל (Iron Rules)

### ORG-WIDE (כולם)
| # | כלל |
|---|-----|
| OW-001 | Rename = grep 3 שכבות: `app.py` + `index.html` + `mobile/` |
| OW-002 | DoD = grep מאומת — "I think it works" לא DoD |
| OW-003 | לפני עבודה על קובץ משותף → קרא activity_log |
| OW-006 | כלל ללא מנגנון אכיפה = המלצה בלבד |

### Design System
| # | כלל |
|---|-----|
| DS-004 | `var(--token, exact-fallback)` לכל color/spacing/radius |
| DS-006 | אין emoji ב-UI chrome — ICONS object (40+) תמיד |
| DS-008 | `icon()` = JS template literals בלבד. Static HTML = inline SVG |
| DS-010 | Data objects = `search_query` field בלבד. לא `emoji` field |
| DS-013 | Gabbana audit = `git diff` (~8K tokens), לא קובץ שלם (~82K) |
| DS-015 | Benchmark = Instagram · Pinterest · Zara |

### Backend
| # | כלל |
|---|-----|
| BE-003 | Schema owner = סאם. Integration = אורן. לא מחליפים תחת לחץ |
| BE-004 | In-memory dict → SQLite תמיד: `_init_db()` + `_get_db()` + row_factory |
| BE-005 | "נתון צריך לשרוד restart?" → SQLite. לא dict |
| MG-005 | `user_key = (request.client.host if request.client else None) or "anon"` |
| SF-004 | אין HTTP calls בתוך async ASGI endpoints |

### Social + Moderation
| # | כלל |
|---|-----|
| SF-001 | moderation thresholds = product decision (איילון), לא engineering |
| SF-002 | "קוד moderation קיים" ≠ "moderation עובד" — curl test + response doc |
| SF-003 | ANTHROPIC_API_KEY חסר = fail-open — P0 לפני production |

---

## חלק י"ג — Quality Gates

### Definition of Done — כל PR עיצובי
- [ ] grep: emoji ב-UI chrome = 0
- [ ] grep: כל מוצר = תמונה אמיתית / SVG fallback
- [ ] grep: hex מחוץ לtokens = 0
- [ ] grep: font-size לא `var(--t-*)` = 0 (PR חדש)
- [ ] spacing = רשת 8pt
- [ ] touch targets ≥ 44px
- [ ] Playwright: 0 runtime errors
- [ ] **גבאנה: "שאלת העל" — תשובה מפורשת ב-PR**

### P0 — פסילה אוטומטית
1. Emoji כ-UI element (icon, button, nav, badge)
2. מוצר/בגד באימוג'י או ריבוע ריק
3. Hex color מחוץ ל-`awear-tokens.json`
4. `emoji` field כ-display default בdata objects
5. Typography מחוץ לסקאלה / contrast < WCAG AA / touch < 44px
6. Placeholder content גלוי במסך

### Gate Flow
```
IC מיישמת → self-check P0 list → Gabbana audit (git diff) →
code-reviewer skill → Playwright verify → ג'ף merge
```

---

## חלק י"ד — מצב נוכחי ו-Technical Debt

### קיים ועובד (19.06.2026)
- Web SPA: 18 מסכים, FastAPI + SQLite + Claude
- Design system: tokens.css + awear-tokens.json
- Camera scaffold (Capacitor stub)
- Moderation scaffold (לא active — API key חסר)
- i18n infra (en.json + he.json, לא מחוברים לחלוטין)
- Block-user feature (שירה, merged)

### חוב טכני מתועד
| חוב | כמות | Owner | Sprint | מתי לתקן |
|-----|------|-------|--------|----------|
| Hardcoded hex values | 97 מקומות | נטה | Cycle 2 W1 | Cycle 2 (A2 + visual_redesign) |
| emoji ב-SF_ITEMS/STYLISTS_DATA | 26 הופעות | דולצ'ה | Cycle 2 W1 | עם A2 — **P0** |
| `#2a2040`, `#1a1030` (non-token) | 13 מקומות | נטה | Cycle 2 W1 | עם A2 |
| font-size hardcoded | 402 שורות | נטה | Cycle 2 ongoing | batch migration — target: -20/cycle |
| `var(--t-*)` שימוש | 0 כרגע | נטה | Cycle 2 ongoing | migration בbatches |
| spacing hardcoded | 366 מקומות | נטה | Cycle 3 | Cycle 3 |
| Light mode tokens ב-tokens.css | לא קיים | נטה | Cycle 3 | `@media (prefers-color-scheme: light)` |
| **ANTHROPIC_API_KEY חסר** | — | **סטיב/ג'ף** | **לפני כל deploy** | **P0 — moderation fail-open** |
| Moderation thresholds | לא מאושרות | **איילון** | **Cycle 2 W2** | sign-off על plans/moderation_thresholds_proposal.md |
| look_total_usd fallback מעורב | שורה 2305 | אורן+סאם | Cycle 2 | BE-002 — פתוח מcycle 1 |

---

## חלק ט"ו — מה אנחנו לא עושים (עד אחרי הגיוס)

**לא בונים מחדש ב-React Native** — Capacitor הוא ה-path. mobile/ קיים ונשמר לpost-investment.

**לא מפתחים notifications** — FCM/APNs = Cycle 3 post-investor.

**לא live FX API** — static table בv1. vendor = אישור בורד.

**לא ProfileScreen/WishlistScreen ב-RN** — נדחה. web SPA מכסה via Capacitor.

**לא StyleQuiz** — placeholder בonboarding. לוגיקה = Cycle 3.

**לא real bank withdrawal** — wallet UI = simulated בdemo. Stripe Connect = post-investment + legal/budget.

**לא Admin i18n** — internal tool, לא משתמשות רואות.

**לא Typography migration שלמה** — batch קטן כל cycle. לא big bang refactor.

---

## חלק ט"ז — החלטות פתוחות (עם deadline)

| # | שאלה | מי מחליט | מתי |
|---|------|----------|-----|
| 1 | Product images: Pexels proxy (free) vs paid vendor | כרמל + budget | שבוע 1 |
| 2 | Two-team split עם Carmel's team — scope חלוקה | כרמל + רזי | שבוע 1 |
| 3 | Outfit calendar · saved-looks board · streak rewards · seasonal capsule — keep/drop? | איילון | שבוע 2 |
| 4 | Creator payout partnerships: affiliate sign-up + vendor בחירה | Jeff + budget | שבוע 2 |
| 5 | App store listing: שם, category, screenshots | כרמל + מארק | שבוע 3 |

---

## חלק י"ז — מסמכי Reference

| נושא | קובץ | הערה |
|------|------|-------|
| **תוכנית אב** | `.claude/master/MASTER_PLAN.md` | **← אתה כאן. מנצח בסתירה** |
| תוכנית רזי (מקור) | `.claude/agents/plans/lucky-percolating-wind.md` | north star מקורי |
| חזון עיצובי (מלא) | `docs/VISUAL_VISION.md` | tokens, components, QA rules |
| תוכנית עסקית | `docs/BUSINESS_PLAN.md` | economics, GTM, investors |
| UX Research | `docs/UX_RESEARCH.md` | מחקר 6 apps, המלצות |
| Cycle Protocol | `.claude/agents/CYCLE_PROTOCOL.md` | BUILD/CRITIQUE/MERGE flow |
| Company Manual | `.claude/agents/docs/COMPANY_OPERATING_MANUAL.md` | org, hierarchy, process |
| Daily Model | `.claude/agents/docs/daily_model.md` | 18 iron rules יומיים |
| Domain knowledge | `.claude/agents/knowledge/ds·be·mb·sf·mg.md` | per-domain lessons |
| Agent files | `.claude/agents/[name].md` | identity + scope per agent |
| Activity log | `.claude/agents/activity_log.md` | concurrent edits — check first |

---

## הצהרת הצוות

> **"We are building a fashion company agentically. The goal is clear: investor-ready iOS app in 4 weeks. Every agent works from this plan. Every decision aligns with the investor demo goal. No feature that doesn't serve that goal ships this cycle. The wardrobe is the profile — and in 4 weeks, a real investor will see it on a real iPhone."**

---

*19.06.2026 | מחליף את גרסה 1 של MASTER_PLAN.md*
*לשינוי: כרמל + רזי בלבד. לכל שאר השינויים — Board Sync → ג'ף*
