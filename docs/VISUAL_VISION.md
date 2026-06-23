# AWEAR — Design Master Plan
*מסמך עיצוב יחיד. מחליף את: DESIGN_STANDARDS.md, COLOR_SYSTEM.md, ICON_SYSTEM.md.*
*מאושר על ידי הדירקטוריון — 19.06.2026 | בעלות: מארק (Head of Design)*

---

## ⭐ DESIGN DIRECTION v2 — Premium Editorial **LIGHT** (Founder override · Maayan · 2026-06-21)
> **This section SUPERSEDES the color/aesthetic direction below it.** Founder decision: pivot from dark-warm to **premium editorial light**. Where v2 conflicts with older text (e.g. "dark = premium", "לא Farfetch"), **v2 wins.** Agents: build to v2.

**The one line:** *A fashion app that feels like a magazine — clean, light, editorial, image-first. Every layer borrows from the best app in its category.*

**Per-layer references (study these, match their feel):**
| Layer | Reference | What to take |
|---|---|---|
| Closet / Wardrobe | **Whering** | calm light grid of clean cut-out garments; "your wardrobe, organized & beautiful" |
| Shopping / Shop-the-Look | **Farfetch · ASOS** | white canvas, big product imagery, lots of white space, refined editorial type, minimal chrome |
| Social feed | **Instagram** | content-first, full-bleed media, near-invisible clean UI |
| AI Stylist | **modern AI assistants** | calm conversational UI, suggestion cards/chips, proactive but uncluttered |

**Aesthetic rules (v2):**
- **Light, warm-white canvas.** Lots of negative space. The product images are the only "loud" thing — UI recedes.
- **Editorial typography drives hierarchy** — large, confident headings; generous spacing; restraint.
- **Near-monochrome.** Primary actions = editorial black on white (Farfetch/ASOS). Color used *sparingly* as a single highlight, never neon.
- **No dark-neon, no heavy gradients, no glow.** Premium = quiet, not loud.

**Color tokens (v2 — light). Use ONLY tokens; replace hardcoded hex as you touch each screen:**
```css
--bg:    #FAF9F7;  /* warm off-white canvas */
--bg2:   #FFFFFF;  /* raised surfaces / cards */
--card:  #FFFFFF;
--surface:#F3F1EC; /* subtle fills, chips, shelves */
--text:  #14110F;  /* near-black, editorial */
--muted: #8A857E;  /* secondary text */
--line:  #E9E5DF;  /* hairline borders */
--accent:  #14110F; /* primary action = editorial black */
--accent2: #3D3833; /* subtle gradient partner (keep gradients minimal) */
--hl:    #E84A5F;  /* sparing brand highlight (active state / sale) — rare */
```
Re-theme is systematic & screen-by-screen (Dolce builds → Gabbana gates 8+ → `npm run check-render`). Until a screen is converted it may look mixed — that's expected mid-migration.

---

## חלק א׳ — חזון ופילוסופיה

### המשפט שמגדיר כל החלטה

> **"The wardrobe is the profile. Fashion is identity. Everyone deserves to look like they mean it."**

AWEAR היא לא marketplace ולא רשת חברתית כללית — היא המקום שבו הארון של אדם אמיתי נראה כמו editorial. כל משתמשת יכולה להרגיש שיש לה טעם, בלי להתנצל עליו.

### יוקרה נגישה — מה זה אומר בפיקסלים

| מה זה אומר | מה זה לא אומר |
|-----------|--------------|
| Premium שמרגיש friendly | קר ומרוחק |
| Editorial confidence | Intimidating |
| התמונה היא הכוכב — לא ה-UI | ה-UI מתחרה בתוכן |
| כל אחת יכולה להשתייך | רק "people of taste" |
| חשכה + גוונים חמים = premium שמזמין | cold dark = tech/gaming |

**References (benchmark לכל החלטה):** Instagram · Pinterest · Zara

**לא:** TikTok (too loud) · Depop (too grungy) · Linear/Farfetch (too cold/tech)

### שאלת העל (גבאנה בודקת לפני כל merge)
> **"אם AWEAR הייתה מפרסמת screenshot מהמסך הזה ב-Instagram story של הברנד — האם הייתה מתביישת?"**

אם כן — חוסמת. לא מסמנת checkbox, שואלת בפועל.

---

## חלק ב׳ — מערכת צבעים

### עקרון: הצבע הכי חזק = התמונות של המשתמשות

הרקע קיים כדי שהתמונות יפרצו. accents קיימים כדי לכוון פעולה. ה-UI לא מתחרה בתוכן.

