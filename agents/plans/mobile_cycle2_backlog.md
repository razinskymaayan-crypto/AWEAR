# Mobile Cycle 2 — Backlog

**תאריך:** 2026-06-19
**מחליט:** וראן (Mobile Lead)
**סטטוס:** טיוטה — יוצג ב-Board Sync לפני dispatch

---

## מה יש בסוף Cycle 1

| פריט | בעלים | commit | סטטוס |
|------|--------|--------|-------|
| CameraScreen: live preview, flash toggle, compress, navigate to Wardrobe | דנה | 00a8d05 | הושלם |
| FeedScreen: FlatList, 3 hardcoded cards, getItemLayout, i18n | רועי | — | הושלם |
| App.js: navigation shim מוכן ל-React Navigation drop-in | שניהם | — | קיים |

---

## עדיפויות Cycle 2

### P0 — BootReady (בלי זה אין app)

1. **React Navigation install** — `@react-navigation/native` + `@react-navigation/stack` + `@react-navigation/bottom-tabs`. מחליף את ה-shim ב-App.js.
   - owner: רועי (תשתית, i18n context)
   - הערה: ה-shim ב-App.js נבנה כ-drop-in — replacement הוא swap, לא rewrite
   - pre-work: `AppNavigator.js` skeleton קיים (ראה `mobile/navigation/AppNavigator.js`)
   - definition of done: Metro bundle EXIT 0 + כל מסך קיים מגיע דרך Tab Bar

2. **Tab Bar** — Camera | Feed | Wardrobe | Marketplace | Profile. 5 טאבים. Bottom Tabs.
   - owner: דנה (מחברת CameraTab; מכירה את ה-screens קיימים)
   - הערה: icon names מתוך `SCREENS` ב-`AppNavigator.js` — לא hardcoded strings
   - definition of done: לחיצה על כל טאב מנווטת למסך stub (גם אם ריק)

3. **WardrobeScreen stub** — מסך שמקבל `newImageUri` מ-Camera (destination של navigate).
   - owner: דנה
   - הערה: Cycle 1 דנה הוסיפה `navigate('Wardrobe', { newImageUri })` — stub חייב לקבל ולהציג את ה-URI
   - definition of done: WardrobeScreen מציג `Image` של URI שקיבל + טקסט placeholder

---

### P1 — Next valuable thing

4. **FeedScreen → API** — connect FeedScreen ל-`/api/posts` (סאם בנה בsam/feat/cycle-1-backend).
   - owner: רועי
   - הערה: 3 hardcoded cards מ-Cycle 1 נשארים כ-fallback; API response ממפה ל-PostCard type שמוגדר ב-`mobile_architecture_cycle1.md`
   - definition of done: FeedScreen מביא מ-API, מציג spinner במהלך fetch, מציג fallback בshתand error

5. **ProfileScreen stub** — avatar, username, bio, stats row (followers / following / items).
   - owner: דנה
   - מקור נתונים: `static/data/profiles.json` — UserProfile type קיים ב-`mobile_architecture_cycle1.md`
   - definition of done: מסך עם נתונים hardcoded (profile[0]), layout ברור, ללא API

---

### P2 — Backlog (לא ב-Cycle 2 אלא פה לתיעוד)

6. MarketplaceScreen stub
7. WishlistScreen stub
8. Image upload flow (Camera → compress → API)
9. AppContext.js — locale + capturedUri (הוגדר ב-`mobile_architecture_cycle1.md`, לא מומש)

---

## החלטות ארכיטקטורה שחייבות לקדים dispatch

לפי MB-002: לפני שדנה או רועי מתחילים Cycle 2 — שני הדברים האלה חייבים להיות מתועדים:

### Navigation Stack — Cycle 2
- React Navigation Stack + Bottom Tabs
- מבנה: `BottomTabNavigator` עוטף את 5 המסכים
- `AppNavigator.js` הוא הכניסה היחידה — App.js מייבא רק אותו
- Stack navigator מעל Tab navigator רק אם מסך צריך fullscreen (למשל Camera preview)

### State Management — Cycle 2
- Context API נשאר — לא מוסיפים Zustand ב-Cycle 2
- `AppContext.js` ייוצר ע"י רועי בזמן P0 (Navigation install) — locale + capturedUri
- כל state שרלוונטי למסך אחד בלבד: useState מקומי. לא ל-Context.

---

## כללי ברזל לCycle 2

1. `AppNavigator.js` לא יכיל import של React Navigation עד שה-install בוצע — skeleton בלבד עד אז
2. כל מסך stub: View + Text מינימלי. לא ריק. Metro bundle EXIT 0.
3. `App.js` שינויים — תיאום עם וראן לפני. גם ב-Cycle 2.
4. stall-escalation: 48 שעות בלי commit — וראן מפעיל. לא שואל. לא ממתין.
5. כל string גלוי ב-JSX: דרך `t()` — לא hardcoded. OW-002 + MB-003 חלים.

---

*סטטוס: דורש בדיקה — להצגה ב-Board Sync לפני dispatch*
