> ⚠️ **מסמך זה הוחלף.** ה-authority הוא **[docs/VISUAL_VISION.md](VISUAL_VISION.md)** — Design Master Plan.
> קובץ זה נשמר כ-reference היסטורי בלבד.

# AWEAR Color System — v2.0 [ARCHIVED]
*בעלות: נטה (Design System Lead) | אושר: APPROVED — מארק, 2026-06-19 | תאריך: 2026-06-19*

---

## ממצאי מחקר — תמצית (5 bullets עיקריים)

**1. Dark mode = תשתית, לא העדפה.**
אפליקציות fashion שבוחרות ברקע כהה — Depop, ASOS, Farfetch dark — עושות זאת כדי שהתמונות ישלטו. מחקר UX מ-Fireart Studio ו-GenDesigns מאשר: dark UI יוצר depth ו-drama שבו product photography מגיחה בלי תחרות. Spotify (#121212), Twitter dark (#15202B) — שניהם בחרו gray כהה ולא שחור טהור מהסיבה הזו בדיוק.

**2. חמימות > קרירות ל-accessible premium.**
שחור/לבן = Chanel = luxury קר ומנוכר (barrier to entry מכוון). Depop בחרה scarlet/white — bold, democratic, youth-forward. AWEAR צריכה "accessible premium" — יוקרה שניתן לנגוע בה, שמזמינה לשתף outfit ולא רק להסתכל. צבעים חמים (ורוד-עפצים, טרקוטה-אמבר) מחקרית מורידים תחושת מכשול נפשי לאינטראקציה.

**3. CTA: ורוד ≠ ורוד.**
Nykaa, Glossier, ו-Pinterest משתמשות בגוון ורוד/rose לCTA כי הוא מותאם לקהל נשי 18-35 ומעביר "fun, youthful, personal". אבל — ורוד ניאון (#ff3d77) מרגיש flash-sale, לא premium. Rose מושתק (#e8526a) = warm, approachable, aspirational. ההבדל: saturation. CTA research (CXL, WiserNotify) מאשר שא/ב testing מוכיח שהצבע הנכון עושה 21-34% הבדל — ה"נכון" תמיד מתוח בינו לפלטה הסובבת אותו.

**4. Accent דואלי = שפה חברתית.**
TikTok: pink (#EE1D52) + turquoise (#69C9D0). Instagram: gradient חם. שניהם משתמשים בשני accents שנמתחים בין חמים לקרירים — כי social interaction לא חד-ממדית. לייק = גסטורה חמה (ורוד). תגית = ניווט קוגניטיבי (צבע שני, מנטרל יותר). AWEAR: accent (rose) = action חמה, accent2 (terracotta) = ארגון/tags.

**5. Mediterranean Modern — Global.**
AWEAR היא global-first (קהל 16-50 מכל העולם) — לא ישראל בלבד. ה-spice tones: terracotta, camel, paprika — אינם "ישראלים" אלא universal warm. Mediterranean Modern מרגיש authentic ולא cheap בכל שוק. הנגדה ל-cold digital (סגול/ציאן) שנוקטות אפליקציות tech — אנחנו fashion, לא fintech.

---

## הפלטה המלאה — v2.0

### רקעים ושכבות

| Token | Hex | שמחליף | הנמקה |
|-------|-----|---------|-------|
| `--bg` | `#0e0c0f` | `#0a0a0e` | near-black עם undertone חמה סגולה. מונע harshness של שחור קר. Photo content בולט יותר כשהרקע לא "מתחרה" בו בקרירות. |
| `--surface` | `#161318` | `#13131f` | layer שני — modals, sheets. delta של 7 בהירות מ-bg, לעומת 4 בפלטה הישנה. elevation ברורה. |
| `--card` | `#1e1a22` | `#17171f` + `#2a2040` + `#1a1030` | warm purple-charcoal. מחליף גם את שני הצבעים שהומצאו מחוץ למערכת. product photography מרגישה "framed" לא "floating". |
| `--card-hover` | `#262030` | `#1f1f38` | hover/pressed — warm purple +8 lightness מ-card. לא עוד hallucinated blue-purple. |
| `--line` | `#2e2836` | `#24242e` | borders, dividers. warm gray-purple. מספיק contrast לסטרוקטורה בלי לצעוק. |

### טקסט

| Token | Hex | שמחליף | הנמקה |
|-------|-----|---------|-------|
| `--fg` | `#f0ecf5` | `#f6f6f9` | primary text. ה-lavender tint העדין מונע blue-white eye fatigue. Contrast על --bg: 16.8:1 (WCAG AAA). |
| `--muted` | `#8a8498` | `#8e8e9c` | secondary text / captions. warm gray-purple. Contrast על --card: 4.6:1 (WCAG AA). |

### Accents / CTA

| Token | Hex | שמחליף | הנמקה פסיכולוגית |
|-------|-----|---------|-----------------|
| `--accent` | `#e8526a` | `#ff3d77` | rose-terracotta. ורוד מושתק > ורוד ניאון = premium feel. מזמין לפעולה (like, follow, buy) בלי urgency aggressiveness. Contrast על --card: 5.2:1 (WCAG AA). |
| `--accent2` | `#c4855a` | `#7b5cff` | terracotta-amber. חמימות ים-תיכונית. tags, badges, secondary highlights. מחבר בין accent לרקעים החמים. |
| `--accent3` | `#7a6af0` | `#06b6d4` | muted indigo. cooldown. notification dots, special states. complement קריר לחמימות של accent/accent2. |

### Gradients

| Token | ערך | הנמקה |
|-------|-----|-------|
| `--grad-primary` | `rose → terracotta` | hero CTAs, cover photos. Mediterranean sunset. מחליף pink→purple (2019 vibes). |
| `--grad-secondary` | `terracotta → indigo` | secondary highlights. מגשר בין חמים לקרירים. |
| `--grad-success` | `emerald → teal` | completion states. |
| `--grad-shine` | `rose/terracotta @ low opacity` | card depth overlay. |

### State Colors

| Token | Hex | שמחליף | הנמקה |
|-------|-----|---------|-------|
| `--success` | `#52c97a` | `#4ade80` | ירוק מעט חם יותר. נמנע מ-"hospital green". |
| `--warning` | `#e8a84a` | `#fbbf24` | amber חם. yellow בהיר נראה כמו caution tape על dark bg. |
| `--danger` | `#e05252` | `#ef4444` | אדום מושתק. מעביר error בלי panic. Contrast על --card: 4.8:1 (WCAG AA). |
| `--overlay` | `rgba(14,12,15,0.80)` | `rgba(0,0,0,0.72)` | scrim שמשתמש ב-RGB של --bg. 80% opacity (היה 72%) לבידוד תוכן חזק יותר. |

---

## Do's & Don'ts

### עשי

- השתמשי ב-`--accent` בלבד לCTA ראשי (like, follow, buy, upload).
- השתמשי ב-`--accent2` לelements שניוניים — tags, category badges, price highlights.
- כאשר ב-hover: `--card` → `--card-hover`. אין לגזור ערך ידנית.
- gradients — `--grad-primary` לhero בלבד. לא לכל כפתור.
- text-2 / timestamp / caption: `--muted` בלבד. אין `opacity: 0.6` על `--fg`.
- shadow על card שעלה (modal, sheet): `--shadow-md` או `--shadow-lg`. לא box-shadow ידני.

### אל תעשי

- אין `#2a2040`, `#1a1030`, ושום hex שאינו ב-awear-tokens.json. אלה hallucinated colors שיוצאים מחוץ למערכת (ראי DESIGN_STANDARDS.md כלל 3).
- אין `var(--accent)` על background surfaces — accent הוא foreground בלבד.
- אין שני accents על אותה רכיב בלי היררכיה ברורה (primary vs secondary).
- אין `color: white` או `color: #fff` — `color: var(--fg)` בלבד.
- אין `background: #000` — `background: var(--bg)` בלבד.
- אין `opacity: 0.5` לhover — כל hover state צריך token מפורש או `:active` CSS.
- אין gradients על card backgrounds בלי אישור מפורש מנטה — gradient "shine" בלבד.

---

## מה השתנה מ-v1 ולמה

### הבעיה המרכזית ב-v1
הפלטה הישנה בנויה על שני צירים שנלחמים: ורוד קר (#ff3d77) מול סגול קר (#7b5cff). שניהם saturated גבוה, שניהם cool-tone. על רקע near-black קר (#0a0a0e) — התוצאה מרגישה כמו nightclub app, לא fashion social. בנוסף — שני צבעים (#2a2040, #1a1030) שנכנסו לקוד ללא כל token reference, שוברים את ה-system.

### מה השתנה ולמה

| שינוי | v1 | v2 | סיבה |
|-------|----|----|------|
| Accent ראשי | `#ff3d77` (ניאון) | `#e8526a` (rose) | premium feel > flash sale feel |
| Accent שני | `#7b5cff` (סגול קר) | `#c4855a` (terracotta) | חמימות מדיטרנית, תואם --bg החדש |
| Accent שלישי | `#06b6d4` (ציאן) | `#7a6af0` (indigo) | complement אחיד לפלטה החמה |
| רקע ראשי | `#0a0a0e` (קר) | `#0e0c0f` (חמים) | undertone סגול-חמה, פחות industrial |
| surface | `#13131f` | `#161318` | delta בהירות גדול יותר מ-bg — elevation ברורה |
| card | `#17171f` | `#1e1a22` | warm purple-charcoal, מחליף גם את 2a2040/1a1030 |
| fg | `#f6f6f9` | `#f0ecf5` | lavender tint עדין, פחות eye fatigue |
| grad-primary | `pink→purple` | `rose→terracotta` | Mediterranean > electro-pop |
| overlay opacity | `72%` | `80%` | בידוד modal חזק יותר |
| shadow color | `rgb(0,0,0)` | `rgb(14,12,15)` | תואם --bg, לא generic black |

### מה לא השתנה
שמות ה-variables — ללא יוצא מן הכלל. שינוי שמות = breaking change לכל הcodebase. v2 הוא drop-in replacement.

---

## WCAG Contrast Reference

| זוג | Ratio | דרישה |
|-----|-------|--------|
| `--fg` על `--bg` | 16.8:1 | AAA |
| `--fg` על `--card` | 12.1:1 | AAA |
| `--accent` על `--card` | 5.2:1 | AA |
| `--accent2` על `--bg` | 4.6:1 | AA |
| `--muted` על `--card` | 4.6:1 | AA |
| `--danger` על `--card` | 4.8:1 | AA |

*חישובים ידניים — לפני merge של color change, אמתי ב-webaim.org/resources/contrastchecker.*

---

## Light Mode — מתוכנן לCycle 3 (החלטת board 19.06.2026)

Light + Dark auto לפי מכשיר — שני המצבים חייבים להרגיש premium באותה מידה.

| Token | Dark | Light | הנמקה |
|-------|------|-------|-------|
| `--bg` | `#0d0b09` | `#faf8f5` | שמנת חמה — לא pure white |
| `--surface` | `#161310` | `#f2ede6` | layer שני |
| `--card` | `#1e1a16` | `#ffffff` | card טהור על רקע שמנת |
| `--fg` | `#f2ede6` | `#1a1714` | שחור חם — לא #000000 |
| `--muted` | `#7a7068` | `#7a7068` | אותו ערך בשני המצבים |
| `--line` | `#2a2520` | `#e8e4de` | border חמה |
| `--accent` | `#c4785a` | `#b86a4a` | terracotta עמוקה יותר לlight (contrast) |
| `--accent2` | `#8b7355` | `#7a6245` | camel עמוקה יותר לlight |

*accent ו-accent2 הם הפלטה המתוכננת לCycle 3 — שונים מהvalues הנוכחיים המיושמים (#e8526a, #c4855a). ראה VISUAL_VISION.md.*

---

## Migration Status — P0

| צבע לא-מוסמך | הופעות ב-index.html | token נכון | בוצע |
|--------------|-------------------|------------|-------|
| `#2a2040` | 9 | `var(--card)` | ממתין |
| `#1a1030` | 13 | `var(--card)` / `var(--bg)` | ממתין |
| `#1f1f38` | — | `var(--card-hover)` | ממתין |

*Migration אוטונומי — לא מצריך אישור מארק. יבוצע ב-batch נפרד, batch אחד לכל צבע.*

---

*כל שאלה על token → נטה. כל שאלה על brand direction → מארק.*
*עודכן: 2026-06-19*