### מצב תצוגה: Light + Dark — auto לפי מכשיר
שניהם. לא בוחרים — המשתמשת בוחרת דרך הגדרות המכשיר. שני המצבים חייבים להרגיש premium באותה מידה. (החלטת board 19.06.2026)

---

### טוקנים נוכחיים (מיושמים — Dark Mode)
*Source of truth: `static/tokens.css`. אין edit ידני — רק דרך `awear-tokens.json`.*

```
רקעים ושכבות:
--bg:         #0e0c0f    ← near-black חם
--surface:    #161318    ← modals, sheets
--card:       #1e1a22    ← product cards, panels
--card-hover: #262030    ← hover/pressed state

טקסט:
--fg:         #f0ecf5    ← primary text (lavender tint עדין)
--text:       #f0ecf5    ← alias של --fg
--muted:      #8a8498    ← secondary / captions

מבנה:
--line:       #2e2836    ← borders, dividers

accents:
--accent:     #e8526a    ← rose-terracotta (CTA ראשי)
--accent2:    #c4855a    ← terracotta-amber (tags, badges)
--accent3:    #7a6af0    ← muted indigo (states מיוחדים)

states:
--success:    #52c97a
--warning:    #e8a84a
--danger:     #e05252
--overlay:    rgba(14,12,15,0.80)
```

**WCAG contrast (dark mode):**
| זוג | Ratio | דרישה |
|-----|-------|--------|
| `--fg` על `--bg` | 16.8:1 | AAA ✓ |
| `--fg` על `--card` | 12.1:1 | AAA ✓ |
| `--accent` על `--card` | 5.2:1 | AA ✓ |
| `--muted` על `--card` | 4.6:1 | AA ✓ |
| `--danger` על `--card` | 4.8:1 | AA ✓ |

---

### פלטה מתוכננת — Cycle 3 ("Mediterranean Warm")
*המעבר מ-rose/indigo → terracotta/camel מלא. שני המצבים.*

**Dark Mode — "Mediterranean Night"**
```
--bg:         #0d0b09    ← שחור חם. כמו עור, לא plastic
--surface:    #161310
--card:       #1e1a16    ← warm brown-charcoal (לא purple)
--card-hover: #26221d
--fg:         #f2ede6    ← שמנת חמה
--muted:      #7a7068    ← grey חם
--line:       #2a2520

--accent:     #c4785a    ← terracotta טהורה — חומר טקסטיל, לא digital
--accent2:    #8b7355    ← camel/tan
--accent3:    #6b8c6b    ← sage green
--success:    #5a9e72
--warning:    #c4924a
--danger:     #c45252
```

**Light Mode — "Mediterranean Day"**
```
--bg:         #faf8f5    ← שמנת חמה. לא #ffffff עירום
--surface:    #f2ede6
--card:       #ffffff    ← טהור על רקע שמנת
--card-hover: #f7f3ee
--fg:         #1a1714    ← שחור חם. לא #000000
--muted:      #7a7068    ← אותו ערך כמו dark
--line:       #e8e4de

--accent:     #b86a4a    ← terracotta עמוקה יותר (contrast על בהיר)
--accent2:    #7a6245    ← camel עמוקה יותר
--accent3:    #5a7a5a    ← sage עמוקה יותר
--success:    #3d7a52
--warning:    #a87830
--danger:     #b03c3c
```

