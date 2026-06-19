# Mobile Architecture Decisions — Cycle 1
**תאריך:** 2026-06-19
**מחליט:** וראן (Mobile Lead)
**סטטוס:** מאושר — IC יכול להתחיל עבודה

---

## Navigation Stack

**בחירה: Navigation Shim קיים → React Navigation (Stack + Tab) בשלב הבא**

**עובדות שהניחו את ההחלטה:**
- `package.json` לא כולל `@react-navigation/native` ולא `expo-router`
- `App.js` מכיל navigation shim ידני עם הערה מפורשת: "switching to a real NavigationContainer later is a drop-in: replace this file, keep screens"
- ה-shim כבר חושף את ה-API שReact Navigation משתמש בו (`navigate`, `goBack`) — כלומר הסכמה כבר קיימת

**ההחלטה בפועל:**
1. לא מוסיפים `expo-router` — הארכיטקטורה הקיימת מניחה React Navigation
2. בcycle הנוכחי (Cycle 1 Phase 4): דנה ורועי עובדים **עם ה-shim הקיים**, לא מחכים ל-NavigationContainer
3. כשנגיע ל-5+ מסכים — וראן מאשר הוספת `@react-navigation/native` + `@react-navigation/stack`
4. ה-shim ב-`App.js` יתוחזק כ-drop-in point: `navigate(name)` בלבד; לא להוסיף parameters ל-shim — זה שדה מינה של NavigationContainer

**איך להוסיף מסך חדש ל-App.js:**
```js
const SCREENS = {
  CAMERA_PERMISSION: 'CameraPermission',
  CAMERA: 'Camera',
  WARDROBE: 'Wardrobe',   // דוגמה
  FEED: 'Feed',           // דוגמה
};
```
ב-`renderScreen()` מוסיפים `case` מתאים. עד 6 מסכים — הshim מספיק.

---

## State Management

**בחירה: Context API — מספיק לscope הנוכחי**

**הנמקה:**
- המסכים הקיימים: CameraPermission, Camera (בקרוב: Wardrobe, Feed)
- Sharing state נדרש: מינימלי (URI מצולם, locale/שפה)
- Zustand מתאים ל-5+ מסכים עם state משותף מורכב (wishlist, cart, user session) — אנחנו לא שם עדיין
- Context API: 0 dependencies נוספות, קל לreplacement

**מבנה מוצע:**
```
mobile/contexts/AppContext.js
  - locale: 'en' | 'he'
  - setLocale()
  - capturedUri: string | null
  - setCapturedUri()
```

**כלל ברזל:** Context לא ישמש כ-global store. כל state שרלוונטי למסך אחד בלבד — useState מקומי.

---

## Data Types — Shared

אלו ה-types שדנה ורועי **חייבים להשתמש בהם**. לא להמציא מחדש.

### PostCard
```js
// mobile/types/PostCard.js
{
  id: string,           // UUID
  user_id: string,      // מפנה ל-UserProfile.id
  image_url: string,    // URL תמונה ראשית
  caption: string,      // כיתוב
  likes: number,
  comments: number,
  items_tagged: string[], // מערך של item IDs
  created_at: string,   // ISO 8601
}
```

### UserProfile
```js
// mobile/types/UserProfile.js
{
  id: string,
  username: string,
  display_name: string,
  avatar_url: string,
  followers: number,
  following: number,
}
```

**מקור הנתונים לFeedScreen:** `static/data/posts.json` + `static/data/profiles.json` — אלו קיימים (R-005 ב-learnings.md). בcycle הנוכחי: 3 PostCard hardcoded (לא API).

---

## Screen Ownership

| מסך | בעלים | סטטוס |
|------|--------|--------|
| CameraPermissionScreen | דנה | קיים ✓ |
| CameraScreen | דנה | קיים, חסר compression + onPress |
| OnboardingScreen | דנה | עתידי |
| ProfileScreen | דנה | עתידי |
| FeedScreen | רועי | למימוש Cycle 1 Phase 4 |
| WardrobeScreen | רועי | עתידי |
| MarketplaceScreen | רועי | עתידי |
| WishlistScreen | רועי | עתידי |

---

## Shared Infrastructure

