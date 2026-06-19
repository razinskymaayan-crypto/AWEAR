# PostCard Design Spec

**תאריך:** 2026-06-19
**מאת:** מארק (Head of Design)
**עבור:** דולצ'ה (ביצוע), גבאנה (QA)
**הקשר:** PostCard הוא ה-building block של Feed. אם הוא טוב — הפיד נראה טוב. spec זה מגדיר את כל היבטי ה-PostCard לפני שדולצ'ה מתחילה.

---

## Dimensions

- width: 100% (stretch to container)
- image: aspect-ratio 4/5, border-radius 12px, object-fit: cover

---

## Layout (top to bottom)

1. **User row:** avatar (32px circle) | displayName (`var(--t-sm)` bold) | timestamp (`var(--muted)`, `var(--t-micro)`)
2. **Image** (4:5 ratio, border-radius 12px)
3. **Action row:** likes count | comments count — icon() calls בלבד, אין emoji
4. **Caption:** `var(--t-body)`, 2 שורות max, `line-clamp: 2`
5. **Tags:** style_tags שורה אחת, `var(--t-micro)`, `var(--muted)`

---

## Tokens

| מאפיין | ערך |
|--------|-----|
| card background | `var(--card)` |
| border-radius (card) | 16px |
| border-radius (image) | 12px |
| padding | 12px |
| shadow on hover | `var(--shadow-accent)` |
| like active color | `var(--accent)` |

כל spacing — רק `var(--space-*)` או ערכים מהרשת: 8 / 12 / 16 / 24px. אין hardcoded margins מחוץ לרשימה.

---

## States

### Like button
- **liked:** `icon('heart')` filled, `color: var(--accent)`
- **not liked:** `icon('heart')` outline, `color: var(--muted)`
- **tap feedback:** `:active { transform: scale(0.92); }` — כלל DS 6

### Username tap
- מוביל ל-profile
- **Cycle 2 — לא מחובר:** `opacity: 0.7` על avatar + displayName כדי לאותת שהlink לא פעיל
- tooltip / toast: לא נדרש Cycle 2

### Image loading
- placeholder: skeleton shimmer (`var(--skeleton-base)` → `var(--skeleton-highlight)`) עד load
- onerror fallback: `icon('hanger', 32)` על background `var(--card)` — לא gradient, לא ריבוע ריק

---

## Action Row — icons בלבד

```
icon('heart', 20)  [likes count]    icon('message', 20)  [comments count]
```

- כל count: `var(--t-sm)`, `var(--muted)` כשלא active
- like count כשliked: `var(--accent)`
- hit target לכל icon button: ≥44px (כלל DS)

---

## Caption

- `var(--t-body)`, `var(--fg)` — לא `var(--muted)`
- `overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;`
- כשהמשתמש לחץ על "קרא עוד" — expansion: Cycle 3 (לא בscope Cycle 2)

---

## Tags

- שורה אחת, `overflow-x: hidden`, אין גלילה אופקית ב-PostCard
- כל tag: `var(--t-micro)`, `var(--muted)`, ללא background — טקסט בלבד עם `#` prefix
- gap בין tags: 8px

---

## What NOT to do

- אין gradient overlay על image
- אין text over image — caption מתחת בלבד, לא above
- אין emoji ב-UI chrome (כלל DS 1) — `icon()` calls בלבד
- אין hardcoded px margins — רק `var(--space-*)` או 8 / 12 / 16 / 24px
- אין hardcoded hex colors — `var(--*)` בלבד
- אין `font-size` hardcoded — `var(--t-*)` בלבד
- אין shadow על image עצמה — shadow רק על card wrapper

---

## Gabbana QA Checklist

לפני כל merge של PostCard:

1. `grep "emoji" static/index.html | grep "post-card\|pc-"` = 0
2. `grep "font-size" static/index.html | grep "post-card\|pc-" | grep -v "var(--t-"` = 0
3. `grep "#" static/index.html | grep "post-card\|pc-" | grep -v "//\|var("` = 0
4. Heart icon — שני states נראים (filled/outline)
5. Image fallback — onerror מוגדר ומחזיר icon נקי
6. Touch targets — heart + comment ≥44px נבדק
7. שאלת העל: "היה עולה ב-Instagram story של AWEAR?"

---

## Dispatch לדולצ'ה

**מה:** implement PostCard component לפי spec זה
**למה:** PostCard הוא ה-building block של Feed — Feed לא נראה טוב עד שPostCard נראה טוב
**מתי:** Cycle 2, אחרי P0 (visual_redesign_brief.md P0-1 עד P0-4 cleared)
**פורמט תוצר:** CSS class `post-card` + JS template function `renderPostCard(post)` בתוך index.html, commit hash + self-check חתום לפי DS-002
**גבולות:** לא לגעת ב-Feed layout (masonry/grid decisions) — PostCard בלבד. לא לשנות ICONS object ללא תיאום.
**מה לא לעשות:** אין to create a new file — הכל ב-index.html הקיים בהתאם לpattern הקיים.
