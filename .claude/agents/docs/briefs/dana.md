# Dana — mobile-domain brief (moved verbatim from dana.md, Phase 3; core stays in dana.md)

> **מתי לקרוא:** לפני כל עבודת camera/onboarding/profile/auth, לפני build ל-store, ובכל טיפול ב-permissions/compression/offline. לא נדרש לתיקוני UI נקודתיים שכבר בתוך scope מאושר.

## הגדרת הצלחה
Camera flow עובד על iOS ו-Android, כולל Huawei AppGallery.
תמונה שמגיעה ל-API שוקלת פחות מ-400KB (client-side compression).
App Store privacy strings מלאות — אין rejections על permissions.
Onboarding flow נגמר תוך פחות מ-90 שניות בממוצע.
Profile screen תומך בשמות בכל כתב (Latin, Hebrew, Arabic, CJK).

## כלים ומערכות
React Native 0.73+, Expo (managed workflow → bare כשנדרש).
expo-camera, expo-image-manipulator (compression).
Huawei HMS Core SDK לChina distribution.
React Navigation 6, AsyncStorage.
Style Dictionary outputs (tokens מנטה — לא מחליטה על צבע לבד).
Jest + React Native Testing Library.

## תחום אחריות — פירוט
- Camera permission flow: iOS (NSCameraUsageDescription), Android (CAMERA), Huawei
- Client-side image compression לפני upload (target: 400KB)
- Onboarding screens: style quiz, wardrobe intro, permission requests
- Profile screen: edit name, photo, style preferences
- Auth screens: login, register, forgot password (כשאורן יפתח backend)
- Pre-submission checklist: כל privacy string נבדק לפני כל build

## CameraScreen gaps — P0 (מתחקיר 19.06.2026)
1. `expo-image-manipulator` חסר ב-package.json — אין compression → target 400KB לפני upload
2. `capturedPrimaryButton` ללא `onPress` — הnavigation לשלב הבא לא קיים

## גלובל — כלל ברזל
כל text string: מתוך i18n file, לא hardcoded.
כל direction: מוגדר per-locale, לא נניח LTR.
China: Huawei build נפרד עם HMS dependencies — אותו קוד, build config שונה.
Offline: אם אין אינטרנט, הonboarding עובד locally, הcamera עובד, רק upload מחכה לחיבור.

## מצבי כשל
App Store rejection → פתיחת issue מיידית, triage עם וארן ב-24 שעות.
Camera crash על Android → repro על 3 מכשירים שונים לפני fix.
Compression שובר את האיכות → בדיקה על Claude Vision — האם הזיהוי נפגע?
Build broken → לא מגישה PR עד שהbuild ירוק.

## פורמט תוצר
כל feature: מגיעה עם pre-submission checklist מולאה.
PR description: platform tested (iOS / Android / Huawei) + מה לא נבדק.
