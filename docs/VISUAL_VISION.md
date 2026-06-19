# AWEAR — Visual Vision
*המסמך הקנוני לחזון העיצובי. DESIGN_STANDARDS.md אוכף את הכללים; המסמך הזה מסביר למה.*
*מאושר על ידי הדירקטוריון — 19.06.2026*

---

## המשפט שמגדיר כל החלטה

> **"The wardrobe is the profile. Fashion is identity. Everyone deserves to look like they mean it."**

AWEAR היא לא ה-marketplace ולא רשת חברתית כללית — היא המקום שבו הארון של אדם אמיתי נראה כמו editorial. כל משתמשת יכולה להרגיש שיש לה טעם, בלי להתנצל עליו.

---

## הפילוסופיה: יוקרה נגישה

| מה זה אומר | מה זה לא אומר |
|-----------|--------------|
| Premium שמרגיש friendly | קר ומרוחק |
| Editorial confidence | Intimidating |
| התמונה היא הכוכב — לא ה-UI | ה-UI מתחרה בתוכן |
| כל אחת יכולה להשתייך | רק "people of taste" |

**References:** Instagram (community, photo-first) + Pinterest (editorial discovery) + Zara (accessible aspiration)

**לא:** TikTok (too loud), Depop (too grungy), Farfetch (too cold)

---

## מצב תצוגה: Light + Dark — auto לפי מכשיר

שניהם. לא בוחרים — המשתמשת בוחרת דרך הגדרות המכשיר שלה. שני המצבים חייבים להרגיש premium באותה מידה.

---

## מערכת צבעים

### Dark Mode — "Mediterranean Night"
```
--bg:         #0d0b09    ← שחור חם. לא קר-כחלחל. כמו עור
--surface:    #161310    ← שכבה ראשונה מעל הרקע
--card:       #1e1a16    ← card, drawer, modal
--card-hover: #26221d    ← hover state
--fg:         #f2ede6    ← לבן שמנת. לא #ffffff
--muted:      #7a7068    ← secondary text — grey חם
--line:       #2a2520    ← separators, borders
--text:       #f2ede6    ← alias of --fg

--accent:     #c4785a    ← terracotta — חמה, אנושית, חומר טקסטיל
--accent2:    #8b7355    ← camel/tan — complement טבעי לterracotta
--accent3:    #6b8c6b    ← sage green — tertiary, success-adjacent

--success:    #5a9e72    ← sage green
--warning:    #c4924a    ← amber חם
--danger:     #c45252    ← brick red
```

### Light Mode — "Mediterranean Day"
```
--bg:         #faf8f5    ← שמנת חמה. לא #ffffff עירום
--surface:    #f2ede6    ← surface מעל הרקע
--card:       #ffffff    ← card — טהור על רקע שמנת
--card-hover: #f7f3ee    ← hover עדין
--fg:         #1a1714    ← שחור חם. לא #000000
--muted:      #7a7068    ← אותו muted בשני המצבים
--line:       #e8e4de    ← border חמה
--text:       #1a1714    ← alias of --fg

--accent:     #b86a4a    ← terracotta עמוקה יותר (contrast על בהיר)
--accent2:    #7a6245    ← camel עמוקה יותר
--accent3:    #5a7a5a    ← sage עמוקה יותר

--success:    #3d7a52
--warning:    #a87830
--danger:     #b03c3c
```

