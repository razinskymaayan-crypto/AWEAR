# Profile Screen Design Spec
**תאריך:** 2026-06-19 | **מחבר:** מארק (Head of Design) | **cycle:** 3

---

## קוד בסיס
`mobile/screens/ProfileScreen.js` — stub קיים מ-Cycle 2 (commit 9b24518, dana).
**ממצאים קריטיים שה-spec מתקן:**
- 8 hardcoded hex values (`#0e0c0f`, `#fbfbfd`, `#8a8a9a`, `#c8c8d8`, `#1e1a22`, `#e8526a`) — אפס `var()`. P0 לפי DS כלל 3.
- `ctaSecondary` — `backgroundColor: '#1e1a22'` במקום `transparent`. ה-spec קובע transparent.
- Avatar 88px ללא border — ה-spec קובע 80px + border.
- Post grid ו-empty state לא קיימים — יש לממש.

---

## Header / Hero (top zone)

| אלמנט | ערך |
|-------|-----|
| Avatar | 80px circle (`borderRadius: 40`), `borderWidth: 2`, `borderColor: var(--accent)` |
| displayName | `var(--t-h2)`, `fontWeight: '700'`, `color: var(--fg)` |
| username | `"@handle"`, `var(--t-sm)`, `color: var(--muted)` |
| bio | `var(--t-body)`, `color: var(--fg)`, `numberOfLines: 2`, `ellipsizeMode: 'tail'` |

**מרווחים (8pt grid):** `paddingVertical: 32`, `paddingHorizontal: 16`, gap בין elements: 4/8px.

---

## Stats Row

| אלמנט | ערך |
|-------|-----|
| מספר | `var(--t-h2)`, `fontWeight: '700'`, `color: var(--fg)` |
| תווית | `var(--t-micro)`, `color: var(--muted)` |
| dividers | `borderRightWidth: 1`, `borderColor: rgba(255,255,255,.08)` על הstat הראשון והשני (לא השלישי) |
| padding | `paddingVertical: 16` |

**3 stats בסדר:** לוקים | עוקבים | עוקב אחרי  
**חשוב:** לא להציג ערכי stats עד שיש data אמיתי. `0` הוא ערך לגיטימי — לא placeholder כמו `1240`.
MOCK_PROFILE עם `followers: 1240` — **להסיר לפני Cycle 3** ולהחליף ב-API call.

---

## CTA Row

| כפתור | ערך |
|-------|-----|
| "הוסיפי לוק" (primary) | `backgroundColor: var(--accent)`, `color: var(--fg)`, `minHeight: 44`, `borderRadius: 10`, `fontWeight: '600'`, `var(--t-md)` |
| "עריכת פרופיל" (secondary) | `borderWidth: 1`, `borderColor: var(--line)`, `backgroundColor: transparent`, `color: var(--fg)`, `minHeight: 44`, `borderRadius: 10` |

**מרווחים:** `gap: 12`, `paddingHorizontal: 16`, `paddingVertical: 8`.  
**:active feedback (DS כלל 6):** שני הכפתורים — `opacity: 0.75, transform: scale(0.97)` ב-Pressable `style` callback.

---

## Post Grid

- 3-column grid, `gap: 2` (Instagram pattern)
- כל cell: `aspectRatio: 1`, `objectFit: cover` / `resizeMode: 'cover'`
- תמונות: `source={{ uri: post.image_url }}` — `productImage()` pattern לפי DS כלל 2
- `onerror` fallback: `icon('hanger', 32)` centered על רקע `var(--card)`

**מימוש:** `FlatList` עם `numColumns={3}`, `columnWrapperStyle={{ gap: 2 }}`, `ItemSeparatorComponent` עם height: 2.

---

## Empty State (0 posts)

- icon: `icon('camera', 48)`, `color: var(--muted)`
- טקסט: `"עדיין לא העלית לוקים"`, `var(--t-md)`, `color: var(--muted)`, `textAlign: 'center'`
- CTA: `"צלמי לוק"` → navigate('Camera'), styled כ-primary button (48px min-height, `var(--accent)`)
- padding מסביב: 48px top/bottom

---

## Tokens נדרשים (React Native)

ProfileScreen.js כרגע לא משתמש בשום token. דולצ'ה תייבא מקובץ tokens קיים (או תוסיף ל-AppContext) את הערכים הבאים:

```js
// mobile/tokens.js (ליצור אם לא קיים)
export const colors = {
  bg:     '#0a0a0e',
  card:   '#17171f',
  line:   '#24242e',
  fg:     '#f6f6f9',
  muted:  '#8e8e9c',
  accent: '#ff3d77',
};
```

**לא לכתוב hex ישירות בStyleSheet** — ייבוא מ-tokens בלבד.

---

## What NOT to do

- אין gradient hero overlay מעל ה-avatar או ה-header
- אין stats מומצאים — `0` עד שיש data אמיתית מה-API. MOCK_PROFILE = stub זמני בלבד, לא design intent
- אין emoji בUI chrome — כולל בio placeholder אם ה-app שם ברירת מחדל
- אין `backgroundColor: '#1e1a22'` על secondary CTA — transparent + border בלבד
- אין hardcoded hex בStyleSheet — tokens בלבד
- אין `minHeight` מתחת ל-44px על אף כפתור

---

## Gabbana QA Checklist

לפני כל review request לגבאנה — דולצ'ה עורכת self-check (DS-002):

- [ ] `grep -E "#[0-9a-fA-F]{3,6}" mobile/screens/ProfileScreen.js` = 0 מחוץ ל-tokens.js import
- [ ] `grep -i "emoji\|◦\|•" mobile/screens/ProfileScreen.js` ב-UI strings = 0
- [ ] כל Pressable עם onPress — יש `style` callback עם `pressed` state
- [ ] Avatar border: `borderWidth: 2`, `borderColor` = token (לא hex)
- [ ] minHeight ≥ 44px על שני ה-CTAs
- [ ] Post grid: `numColumns={3}`, gap: 2, `resizeMode: 'cover'`
- [ ] Empty state מוצג כשאין posts (תנאי `posts.length === 0`)

**שאלת העל (DS כלל 7):** "אם AWEAR הייתה מפרסמת screenshot מהמסך הזה ב-Instagram story — האם הייתה מתביישת?"

---

## חסמים ותלויות

| חסם | owner | cycle |
|-----|-------|-------|
| API endpoint לפרופיל (`GET /api/profiles/{user_id}`) | סאם | קיים (commit 8305516) — דורש חיבור |
| `editProfile` onPress | אורן (auth) | Cycle 3 |
| mobile/tokens.js — טוקנים RN | דולצ'ה / נטה | Cycle 3 (ליצור) |
| Post grid — data מה-API | סאם / רועי | Cycle 3 |

---

*מאשר: מארק | ממתין ל: Dolce (ביצוע) + Gabbana (QA)*
