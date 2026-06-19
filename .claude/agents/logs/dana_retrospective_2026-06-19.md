# תחקיר עצמי — דנה
## 2026-06-19

---

## 1. מה עשיתי — כנה

הסשן הנוכחי (19.06) לא כלל dispatch ישיר אליי. לא קיבלתי משימה חדשה. לא כתבתי שורת קוד חדשה היום.

מה שכן קיים בסוף היום הזה — תחקיר זה, שנכתב בכנות על בסיס בדיקה של מה שבפועל קיים בריפו.

---

## 2. הממצאים של הסשן — camera flow, onboarding — רלוונטיים למה שנמצא ב-web?

הסשן הנוכחי עסק בעיקר ב-web app (index.html). הממצאים שאיילון העלה על first-scan experience ו-outfit AI נוגעים ל-web — אבל חלקם ישירות רלוונטיים למה שאני אמורה לבנות במובייל.

**מה שנמצא ב-web ורלוונטי לי:**

ממצא ה-design quality מהפגישה (18.06): מסך ה-onboarding הראשון ריק — לוגו + טקסט קצר + כפתור, ואין כלום בין השניים. ה-board החליט על כיוון עריכתי (Instagram/Pinterest density + Chanel/LV/Fendi restraint). זה עקרון שחל גם על מסך onboarding ב-mobile, לא רק ב-web. כשאני אבנה את ה-style quiz ואת wardrobe intro ב-RN — הם לא יכולים להיות ריקים באותו אופן.

ממצא currency: USD כ-canonical storage, static FX table לv1. לא משנה ישירות את ה-screens שלי (camera/onboarding/profile/auth), אבל profile screen עתידי שיציג מחירים יצטרך לכבד את ה-locale layer הזה.

ממצא i18n wiring: 614 מחרוזות hardcoded ב-web — כל הקבצים קיימים אבל לא מחוברים. זו בדיוק הסכנה שאני נמנעת ממנה ב-mobile: הקמתי i18n/en.json ו-i18n/he.json ו-i18n/index.js מהיום הראשון, ו-CameraScreen וגם CameraPermissionScreen קוראים לkl() ולא לוקחים שום string hardcoded. כלל ברזל שלי — "לא מניחה שהמשתמשת קוראת עברית, כל text מגיע מi18n file" — נשמר בקוד הקיים. זה ההבדל המהותי בין ה-mobile ל-web כרגע.

**מה שלא יודעת:** אין לי מידע על מה שאיילון ספציפית הציג כ"first-scan experience findings". אם יש document מסוים עם ממצאים שרלוונטיים ל-camera UX ב-mobile — לא קיבלתי אותו. זה משהו שצריך לעלות בsync הבא.

---

## 3. כלל הברזל — מה המצב האמיתי? יש commits מאז 17.06?

**עובדה ישירה:** commit 89efe15 ("Merge Dana's CameraScreen + capture pipeline") נכנס ב-18.06. commit 9fd1f00 ("Add CameraScreen: live preview, flash toggle, capture pipeline") הוא ה-commit המקורי לפניו.

**בעיה:** שניהם נחתמו ב-18.06, לא ב-19.06. מאז אין commit חדש.

**מה זה אומר לפי כלל הברזל:** 48 שעות טרם עברו מאז 18.06 ל-19.06, אז הכלל עצמו לא מופר כרגע — אבל אם עד מחר (20.06) לא יהיה commit, הכלל נכנס לתוקף ואני חייבת לדווח חסם לוראן בקול, לא לשתוק.

**מה שפחות נוח להגיד:** הcommits של ה-18.06 — לפי company_reflection_2026-06-17 — נכתבו בפועל על-ידי ג'ף, לא נוצרו על-ידי session עצמאי שלי. זו המציאות של המבנה הנוכחי, ואני כותבת אותה כאן במפורש כי זה בדיוק מה שג'ף ביקש שהצוות יפסיק להסתיר.

---

## 4. תחום האחריות שלי — מה production-ready?

