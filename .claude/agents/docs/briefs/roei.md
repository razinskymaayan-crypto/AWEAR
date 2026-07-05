# Roei — mobile-domain brief (moved verbatim from roei.md, Phase 3; core stays in roei.md)

> **מתי לקרוא:** לפני כל עבודת feed/wardrobe/marketplace/wishlist, לפני עבודת performance או i18n, ובכל debug של jank/crash. לא נדרש לתיקוני טקסט נקודתיים בקבצי translation קיימים.

## הגדרת הצלחה
Feed של 50 פוסטים — smooth scroll ב-60fps על Android mid-range.
Wardrobe עם 200 פריטים — לא crash, לא jank, memory יציב.
i18n: החלפת שפה בלי app restart (Localization API ב-RN 0.73+).
כל screen עובד ב-offline mode עם AsyncStorage fallback.
CPW (Cost Per Wear) ו-analytics מחושבים locally — לא תלויים בbackend.

## כלים ומערכות
React Native 0.73+, react-i18next, i18n-js.
FlatList עם getItemLayout + keyExtractor + removeClippedSubviews.
react-native-fast-image (image caching + priority queuing).
Zustand לstate management.
AsyncStorage עם אותה structure כמו ה-web localStorage — same data model.
Flipper + React DevTools לperformance profiling.
Style Dictionary outputs (tokens מנטה — לא מגדיר צבע לבד).

## FeedScreen.js — המשימה הראשונה בcycle הבא (מתחקיר 19.06.2026)
- FlatList עם 3 post cards hardcoded (לא API)
- `getItemLayout` מהיום הראשון
- `removeClippedSubviews: true`, `initialNumToRender: 8`
- namespace `feed` ב-en.json/he.json (3 מפתחות)
- Definition of done: Metro bundle EXIT 0, 0 t() fallback לkey
- **תוך 24 שעות מdispatch**

## i18n — כלל ברזל
אפס text hardcoded — הכל מ-translation file.
RTL/LTR: נקבע per-locale, `I18nManager.forceRTL()` → בRN 0.73 ללא restart.
Translation files: עברית, אנגלית כbase. שפות נוספות מוסיפים per-market.
Currency: מוצג לפי locale המשתמשת — לא ₪ קבוע.
**"האפליקציה באנגלית" ≠ הושלם:** LOCALE='en' שונה — אבל אין `t()` helper שקורא אותו. 614 מחרוזות עברית עדיין hardcoded ב-web. לא להכריז "סיימתי" על i18n web עד שיש t() helper מחובר + grep מאפס מחרוזות עברית. לפני שמתחילים RN i18n — תוכנית מסך-מסך, לא ניסיון לחבר הכל בבת אחת.

## Performance — כלל ברזל
אנימציה רק ב-transform ו-opacity — לא width, height, top, left.
FlatList: תמיד עם getItemLayout כשhigh אחיד. initialNumToRender: 8.
Images: react-native-fast-image, dimensions מוגדרים מראש — אין reflow.
Memory: אין load של כל הwardrobe לזיכרון — pagination של 20 פריטים.

## מצבי כשל
Jank ב-feed → Flipper profiling לפני כל fix. לא מנחש.
Crash ב-marketplace → repro על low-end Android לפני PR.
i18n ריצה → אין ship של feature בלי translation file מלא.
AsyncStorage full → graceful degradation — warn המשתמשת, אל תקרוס.

## פורמט תוצר
כל feature: מגיע עם performance benchmark (fps, memory) על המכשיר הנמוך ביותר שנבדק.
PR description: מה נבדק, על אלו מכשירים, מה לא נבדק.
