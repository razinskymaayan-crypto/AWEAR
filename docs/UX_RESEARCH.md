# AWEAR — UX Research Report
**מחקר ב-6 אפליקציות מובילות | תאריך: 19.06.2026 | מחקר: מארק (Head of Design)**
**מטרה:** להנחות את דולצ'ה ונטה ב-cycle הבא עם כיוון עיצובי מגובה נתוני שוק.

---

## חלק 1 — ממצאים לפי אפליקציה

### Instagram (2026)

**מבנה פיד ופרופיל:**
- פרופיל: 3 עמודות, תמונות אנכיות 3:4 (שינוי מ-2025 מ-1:1 ריבוע). כל thumbnail center-cropped ל-3:4.
- פיד: פוסטים מוצגים ב-ratio המקורי שהועלה. הפורמט המומלץ: 4:5 (1080×1350px). מעל ה-fold: פוסט אחד שמוצג כמעט full-screen, אחריו אחד חלקי.
- CTA: כפתור עריכת פרופיל מתחת ל-bio, לא במסך ה-feed.

**ניווט (Tab Bar — 5 items):**
- סדר: `בית → Reels → DMs → חיפוש → פרופיל`
- כפתור ה-Create (+) הוסר מה-tab bar ועבר לפינה העליונה שמאל.
- ה-DM עלה למרכז — זה אמירה אסטרטגית: ה-app מוביל לשיחה, לא רק לצפייה.

**מיקרו-אינטראקציות:**
- Double-tap על תמונה → heart animation מלא, בועה מתפשטת, משוב מיידי.
- לחיצה ארוכה על Story → pause + zoom.
- `:active` states על כל כפתור ניווט.
- מעבר בין tabs: slide עדין + fade.

**מה AWEAR יכולה ללמוד:**
- הזזת כפתור ה-Create מה-tab bar → FAB בתחתית (AWEAR כבר עושה זאת נכון עם `.fab`).
- ratio 4:5 או 3:4 לתמונות בפרופיל — לא ריבועי.
- DM/chat כ-primary navigation item.

---

### TikTok (2026)

**מבנה פיד:**
- Full-screen vertical video. כל תוכן מקבל 100% מהמסך.
- מעל ה-fold: תוכן אחד בלבד, ללא distraction.
- CTA: בצד ימין (like, comment, share, creator avatar) — vertical action strip.

**ניווט (Tab Bar — 5 items):**
- סדר: `Home → Friends → + (create) → Explore/Community → Inbox → Profile`
- ה-+ (create) ממוקם מרכזי, בולט ויזואלית.
- Tab names משתנים לפי region (EU: "Community" במקום "Explore").

**מיקרו-אינטראקציות:**
- Swipe up: מעבר לתוכן הבא, instant load, ללא עצירה.
- Double-tap: heart animation בצמוד לנקודת הלחיצה (לא מרוכז).
- תוכן מתחיל לנגן אוטומטית בכניסה.
- Follow button: animation מתמלא → checkmark.
- Behavioral learning: הפיד משתנה בזמן אמת לפי behavior.

**מה AWEAR יכולה ללמוד:**
- "Content first, navigation second" — AWEAR צריכה להגיש תוכן ויזואלי עשיר מיד עם כניסה לפיד.
- Action strip אנכי בצד הכרטיסייה: like + share + shop.
- Auto-start content preview בגלילה.

---

### Pinterest (2026)

**מבנה פיד:**
- Masonry grid: 2 עמודות, גבהים משתנים לפי ratio התמונה.
- תמונות מוצגות ב-ratio המקורי — לא חותכים. זו ה-"נשימה" של ה-app.
- מעל ה-fold: 4–5 pins, חלקם חצויים, יוצרים תחושת עומק ורצון לגלול.
- CTA: Save button על כל pin (top-right), color-coded לפי board.

**ניווט:**
- Bottom tab bar: `Home → Search → + → Inbox → Profile`
- Search ממוקם שני — מוביל לdiscovery.
- Interest categories בתוך הפיד (horizontal chip row).