| קובץ | מצב | אחריות |
|------|------|--------|
| `mobile/i18n/index.js` | קיים — רועי יצר | שניהם משתמשים |
| `mobile/i18n/en.json` | קיים | שניהם מוסיפים keys |
| `mobile/i18n/he.json` | קיים | שניהם מוסיפים keys |
| `mobile/theme/tokens.js` | קיים | שניהם משתמשים |
| `mobile/App.js` | קיים — shim | **שינויים: תיאום עם וראן לפני** |
| `mobile/contexts/AppContext.js` | ליצור | רועי יוצר בFrame של FeedScreen |
| `mobile/navigation/AppNavigator.js` | לא ליצור עדיין | רק כשReact Navigation נכנס |

---

## Dispatch לדנה — Cycle 1 Phase 4

קרא `agents/plans/mobile_architecture_cycle1.md` לפני שמתחיל.

**משימה 1:** הוסף `expo-image-manipulator` לתלויות:
```json
"expo-image-manipulator": "~13.0.6"
```
ויישם `compressForUpload(uri)` ב-`CameraScreen.js` — target: פלט ≤400KB, quality 0.7.
`compressForUpload` צריך להיקרא בתוך `handleCapture` לאחר `takePictureAsync`.

**משימה 2:** חבר `capturedPrimaryButton` ל-`onPress`:
```js
onPress={() => navigation.navigate('Wardrobe')}
```
הוסף `'Wardrobe'` ל-`SCREENS` ב-`App.js` ו-stub ריק `WardrobeScreen.js` (View + Text בלבד) כדי ש-navigation לא יפול.

**Definition of Done:**
- [ ] `expo-image-manipulator` ב-`package.json`
- [ ] `compressForUpload(uri)` קיים ונקרא ב-`handleCapture`
- [ ] `capturedPrimaryButton` עם `onPress` שמנווט ל-Wardrobe
- [ ] `WardrobeScreen.js` stub קיים (2-3 שורות, לא ריק לגמרי)
- [ ] Metro bundle ב-web: EXIT 0 (ללא Chromium — bundle בלבד)

**זמן:** 24 שעות מרגע הdispatch.

---

## Dispatch לרועי — Cycle 1 Phase 4

קרא `agents/plans/mobile_architecture_cycle1.md` לפני שמתחיל.

**משימה:** צור `mobile/screens/FeedScreen.js` עם:
1. `FlatList` בעל data של **3 PostCard hardcoded** (אין API עדיין)
2. `getItemLayout` מהיום הראשון — ביצועים קריטיים לפיד. גובה קבוע לכל card (למשל 400):
```js
getItemLayout={(data, index) => ({
  length: CARD_HEIGHT,
  offset: CARD_HEIGHT * index,
  index,
})}
```
3. `PostCard` component פשוט: תמונה, שם משתמש, caption — לפי ה-data type המוגדר למעלה
4. כל string גלוי = דרך `t()` מ-`../i18n` (ולא hardcoded)

**הנחיות ארכיטקטורה:**
- השתמש ב-PostCard type כפי שמוגדר בqobץ זה — לא להמציא שדות חדשים
- `image_url` של 3 הposts = URLs ציבוריים מ-Unsplash (כמו שקיים ב-`static/data/posts.json`)
- אין צורך ב-AppContext בcycle הזה — state מקומי מספיק

**Definition of Done:**
- [ ] `FeedScreen.js` קיים עם FlatList
- [ ] `getItemLayout` מיושם
- [ ] 3 PostCard ברורים בRender (לא ריק)
- [ ] אין string גלוי ב-JSX שאינו דרך `t()`
- [ ] Metro bundle ב-web: EXIT 0

**זמן:** 24 שעות מרגע הdispatch.

---

## כללי ברזל לcycle זה

1. `App.js` לא נגעים בלי תיאום עם וראן — זה קובץ משותף
2. `mobile/i18n/en.json` ו-`he.json` — כל key חדש שמוסיפים: שניהם חייבים להוסיף גם לקובץ השני
3. לפני כל PR — Metro bundle EXIT 0. לא "אני חושב שזה עובד"
4. OW-002 חל: "הושלם" = Definition of Done עבר. לא "כתבתי קוד"