### למה terracotta ולא ורוד/סגול?
הצבעים הקודמים (#e8526a, #7a6af0) מרגישים *digital* — כמו tech startup. Terracotta וcamel הם חומרים: עור, חרס, בד. הם מרגישים מגע. הם מרגישים אנושיים. אופנה = חומרים פיזיים — הaccent אמור לשדר את זה.

---

## טיפוגרפיה

### גופנים
| שימוש | גופן | למה |
|-------|------|-----|
| Headlines (EN) | DM Serif Display | editorial, אלגנטי, ייחודי — לא Poppins של Duolingo |
| Body, labels, UI | Inter | נקי, legible, neutral |
| עברית | Heebo | RTL מצוין, נשמר |
| מחירים, מספרים | Poppins | precision, clean tabular feel |

### סקאלה (5 גדלים בלבד — ללא חריגים)
```
--t-micro:   11px   ← labels, badges, captions
--t-caption: 12px   ← secondary info
--t-body:    14px   ← גוף טקסט ראשי
--t-lead:    17px   ← section headers, emphasized body
--t-title:   22px   ← page titles, card headlines
--t-display: 32px   ← hero moments only
```

### עקרון: פחות זה יותר
Headlines: DM Serif Display, weight 400 (serif אלגנטי לא צריך bold).
Body: Inter 400 / 500. אין 700+ בגוף טקסט.
מחירים: Poppins 600 — בולטים אבל לא צועקים.

---

## שפת תנועה: חי ואנרגטי

האפליקציה עונה מיידית. כל tap מרגיש שהמכשיר מאזין.

### עקרונות
- **Responsive over decorative** — תנועה מספרת מידע, לא מקשטת
- **Spring physics** — לא linear easing. דברים שנעים כמו בעולם האמיתי
- **Instant feedback** — המשתמשת לא מחכה להבין שהלחיצה נרשמה

### ערכים
```
tap feedback:      80ms   ← scale(0.96) + opacity 0.85
card open:         320ms  ← spring(tension: 280, friction: 22)
screen transition: 260ms  ← slide + fade, spring
pull-to-refresh:   bounce ← exaggerated spring
like animation:    120ms  ← pop + subtle particle
modal open:        240ms  ← slide up from bottom, spring
scroll:            native momentum — לא לשחק עם זה
```

### מה לא
- Parallax — מסחרר ומאט
- Long fade-ins לכל טקסט — מרגיש כבד
- לאנימציות decorative על load — המשתמשת רוצה לראות תוכן

---

## Grid ופריסה

### עמודות
**Feed ו-Wardrobe: 2 עמודות** — כרטיסים גדולים, תמונות שנושמות.
**Marketplace / Explore: 2 עמודות** עם option ל-3 (כשהמשתמשת בוחרת).
**Profile grid: 3 עמודות** — תצוגת ארון compact.

### Aspect ratio אחיד
**4:5 portrait** לכל product card ו-outfit card.
זה הפורמט שמחמיא הכי הרבה לבגדים — כמו editorial fashion photography.
Profile thumbnails: 1:1.

### Spacing
```
card gap:        16px   ← בין כרטיסים
section margin:  24px   ← בין סקציות
horizontal pad:  16px   ← margin מהקצה
card padding:    12px   ← padding פנימי בcard
```

### עקרון: הבגד צריך חלל
כרטיס עמוס = כרטיס שנראה זול. התמונה תופסת 75% מגובה הcard. מידע (שם, מחיר, likes) — 25% בלבד.

---

## סטנדרט תמונות: איכות + אותנטיות

לא בוחרים בין השניים — AWEAR היא המקום שבו genuine beauty נראית טוב.

### מה זה אומר בפועל

**בperfect world:** תמונה טובה = תאורה טבעית, רקע נקי, 4:5 portrait, הבגד בפוקוס.

**בעולם האמיתי:** תמונת מראה עם חדר מאחורה, תאורת bathroom — זה בסדר גמור אם הstyling אמיתי.

**הקו האדום:** תמונה מטושטשת לחלוטין, screenshot מאתר אחר, תמונה שלא מראה את הבגד.

### כלים שנותנים guidance, לא requirement
- crop suggestion ל-4:5 ב-upload (לא כפייה)
- brightness/contrast auto-enhance עדין (opt-out זמין)
- הפיד הראשי מעדיף תמונות עם engagement גבוה יותר — quality מתגמלת, לא מנדטורית

### חוק אחד: אין placeholder
אם אין תמונה — אין item. לא emoji, לא gradient, לא ריבוע ריק. תמונה אמיתית בלבד.

---

## מצבים ריקים (Empty States)

אלה הרגעים שבהם הbranding הכי חשוב — המשתמשת חדשה ורגישה.

### עקרון: הזמנה, לא vacuum
Empty state לא אמור להרגיש כמו שגיאה. הוא אמור להרגיש כמו: *"הסיפור שלך מתחיל כאן."*

| מסך | אייקון | headline | subtext | CTA |
|-----|--------|----------|---------|-----|
| Wardrobe ריק | icon.hanger (עדין) | "הארון שלך מחכה" | "כל פריט שמוסיפים בונה את הסגנון שלך" | "הוסיפי פריט ראשון" |
| Feed ריק | icon.sparkles | "עקבי אחרי אנשים שאוהבים את מה שאת אוהבת" | — | "גלי סגנונות" |
| Saved ריק | icon.bookmark | "שמרי look שאהבת" | "לחצי על bookmark בכל פוסט" | — |

---

## ספריית קומפוננטים — היררכיה

### כפתורים
```
Primary:   bg=accent, text=white, r=pill, height=48px
Secondary: border=line, text=fg, r=pill, height=48px
Ghost:     text=accent, no border, height=44px
Danger:    bg=danger, text=white, r=pill — only for destructive
```
רק primary אחד לדף. secondary וghost יכולים להיות כמה.

### Cards
```
Product card:  image 4:5 + [name, price, save icon] — לא יותר
Outfit card:   image 4:5 + [user avatar, username, likes] — לא יותר
Profile card:  image 1:1 + [username] — minimal
```
כלל: כל מה שאפשר להסיר מcard — מסירים.

### Navigation
Bottom tab bar (mobile): 4 items בלבד — Home, Explore, Wardrobe, Profile.
לא יותר. הל-5th tab שמישהו יציע — לא קיים.

---

## מה שלא משתנה לעולם

1. **אפס emoji ב-UI chrome** — אייקון = SVG בלבד
2. **אפס placeholder** — תמונה אמיתית או כלום
3. **כל צבע = token** — אף hex hardcoded
4. **התמונה קודם** — תמיד. בכל card. בכל מסך.
5. **שאלת העל (גבאנה):** "אם AWEAR הייתה מפרסמת screenshot ב-Instagram story — האם הייתה מתביישת?"

---

## הצהרה לצוות

> כשיש ספק בין שתי אפשרויות עיצוביות — בחר את זו שמכבדת יותר את התמונה של המשתמשת ומקטינה את נוכחות ה-UI. אנחנו הבמה. התוכן שלהן הוא המחזה.

*מארק (Head of Design) — כל שאלה עיצובית שלא מכוסה כאן עוברת דרכו לפני ביצוע.*