**מיקרו-אינטראקציות:**
- Tap על pin: expand animation מהposition הנוכחי (shared element transition).
- Long-press: preview panel עולה.
- Save: heart animation + board selector.
- Search: instant visual results בזמן הקלדה.

**מה AWEAR יכולה ללמוד:**
- Masonry grid בפיד הלוקים: מותר לתמונות להיות בגבהים שונים — זה נכון ויזואלית.
- Shared element transition בפתיחת כרטיסייה — המוצר "מתרחב" מהposition שלו בגריד.
- Horizontal chips לסינון style (Y2K, Minimal, וכו') — ממש בתחילת המסך.

---

### Depop (2026)

**מבנה פיד ו-card:**
- גריד 2 עמודות (ברוחב 390px = ~180px per column).
- כל card: תמונה full-bleed, למטה: שם הפריט + מחיר + username של המוכר.
- תמונות: vertical, בערך 4:5.
- "Outfits" feature: mood board חדש שמאפשר יצירת collage של פריטים לרכישה — כולם shoppable.
- 90% מהמשתמשים הם Gen Z — עיצוב מאד visual-first.

**ניווט:**
- Bottom tab: `Home → Explore → Sell (+) → Saved → Profile`
- Sell/+ ממוקם מרכז.
- Navigation קרוב ל-Instagram מבחינת מבנה.

**Card structure:**
- תמונת מוצר — מעל 70% מגודל הcard.
- מחיר בולט (font-weight גבוה).
- שם/handle של המוכר.
- Condition badge (New / Like New / Used).
- Like (heart) בפינה.

**מיקרו-אינטראקציות:**
- Like animation: heart fill + bounce.
- Sell flow: step-by-step wizard.
- Filter chips בחיפוש.

**מה AWEAR יכולה ללמוד:**
- Card structure מדויק: תמונה 70% + שם + מחיר + condition badge + מוכר + heart.
- Condition badge חייב להיות visible on card — לא רק בעמוד הפריט.
- Sell flow כ-wizard מודרך, לא טופס גולמי.
- "Outfits" tool = ישיר ל-AWEAR's Outfit Generator.

---

### VSCO (2026)

**מבנה גריד ופרופיל:**
- פרופיל: גריד מרובע, 3 עמודות, תמונות ריבועיות 1:1.
- אפשרויות: unorganized grid / square grid / 2x2.
- פיד: תמונות מ-following, ללא אלגוריתם — כרונולוגי.
- מינימליסטי מאד: אין like counter public, אין comment count — focus על יצירה.

**ניווט:**
- Bottom tab: `Home → Discover → Studio (edit) → AI Lab → Profile`
- VSCO הסיר את כל ה-social metrics — מיתוג כ-creative space, לא popularity contest.

**מה AWEAR יכולה ללמוד:**
- Private metrics mode: אופציה שלא להציג like count (נוגע לproduct decision — להעביר לאיילון).
- 3-column square grid נכון לארון הבגדים של AWEAR — תמונות בגדים עובדות ב-1:1.
- Studio/edit tab: נכון לflow של "סרקי ארון".

---

### Vinted (2026)

**פלטפורמה ומבנה:**
- 75M+ משתמשים. Zero-fee למוכרים; buyer protection fee לקונים.
- Search-driven: keywords קריטיים לvisibility (Y2K, Gorpcore, Archival).
- 4 מסכים מרכזיים: Homepage, Profile, Favorites, Product Page.
- גריד: 2 עמודות, תמונות מוצר full-bleed.

**Card structure:**
- תמונה dominant.
- מחיר.
- Brand/label.
- Size.
- Condition.
- לא מציגה seller avatar בגריד — רק בדף המוצר.

**מה AWEAR יכולה ללמוד:**
- Size + Brand + Condition בcard — מידע שמשתמשת צריכה לפני שנכנסת לעמוד.
- Search keywords כ-primary discovery mechanism — לא רק browse.
- Favorites tab כ-wishlist = כבר קיים ב-AWEAR (wishlist view).

---

## חלק 2 — המלצות ספציפיות ל-AWEAR

### מה לאמץ (עם הנמקה)

| המלצה | מקור | נימוק |
|-------|------|--------|
| FAB מרכזי לcapture (שמור) | TikTok, Instagram, Depop | AWEAR כבר עושה זאת. לשמר. |
| 2-column masonry בפיד הלוקים | Pinterest, Depop | תמונות outfit ב-4:5 → masonry נכון יותר מ-1:1 |
| Condition badge on card | Depop, Vinted | מידע קריטי שמשתמשת צריכה לפני הכניסה לעמוד |
| Heart + burst animation בלייק | Instagram, TikTok, Depop | Table stakes ב-2026. AWEAR כבר מיישמת (`.heart-burst`), לחזק |
| Horizontal style chip row | Pinterest, Depop | בתחילת הפיד: Y2K / Minimal / Streetwear / Vintage — filter מיידי |
| Double-tap to like בפיד | Instagram, TikTok | gesture intuitive. הוסף לfeed cards |
| Share sheet native | Instagram | כשמשתמשת לוחצת Share → native iOS sheet עולה (לא custom modal) |
| Condition + Size בcard של מרקטפלייס | Vinted | כיום AWEAR מציגה רק מחיר בcard. חסרים: condition + size |
| Search keywords בcloset | Vinted | חיפוש חופשי בארון הבגדים — לא רק browse לפי קטגוריה |

### מה לא לאמץ (עם הנמקה)

| דחייה | מקור | נימוק |
|-------|------|--------|
| Full-screen video feed | TikTok | AWEAR היא fashion app, לא video app. תמונות > וידאו. |
| 5 tabs בbar | Instagram | AWEAR יש 5 destinations אבל FAB מחליף אחד. 4+FAB = נכון. |
| ביטול like counter | VSCO | AWEAR צריכה engagement metrics לshow social proof בשלב הזה. |
| Interest-only feed (אין chronological) | TikTok | AWEAR users רוצות לראות את ה-following feed שלהן — לא רק algo |
| 3-column square grid בפיד | Instagram profile | Outfit photos עובדות ב-4:5, לא 1:1. Masonry או 2-col vertical. |

---

## חלק 3 — Feature Placement Map

### Bottom Navigation (4 items + FAB)

```
[בית]  [חיפוש]  [📷 FAB]  [פיד]  [ארון]
```

**נימוק הסדר הנוכחי (תקין):**
- בית: dashboard, overview, נקודת כניסה.
- חיפוש: discovery — בצמוד לבית, כמו Instagram/Pinterest.
- FAB: capture — action ראשי, מרכזי ובולט (כמו Depop/TikTok).
- פיד: social feed — לאחר capture, כי הפיד הוא הpayoff.
- ארון: closet + profile — קצה ימין, כמו Profile בכל app.

**שינוי מומלץ:** אין צורך לשנות את הסדר. הbug הוא בניווט שאינו visual, לא במיקום.

### Feature Destinations

| Feature | מיקום נוכחי | מיקום מומלץ | שינוי |
|---------|-------------|-------------|-------|
| Outfit Generator | בית | בית (שמור) | — |
| Marketplace | מנוי נפרד | ארון > "למכירה" + טאב | שלב |
| Stylist Chat (אביגיל) | FAB → chat | FAB → chat (שמור) | — |
| Style Quiz | Onboarding | Onboarding (שמור) | — |
| Wishlist | ארון | ארון > segment tab | שמור, הוסף icon |
| Search/Explore | חיפוש | חיפוש (שמור) | הוסף style chips |
| Rewards/Analytics | בית | בית > section קטן | הקטן; לא P0 |

### Onboarding Flow המומלץ

**מקור:** מיבוש TikTok + Pinterest + Instagram. עיקרון: ערך לפני הרשמה, 3–5 slides.

```
Slide 1 (Editorial hero) → "הארון שלך, הסגנון שלך" → Next
Slide 2 (Flatlay hero)   → "גלי מה חסר, מצאי מה שאוהבת" → Next
Slide 3 (Boutique hero)  → "AWEAR מכירה אותך" → Next

Quiz Step 1: סגנון (Y2K / Streetwear / Minimal / Cottage Core) — multi select
Quiz Step 2: מטרה (לגלות סגנון / לארגן ארון / לקנות / למכור) — single select
Quiz Step 3: גודל ומידות — completion
Quiz Step 4: מותגים אהובים (optional skip)
Quiz Step 5: Permission push (notifications) — optional, skip available

→ Home screen עם wardrobe ריק + first action CTA מיידי
```

**מה AWEAR כבר עושה נכון:** 3 editorial slides + 5 quiz steps — כמעט זהה לTikTok/Pinterest. אין צורך לשנות את הarchitecture, רק לשפר את ה-visual quality של כל slide.

---

## חלק 4 — 5 מיקרו-אינטראקציות שחייבות להיות ב-AWEAR

### MI-1: Double-Tap to Like בפיד
**מה:** לחיצה כפולה על כרטיס פיד → heart burst מהposition שנלחץ (לא מרוכז).
**מקור:** Instagram + TikTok — table stakes ב-2026.
**מדוע:** הgest הזה כבר מוטמע ב-muscle memory של כל משתמש רשת חברתית. לא לממש = friction.
**ביצוע:** `ondblclick` event → `heart-burst` animation מ-ICONS.heartFill. AWEAR כבר יש `.heart-burst` div — צריך רק לחבר אותו ל-double-tap.

### MI-2: Shared Element Transition בפתיחת כרטיס
**מה:** לחיצה על card בגריד → הcard "מתרחב" לתוך ה-bottom sheet מהposition שלו.
**מקור:** Pinterest.
**מדוע:** יוצר feeling של continuity — המשתמש לא מרגישה שקפצה למקום אחר.
**ביצוע:** `getBoundingClientRect()` על הcard → animate `transform: scale()` + `transform-origin` לפני ש-sheet עולה. CSS transition 250ms ease-out.

### MI-3: Filter Chips Horizontal Scroll
**מה:** בתחילת הפיד ובחיפוש — שורת chips אופקית: Y2K / Minimal / Streetwear / Vintage / All.
**מקור:** Pinterest + Depop.
**מדוע:** מפחית friction בgetting-to-relevant-content. בלי chips, המשתמשת גוללת עד שמוצאת.
**ביצוע:** `overflow-x: auto; scrollbar-width: none; display: flex; gap: 8px;`. Chip height: 32px. `border-radius: 22px` (pill). Active chip: gradient accent→accent2.

### MI-4: Swipe-to-Dismiss על Bottom Sheets
**מה:** bottom sheet (פרטי מוצר, stylist panel) — swipe down סוגר עם spring animation.
**מקור:** Instagram, TikTok, כל native iOS app.
**מדוע:** AWEAR כיום דורשת לחיצה על X לסגירה — זה מלאכותי ומפריע ל-flow.
**ביצוע:** `touchstart/touchmove/touchend` events + `transform: translateY()`. אם deltaY > 80px → סגור עם animation 200ms ease-in.

### MI-5: Skeleton Loading Placeholders
**מה:** בטעינת תמונות מוצר — skeleton רקע (shimmer animation) במקום ריבוע ריק.
**מקור:** Instagram, TikTok — standard ב-2026.
**מדוע:** AWEAR משתמשת ב-Pollinations API שלוחה זמן. משתמשת רואה ריבועים ריקים, מרגישה שהapp שבור.
**ביצוע:** `background: linear-gradient(90deg, var(--card) 25%, var(--line) 50%, var(--card) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite;`. מגדיר dimensions לפני שהתמונה נטענת כדי למנוע layout shift.

---

*מסמך זה מגובה במחקר על Instagram, TikTok, Pinterest, Depop, VSCO, Vinted — 2026.*
*הממצאים ינחו את דולצ'ה ונטה ב-cycle הבא. שאלות על scope מוצרי → איילון.*
*אושר: מארק (Head of Design) | 19.06.2026*