| Screen / Flow | קיים בקוד | Production-ready? | מה חסר |
|---|---|---|---|
| **CameraPermissionScreen** | כן — mobile/screens/CameraPermissionScreen.js | קרוב, לא שם | לא נבדק על מכשיר פיזי. granted/denied/canAskAgain — כל branches קיימים. iOS NSCameraUsageDescription לא אומת שנכנס ל-app.config.js. |
| **CameraScreen** | כן — mobile/screens/CameraScreen.js | לא | compression לא קיים. תמונה שיוצאת מ-takePictureAsync() לא עוברת expo-image-manipulator. target 400KB לא נבדק. capturedPrimaryButton אין לו onPress — ה-navigate לCapturedPreview לא קיים כי הscreen לא נבנה. |
| **Onboarding screens** | לא | לא | style quiz, wardrobe intro, permission flow שלם — אפס קוד. |
| **Profile screen** | לא | לא | edit name, photo, style preferences — אפס קוד. |
| **Auth screens** | לא | לא | login, register, forgot password — מחכים לorן שיפתח backend. |
| **Huawei AppGallery support** | לא | לא | HMS build config לא קיים. |
| **Client-side compression** | לא | לא | expo-image-manipulator אפילו לא ב-package.json. |

**סיכום כנה:** שני screens קיימים. CameraPermissionScreen קרוב לusable. CameraScreen עובד כlive preview עם flash toggle וcapture — אבל ה-pipeline מסתיים בview מקומי בלי compression ובלי navigate חי לstep הבא. זה proof-of-concept שעובד, לא production feature.

---

## 5. איך אני חוזרת לריצה — משימה זעירה ראשונה

לא "onboarding מלא". לא "compression pipeline". יחידה אחת, נראית-לעין, תוך יום.

**המשימה הזעירה:** הוסף expo-image-manipulator ל-package.json וכתוב פונקציית compressForUpload(uri) שמחזירה URI של תמונה מתחת ל-400KB. לא אפליקציה שלמה — פונקציה אחת עם test אחד שמאמת שגודל הקובץ אחרי compression קטן מ-400KB.

**למה זה:** זה ה-gap הכי קריטי שיש לקוד הקיים. CameraScreen כבר מצלם — הbottleneck הבא הוא compression לפני upload. פונקציה אחת זה commit אחד, תוצר נראה-לעין, ויום עבודה.

**אחרי זה:** חיבור compressForUpload לcapturedPrimaryButton ב-CameraScreen. ואז — שim_capture_preview_screen מינימלי שמקבל uri ומציג את התמונה הדחוסה עם כפתור "use photo" אמיתי.

---

## 6. איך אני מייעלת — coordination עם רועי וואران

**עם רועי:**
- navigation architecture: CameraScreen היום משתמשת ב-navigation shim עצמי (לא React Navigation). כשרועי יתקדם על Feed/Wardrobe הוא יצטרך React Navigation stack אמיתי. השיחה הזו צריכה לקרות לפני שאיחד שני flows — אני לא אוגרטייד בלי לדבר איתו קודם (כפי שמוגדר בscope שלי).
- i18n: הkeys שאני מוסיפה ל-en.json ו-he.json צריכות להיות consistent עם מה שרועי בונה. כרגע אין overlap כי אין לו RN screens עדיין — אבל כשיתחיל, צריך alignment.

**עם ואראן:**
- אני צריכה status check מול ואראן על: האם יש סביבת dev שרצה על סימולטור? האם הpackages של mobile/ הותקנו? "נמצא בריפו" אין פירושו "עבד על מכשיר". אם לא — זה חסם תקף שמדווחת עליו, לא שותקת.
- app.config.js: NSCameraUsageDescription צריך לאמת שנכנס נכון. זה לא אני שבודקת בsimulator — זה ואראן שעושה run על iOS device אמיתי.

**כלל ברזל — escalation timeline:** אם עד 20.06 23:59 אין commit חדש מscope שלי — אני פותחת report לוראן: "חסם: [פירוט]". לא מחכה שיגלה.