### למה terracotta/camel ולא ורוד/סגול?
ורוד (#ff3d77) וסגול (#7b5cff) מרגישים *digital* — tech startup. Terracotta וcamel הם חומרים: עור, חרס, בד. הם מרגישים מגע. הם מרגישים אנושיים. אופנה = חומרים פיזיים — הaccent אמור לשדר את זה.

### כללי צבע — do's & don'ts
**עשי:**
- `--accent` בלבד לCTA ראשי (like, follow, buy, upload)
- `--accent2` לelements שניוניים — tags, badges, price highlights
- `--card` → `--card-hover` ב-hover. לא לגזור ערך ידנית
- `--muted` לcaptions. אין `opacity: 0.6` על `--fg`

**אל תעשי:**
- אין hex שאינו token — אפילו אם "נראה קרוב"
- אין `color: white` — `color: var(--fg)` בלבד
- אין `background: #000` — `var(--bg)` בלבד
- אין `--accent` על background surfaces — foreground בלבד
- אין gradients על card backgrounds בלי אישור מארק

---

## חלק ג׳ — טיפוגרפיה

### גופנים
| שימוש | גופן | למה |
|-------|------|-----|
| Headlines (EN) | **DM Serif Display** | editorial, אלגנטי, ייחודי — לא Poppins של Duolingo |
| Body + UI labels | **Inter** | נקי, legible, neutral |
| עברית + RTL | **Heebo** | RTL מצוין, נשמר |
| מחירים + מספרים | **Poppins** | precision, tabular feel |

### סקאלה — 10 גדלים, tokens בלבד
```
--t-micro:   11px   ← labels, badges, captions קטנות
--t-caption: 12px   ← secondary info
--t-small:   13px   ← תוכן משני
--t-body:    14px   ← גוף טקסט ראשי
--t-h3:      15px   ← sub-section headers
--t-lead:    17px   ← emphasized body, section headers
--t-h2:      18px   ← page sub-titles
--t-title:   20px   ← page titles
--t-h1:      24px   ← main headlines
--t-display: 32px   ← hero moments בלבד
```

**אזהרה:** `--t-sm`, `--t-md`, `--t-lg` — **לא קיימים**. שימוש בהם = שבירה שקטה.

### משקלים
- DM Serif Display: 400 בלבד (serif אלגנטי לא צריך bold)
- Inter: 400 / 500. אין 700+ בגוף טקסט
- Poppins (מחירים): 600

---

## חלק ד׳ — מרווחים, רשת ופריסה

### רשת 8pt
```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-6: 24px
--space-8: 32px
```
כל ערך שאינו ברשימה — דורש הסבר מפורש ב-PR description.

### רדיוסים
```
--r-xs:   6px    ← chips, tags קטנות
--r-sm:   10px   ← buttons, inputs
--r-md:   14px   ← cards
--r-lg:   20px   ← modals, sheets
--r-xl:   28px   ← bottom sheets גדולים
--r-pill: 999px  ← badges, pills
```

### Grid
| מסך | עמודות | הערות |
|-----|--------|-------|
| Feed, Wardrobe | **2 עמודות** | כרטיסים גדולים, תמונות שנושמות |
| Marketplace, Explore | 2 (אפשרות ל-3) | user choice |
| Profile grid | **3 עמודות** | תצוגת ארון compact |

### Aspect Ratio
- **Product card / Outfit card:** `4:5` portrait — כמו editorial fashion photography
- **Profile thumbnails:** `1:1` square

### Spacing בין רכיבים
```
card gap:        16px
section margin:  24px
horizontal pad:  16px
card inner pad:  12px
```

**עיקרון: הבגד צריך חלל.** כרטיס עמוס = כרטיס שנראה זול. תמונה = 75% גובה הcard. מידע = 25% בלבד.

---

## חלק ה׳ — שפת תנועה

### עקרונות
- **Responsive over decorative** — תנועה מספרת מידע, לא מקשטת
- **Spring physics** — לא linear easing. דברים שנעים כמו בעולם האמיתי
- **Instant feedback** — המשתמשת לא מחכה להבין שהלחיצה נרשמה

### ערכים
```
tap feedback:       80ms   ← scale(0.96) + opacity 0.85 — מיידי, מרגיש responsive
card open:         320ms   ← spring(tension:280, friction:22)
screen transition: 260ms   ← slide + fade, spring
pull-to-refresh:  bounce   ← exaggerated spring
like animation:    120ms   ← pop + subtle particle
modal open:        240ms   ← slide up from bottom, spring
:active CSS min:          ← scale(0.97) opacity(0.75)
```

### מה לא
- Parallax — מסחרר ומאט
- Fade-in decorative על כל טקסט בload — כבד ומעצבן
- אנימציות על load ראשוני — המשתמשת רוצה תוכן, לא show

---

## חלק ו׳ — מערכת אייקונים

### ההחלטה: ICONS object קיים — לא CDN חיצוני
AWEAR יש icon system מלא: `icon(name, size)` + `ICONS` object, 40+ icons. הבעיה הייתה emoji שעקפו אותו. הפתרון: לא לטעון Lucide CDN — להוסיף SVG paths לIcons object.

### כלל אחד: אין emoji ב-UI chrome — לעולם
- **מותר:** emoji בתוכן שמשתמשת כתבה (כיתוב פוסט, תגובה)
- **אסור:** emoji כאייקון, כפתור, badge, ניווט, סטטוס indicator

### גדלים (3 גדלים בלבד)
| גודל | שימוש |
|------|-------|
| 20px | icons בתוך טקסט, metadata |
| 24px | icons עצמאיים, action buttons, navigation |
| 28px | section titles, כותרות סעיפים |

*גדלים חריגים (44–60px) — מותרים ב-empty states בלבד.*

### כללי SVG
```
stroke="currentColor"   ← חובה — יורש צבע מהורה
fill="none"             ← ברירת מחדל
stroke-width: 1.8       ← אחיד בכל icon, לא לשנות
viewBox: 0 0 24 24      ← grid סטנדרטי
```

### Hit targets (WCAG AA)
כל icon שמשמש כbutton — container חייב להיות **44×44px** לפחות. הicon עצמו יכול להיות 24px.

```css
.icon-btn { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; }
```

### Semantic accessibility
```html
<!-- decorative -->
<span aria-hidden="true">${icon('heart', 24)}</span>

<!-- interactive -->
<button aria-label="שמרי לוק">${icon('bookmark', 24)}</button>
```

### icon() — רק ב-JS template literals
`icon()` מחזיר string — עובד רק בJS. בstatic HTML שורות — inline SVG ישיר בלבד.

---

## חלק ז׳ — תוכן ותמונות

### עיקרון: photograph-first — תמיד
כל card, כל פוסט, כל product — התמונה היא הכוכב. אין emoji, אין placeholder, אין text שמתחרה. הרקע קיים כדי שהתמונות יפרצו.

### סטנדרט: איכות + אותנטיות
לא בוחרים בין השניים — AWEAR היא המקום שבו genuine beauty נראית טוב.

**תמונה מצוינת:** תאורה טבעית, רקע נקי, 4:5 portrait, הבגד בפוקוס.
**תמונה מקובלת:** תמונת מראה עם חדר מאחורה — בסדר גמור אם הstyling אמיתי.
**קו אדום:** תמונה מטושטשת לחלוטין, screenshot מאתר אחר, תמונה שלא מראה את הבגד.

### כלים — guidance, לא requirement
- crop suggestion ל-4:5 ב-upload (לא כפייה)
- brightness/contrast auto-enhance עדין (opt-out זמין)
- הפיד מעדיף תמונות עם engagement גבוה — quality מתגמלת, לא מנדטורית

### חוק אחד שלא משתנה: אין placeholder
אם אין תמונה — אין item. לא emoji, לא gradient, לא ריבוע ריק.

### data objects — `search_query` בלבד
```javascript
// נכון:
{ name: "ג'ינס כחול", search_query: "blue slim jeans women" }

// שגוי — P0:
{ name: "ג'ינס כחול", emoji: "👖" }
```

---

## חלק ח׳ — ספריית קומפוננטים

### כפתורים — היררכיה
```
Primary:   bg=var(--accent)   text=white  r=var(--r-pill)  height=48px
Secondary: border=var(--line) text=var(--fg) r=var(--r-pill) height=48px
Ghost:     text=var(--accent) no border   height=44px
Danger:    bg=var(--danger)   text=white  r=var(--r-pill)  — destructive בלבד
```
**כלל:** רק primary אחד לדף. secondary וghost יכולים להיות כמה.

### Cards — מה שאפשר להסיר — מסירים
```
Product card:  image 4:5 + [name, price, save icon]          ← לא יותר
Outfit card:   image 4:5 + [user avatar, username, likes]    ← לא יותר
Profile card:  image 1:1 + [username]                        ← minimal
```

### Navigation
**Bottom tab bar (mobile): 4 items בלבד** — Home · Explore · Wardrobe · Profile.
5th tab שמישהו יציע — לא קיים.

### מצבים ריקים (Empty States) — הזמנה, לא vacuum
| מסך | headline | CTA |
|-----|----------|-----|
| Wardrobe ריק | "הארון שלך מחכה" | "הוסיפי פריט ראשון" |
| Feed ריק | "עקבי אחרי אנשים שאוהבים מה שאת אוהבת" | "גלי סגנונות" |
| Saved ריק | "שמרי look שאהבת" | — |

---

## חלק ט׳ — כללי איכות ואכיפה

### 7 כללים — כולם אוכפים, גבאנה מאמתת לפני merge

**כלל 1 — אפס emoji ב-UI chrome**
```bash
grep -n "emoji\|\.qo-emoji\|\.tc-emoji\|\.ex-result-emoji" static/index.html
# → חייב להחזיר 0 בcontexts של UI chrome
```

**כלל 2 — כל product card = תמונה אמיתית**
```bash
grep "item.emoji\|\.emoji\|'👗'\|'👖'\|'👟'" static/index.html | grep -v "//\|user-content"
# → חייב להחזיר 0
```

**כלל 3 — background = token, לא hex**
```bash
grep -c "#[0-9a-fA-F]\{6\}" static/index.html
# → כל תוצאה שאינה token = P0
```
מיפוי ידוע: `#2a2040` → `var(--card)` | `#1a1030` → `var(--bg)` / `var(--card)`

**כלל 4 — typography = tokens בלבד**
```bash
grep "font-size" static/index.html | grep -v "var(--t-"
# → חייב להחזיר 0 בPR חדש
```
אין `--t-sm`, `--t-md`, `--t-lg` — שמות אלה לא קיימים.

**כלל 5 — רשת 8pt**
כל `padding/margin/gap` = מרשימה: 4 / 8 / 12 / 16 / 24 / 32px. חריגה = הסבר ב-PR.

**כלל 6 — כל אינטראקציה = feedback**
```bash
grep -c "onclick" static/index.html
grep -c ":active" static/index.html
# → הפער הוא חוב. PR חדש עם onclick ללא :active — חסום.
```
minimum: `:active { opacity: 0.75; transform: scale(0.97); }`

**כלל 7 — שאלת העל (ראה חלק א׳)**

---

### קווים אדומים — P0 (פסילה אוטומטית, ללא דיון)

1. **emoji כ-UI element** — אייקון, כפתור, ניווט, badge, status. לעולם לא.
2. **מוצר/בגד באימוג'י או ריבוע ריק** — תמונה אמיתית בלבד. fallback = SVG נקי.
3. **hex color מחוץ למערכת** — כל hex שאינו ב-`awear-tokens.json`.
4. **`emoji` field כ-display default** בdata objects של מוצרים.
5. **טיפוגרפיה מחוץ לסקאלה**, ניגודיות מתחת ל-WCAG AA, יעדי מגע <44px.
6. **תוכן mockup גלוי** שנראה מזויף — מספרים/תמונות שלא מגיעים מdata.

---

### Definition of Done — checklist לפני כל PR עיצובי

- [ ] אפס emoji ב-UI chrome (grep כלל 1 + 2 = 0)
- [ ] כל בגד/מוצר = תמונה אמיתית + fallback SVG נקי
- [ ] כל token בשם הנכון, כל hex = token (grep כלל 3 = 0)
- [ ] typography = tokens בלבד (grep כלל 4 = 0 לPR חדש)
- [ ] spacing = רשת 8pt, radius = token
- [ ] grid = 2 עמודות (feed/wardrobe), 4:5 portrait
- [ ] motion = spring, tap ≤80ms, `:active` לכל onclick (grep כלל 6)
- [ ] empty / loading / error states מטופלים ומזמינים
- [ ] RTL נכון, ניגודיות WCAG AA, יעדי מגע ≥44px
- [ ] light mode + dark mode: שניהם נראים premium
- [ ] **שאלת העל:** גבאנה ענתה בפועל — שורה `Visual QA: עבר / לא עבר — [סיבה]` ב-PR

---

## חלק י׳ — אבולוציה מתוכננת (Cycle 3)

### מה עדיין לא מיושם ומה מחכה

| פריט | סטטוס | משפיע על |
|------|--------|---------|
| Light mode tokens ב-`tokens.css` | ממתין | web |
| מעבר לפלטה terracotta/camel | ממתין | web + mobile |
| Migration של 366 hardcoded spacings | ממתין | web |
| 26 emoji ב-SF_ITEMS/STYLISTS_DATA | ממתין | web |
| Mobile token migration (awear-tokens.json → Med. Modern) | ממתין | mobile |
| DM Serif Display — הטמעה בpractice | ממתין | web + mobile |

### כלל: לא לשבור מה שעובד
כל migration בbatch נפרד, batch אחד לכל שינוי. לא "big bang refactor".

---

## הצהרה לצוות

> כשיש ספק בין שתי אפשרויות עיצוביות — בחר את זו שמכבדת יותר את התמונה של המשתמשת ומקטינה את נוכחות ה-UI. אנחנו הבמה. התוכן שלהן הוא המחזה.

**היררכיה:** שאלה עיצובית → מארק. ביצוע → דולצ'ה. QA → גבאנה. עקיפת שלב = כשל מבני.

---

*עודכן: 19.06.2026 | מחליף: DESIGN_STANDARDS.md · COLOR_SYSTEM.md · ICON_SYSTEM.md*
*הקבצים הישנים נשמרים לhאורך הזמן כreference — המסמך הזה הוא ה-authority.*
