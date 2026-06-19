# agents/learnings.md — בסיס למידה משותף

> **חוק השימוש:** בתחילת כל task — קרא את הסעיפים של התפקיד שלך ושל המנהל שלך.
> בסוף כל תקרית — הוסף לקח לסעיף המתאים. תאריך + מקור חובה.
> אל תמחק לקח ישן — עדכן אותו אם השתנה.

---

## ○ ORG-WIDE — כל סוכן קורא את זה, ללא יוצא מן הכלל

### OW-001 | rename = 3 שכבות, לא 1
**מקור:** price_estimate_ils → usd incident (2026-06-18), חזר כממצא audit (2026-06-19)
**לקח:** כל שינוי שם שדה/endpoint חייב לכסות: backend (app.py) + frontend (index.html) + mobile (mobile/). fix שמכסה שכבה אחת ייראה סגור ויחזור.
**מנגנון:** לפני merge — grep על השם הישן ב-3 המקומות. תוצאות ה-grep ב-PR description.

### OW-002 | "הושלם" ≠ "נבדק"
**מקור:** shira_retrospective + dana_retrospective (2026-06-19)
**לקח:** קוד שקיים ≠ feature שעובד. "moderation exists in code" — לא נבדק חיה עם curl. "CameraScreen exists" — capturedPrimaryButton ללא onPress. הכרזה על "הושלם" ללא ריצה בפועל = הצהרה שקרית.
**מנגנון:** definition-of-done מפורש בכל dispatch. לפחות: curl / Metro bundle / Playwright — לפי סוג הfeature.

### OW-003 | תיאום לפני עבודה על קבצים משותפים
**מקור:** oren_retrospective — conflict עם דולצ'ה ב-Compare picker (2026-06-19)
**לקח:** conflict בין אורן ודולצ'ה על אותה שורה ב-index.html — נמנע בקריאה אחת של activity_log.md לפני dispatch.
**מנגנון:** לפני כל עבודה על `static/index.html` / `app.py` / `mobile/App.js` — קרא `agents/activity_log.md`. אם יש overlap — תאם טווח שורות לפני שמתחיל.

### OW-004 | פער בין "יודע שהכלי קיים" לבין "מפעיל אותו"
**מקור:** varan_retrospective + sam_retrospective (2026-06-19)
**לקח:** backend-rename-safety קיים בגלל ₪/$. לא הופעל. stall-escalation מוגדר. לא הופעל. learnings.md לא היה קיים אף שנזכר בinstructions. הפער הוא לא "לא ידעתי" — הפער הוא בין רשימה לפעולה.
**מנגנון:** כל סוכן: בתחילת task — קרא סעיף הסקילים שלך ושאל "האם מישהו מהם רלוונטי כעת?"

### OW-005 | תשתית שקיימת ≠ תשתית שבשימוש
**מקור:** netta_retrospective (2026-06-19) — 402 שורות font-size hardcoded; token system כמעט לא בשימוש
**לקח:** tokens.css קיים. awear-tokens.json קיים. 402 שורות font-size hardcoded בindex.html, 226 hex values. "יש לנו design system" ≠ "אנחנו משתמשים בו". כל תשתית — דורשת grep לפני דיווח "coverage".
**מנגנון:** כל cycle — `grep -c "var(--t-" static/index.html`. תעד את המספר. המספר צריך לעלות.

### OW-006 | כלל ללא מנגנון אכיפה = המלצה
**מקור:** mark_retrospective (2026-06-19) — Iron Rule נכתב ב-18.06, עוקף ב-18.06
**לקח:** כלל שנכתב ב-CLAUDE.md ולא משנה workflow בפועל הוא הצהרה. כל כלל חייב: (1) מי אוכף, (2) מתי נבדק, (3) מה קורה כשמופר.
**מנגנון:** לפני Board Sync — כל מנהל בודק: "כל כלל ברזל שכתבתי — יושם בcycle שעבר?"

---

## ○ MANAGEMENT — ג'ף, סטיב, איילון, מארק, וראן

### MG-001 | מנהל שמגיע ריק = bottleneck מוסווה
**מקור:** mark_retrospective + varan_retrospective (2026-06-19)
**לקח:** מנהל שממתין לשאלה "מה אתה צריך?" לא נוכח — הוא reactive. Board Sync = מנהל מגיע עם backlog מתועדף, לא עם שתיקה.
**מנגנון:** לכל מנהל: תחילת כל cycle — כתוב backlog של 3 עדיפויות. הצג בBoard Sync גם אם לא נשאלת.

### MG-002 | עקיפת מנהל יוצרת עמימות, לא מהירות
**מקור:** jeff_retrospective + mark_retrospective + varan_retrospective (2026-06-19)
**לקח:** ג'ף שמשגר ישירות לIC (דולצ'ה, דנה, רועי) ללא עצירה במארק/וראן — מפנה את שכבת הניהול. ה-IC מקבל direction לא מתואם. מהירות ה-dispatch אינה שוות ערך לאיכות התוצר.
**מנגנון (ג'ף):** dispatch לIC בתחום מנהל → תיעד מה גרם לזה + עדכן המנהל בסוף. עקיפה חוזרת = כשל מבני.
**מנגנון (מנהל):** dispatch לIC ללא כיוון ממנהל → מנהל מתערב מיידית, לא שותק.

### MG-003 | observation בלי proposal = תרומה חלקית
**מקור:** ayalon_retrospective (2026-06-19)
**לקח:** Product Director שמעלה ממצא ("זה שבור") בלי הצעת פתרון לא השלים את התרומה. הממצא לבד לא מניע תזוזה.
**מנגנון (איילון):** כל ממצא בפגישת מנהלים מגיע עם: בעיה + הצעה + מי אמור לבצע.

### MG-004 | scope report פותח cycle, לא סוגר
**מקור:** ayalon_retrospective (2026-06-19)
**לקח:** דיווח scope בסוף cycle הוא postmortem. בתחילת cycle הוא כלי תכנון. ההחלפה ביניהם גרמה לכך שלא ידענו מה תקוע עד שכבר הפסדנו זמן.
**מנגנון (איילון):** הדבר הראשון בכל Board Sync = טבלת scope: מה זז / לא זז / חסם. לא summary — action.

### MG-005 | CTO שקורא קוד שורה-שורה = כשל רשת, לא הצלחה
**מקור:** steve_retrospective (2026-06-19)
**לקח:** audit ידני של CTO מחשיף בעיות נכון — אבל כך בדיוק מוכח שה-checklist/review/test מתחתיו לא עבד. הממצא חשוב; הצורך לעשות אותו בעצמו הוא הבעיה.
**מנגנון (סטיב):** בסוף כל audit ידני — "מה בתהליך לא תפס את זה?" לתקן תהליך, לא רק באג.

### MG-006 | State A vs State B — delegation לא יכול להיות עמום
**מקור:** jeff_retrospective (2026-06-19)
**לקח:** בסשן שכרמל + ג'ף פועלים ביחד, כל dispatch יכול להיות "ג'ף מחליט ומאציל" (State A) או "ג'ף מבצע בשם תפקיד" (State B). עמימות ביניהם יוצרת מראית-delegation שהיא בפועל centralization.
**מנגנון (ג'ף):** שאלת פתיחה קנונית: "מה ג'ף צריך להחליט היום? מה כבר מואצל?" תיעד State A/B בכל dispatch.

---

## ○ BACKEND + INTEGRATION — סאם, אורן

### BE-001 | rename → grep 3 שכבות → commit. בסדר הזה תמיד.
**מקור:** SAM-L001 (2026-06-18), OW-001 (2026-06-19)
**לקח:** `price_estimate_ils → usd` שבר 54 מקומות בfrontend. ה-fix כיסה רק app.py. חזר.
**מנגנון:** backend-rename-safety skill → grep על index.html → grep על mobile/ → commit. אין קיצורים.

### BE-002 | look_total_usd — חוב ידוע לcycle הבא
**מקור:** oren_retrospective (2026-06-19)
**לקח:** 4 מקומות ב-index.html שמציגים `look_total_usd` עם ₪ — לא כוסו בcycle 19.06. זה חוב ידוע, לא surprise.
**מנגנון (אורן + סאם):** cycle הבא — grep על look_total_usd, אישור סאם על schema, תיקון.
**עודכן 2026-06-19 — Cycle 1:** grep מצא 3 מקומות (לא 4). תוקנו 2: שורות 2118 (look grid), 2150 (shop-look button). נותר פתוח: שורה 2305 — `post.price (ILS) || look_total_usd (USD)` — fallback מעורב. שינוי סימן ₪→$ ישבור תצוגת ILS. דורש: (1) סאם מחליט אם `look_total_usd` יוסר מה-fallback chain, (2) או שמוסיפים הגיון ליבה שבוחר סימן לפי מקור הערך. commit: 7244a7b, worktree: fix/look-total-usd.

### BE-004 | in-memory store → SQLite: DB_PATH.parent.mkdir + init_db() בstartup
**מקור:** sam, Cycle 2 (2026-06-19) — _likes_store migration
**לקח:** כל in-memory dict שמכיל state שמשנה משתמשים = חוב שנשמד ב-restart. pattern migration: (1) init_db() → CREATE TABLE IF NOT EXISTS; (2) _get_db() עם row_factory + parameterized queries; (3) init_db() נקרא בstartup event לפני שאר האתחול; (4) data/ directory נוצר עם mkdir(parents=True, exist_ok=True). commit קיים — לא "כבר עשינו בעבר" אלא "תבנית פעילה".
**מנגנון:** לפני כל in-memory store חדש — שאל "האם נתון זה צריך לשרוד restart?" אם כן → SQLite מהיום הראשון.

### BE-003 | schema owner = סאם. integration = אורן. לא מתחלפים.
**מקור:** oren_retrospective (2026-06-19)
**לקח:** אורן מצא בעיות schema (look_total_usd), סאם ביצע. הסדר נכון. אך: אורן לא מחליט על schema, סאם לא מחליט על integration. הגבול ברור — ולא משתנה תחת לחץ.

---

## ○ DESIGN SYSTEM — נטה, דולצ'ה, גבאנה

### DS-001 | token קיים ≠ token בשימוש
**מקור:** netta_retrospective (2026-06-19)
**לקח:** 402 שורות hardcoded font-size. 226 hardcoded hex values. token system קיים — לא בשימוש. "יש לנו tokens" ≠ "הקוד משתמש בהם". גרסה הבאה של "אנחנו token-based" חייבת לכלול grep מספרי.
**מנגנון (נטה):** cycle-opening grep: `grep -c "var(--t-" static/index.html`. תעד. P0 migration: #2a2040, #1a1030 (13 הופעות).
**עודכן 2026-06-19 — cycle 1:** --text/--bg2 נוספו כ-aliases לindex.html הקיים (35 הופעות כל אחד — backward compat, לא שבירה). --t-* scale הורחבה: נוספו --t-title (20px), --t-lead (17px), --t-small (13px). migration מ-hardcoded font-size מתוכנן ל-Cycle 2.

### DS-002 | P0-filers עוברים self-check לפני גבאנה
**מקור:** gabbana_retrospective (2026-06-19)
**לקח:** הביקורת היקרה ביותר היא כשגבאנה מגלה P0 שדולצ'ה הייתה אמורה לתפוס. זה מבזבז cycle time ומסמן כשל של שתיהן.
**מנגנון (דולצ'ה):** לפני כל review request לגבאנה — self-check: emoji? hardcoded hex? placeholder text? תיקון ≤5 דקות > review חדש.
**מנגנון (גבאנה):** אם מגיע P0-filer ידוע — לא עושה full audit, מחזיר מיד עם תיאור המה-שחסר.

### DS-003 | audit ללא input = audit חלקי
**מקור:** gabbana_retrospective (2026-06-19)
**לקח:** ביקורת על "גרסה כללית" היא ביקורת שלא ניתן לשחזר ולא ניתן להשוות. לכל audit: commit hash + שם מסך + breakpoint.
**מנגנון (גבאנה):** בלי 3 האלמנטים — מחזירה בקשה לדולצ'ה לפני שמתחילה.

### DS-004 | CSS fallback חובה לכל var()
**מקור:** shira_retrospective (2026-06-19)
**לקח:** --fg ו--surface מוגדרים ב-tokens.css — אבל אם tokens.css לא נטען, טקסט שחור על רקע שחור. "מוגדר בקובץ חיצוני" ≠ בטוח.
**מנגנון:** כל token שמשתמשים בו בdynamic context — fallback ב-:root פנימי.

### DS-005 | token קיים ≠ token נכון — ערכים גם זקוקים ל-review
**מקור:** netta / color-system v2 (2026-06-19)
**לקח:** tokens.css וawear-tokens.json היו קיימים עם ערכים — אבל הערכים עצמם היו שגויים: two near-identical elevation layers (bg/surface delta של 4), saturated cold accents על dark background קר = nightclub app לא fashion app, hallucinated colors (#2a2040, #1a1030) שנכנסו לקוד כי הצבעים הקיימים לא ספקו את הצורך הוויזואלי. token system עם ערכים לא-נבדוקים מזמין deviation.
**מנגנון:** כל עדכון token → WCAG contrast check + screenshot comparison לפני merge. לא "ערך שונה" — "ערך נבדק".

### DS-006 | emoji עוקפות icon system קיים — הבעיה היא bypass, לא היעדר system
**מקור:** mark_ux_research (2026-06-19) — מחקר icon system
**לקח:** AWEAR יש icon system מלא (`icon(name, size)` + ICONS object, 40+ icons). הבעיה היא emoji שנכתבו ישירות בHTML: sf-tabs, hq-btn, an-sec-title, rewards array, CAT_EMOJI. OW-005 חוזר בדיוק — system קיים ולא בשימוש.
**מנגנון (דולצ'ה):** לפני כל כתיבת UI string — "האם זה emoji?" → `icon()`. גבאנה בודקת: grep על sf-tab, hq-btn, an-sec-title, cmp-slot = 0 emoji.

### DS-007 | icon library CDN — לא נדרש כשיש inline SVG system
**מקור:** mark_ux_research (2026-06-19) — icon system research
**לקח:** Lucide CDN הנכון לfashion apps, אבל AWEAR יש custom ICONS object שעובד. להוסיף CDN בשביל icons שכבר קיימים = overhead מיותר. icon חדש שחסר → SVG path מ-lucide.dev ל-ICONS object.
**מנגנון:** icon חדש → הוסף SVG path ל-ICONS object. CDN = רק אם ICONS object מגיע ל-50+ icons ומנוהל ידנית.

### DS-009 | font-size legacy CSS = placeholder ghost בלי placeholder נראה
**מקור:** dolce — P0-A fix cycle 2 (2026-06-19), מארק audit
**לקח:** `font-size:52px` ב-`.sf-card-img` ו-`.mp-item-img` נשאר מתקופת emoji-placeholder. CSS container עם font-size גדולה = potential ghost גלוי כאשר JS לא נטען / תמונה נכשלת ו-fallback לא מחזיר SVG. הbinding הנכון קיים — אבל CSS stale גורם ל-P0 בדיקה.
**מנגנון:** כל CSS class של image container — בדוק אם יש `font-size` שלא שייכת ל-icon פעיל. אם `productImage()` binding קיים → `font-size` על הcontainer מיותרת ומסוכנת.

### DS-008 | static HTML vs JS template — icon() רק ב-template literals
**מקור:** dolce — P0 fix cycle 1 (2026-06-19)
**לקח:** `icon()` function מחזירה string — עובדת רק בJS template literals בתוך JS functions. ב-static HTML sections (שורות מחוץ ל-JS) — `${icon(...)}` ייכתב כטקסט ולא יפורש. headers שנמצאים ב-static HTML חייבים: (א) inline SVG ישיר, או (ב) JS init function שמחליפה textContent ב-innerHTML עם icon().
**מנגנון:** לפני כל emoji → icon() — בדוק אם הקוד ב-JS template literal (function). Static HTML → inline SVG. JS template → icon().

---

## ○ SOCIAL FEATURES — שירה

### SF-001 | severity thresholds = product decision, לא engineering
**מקור:** shira_retrospective (2026-06-19)
**לקח:** moderation קיים בקוד (commit de309a6). severity thresholds לא אושרו על ידי איילון. זה לא "פרט טכני" — זה החלטה על מה מותר ומה אסור בפלטפורמה.
**מנגנון (שירה):** moderation לא יוצא לפרודקשן ללא sign-off של איילון על thresholds.

### SF-002 | "קוד moderation קיים" ≠ "moderation עובד"
**מקור:** shira_retrospective (2026-06-19)
**לקח:** `/api/moderate` קיים. `moderateCommentAsync()` קיים. לא נבדקו חיה עם curl. זה OW-002 ברמת הsocial domain.
**מנגנון (שירה):** לפני כל "הושלם" על feature של API — curl test + תיעוד response.

### SF-003 | ANTHROPIC_API_KEY חסר = moderation fail-open — P0
**מקור:** שירה (גילוי) + סאם (אימות), Cycle 1 Phase 4, 2026-06-19
**לקח:** /api/moderate מחזיר `{"fallback":true}` על כל input כשהמפתח חסר — כל תוכן, כולל harmful, עובר ללא בדיקה. זה לא "כשל שקט" — זה "אין moderation בכלל". גילוי מאוחר כי לא הייתה בדיקת env בהפעלה.
**מנגנון:** (1) app.py — בדיקת `ANTHROPIC_API_KEY` ב-startup + log WARNING מפורש אם חסר; (2) pre-deploy checklist: env vars required; (3) Steve/Jeff — set secret בprod env לפני כל deploy.
**status 2026-06-19:** agents/logs/api_key_alert.md נוצר. action item פתוח ל-Steve/Jeff.

---

## ○ MOBILE — וראן, דנה, רועי

### MB-001 | stall-escalation = וראן מפעיל, לא IC
**מקור:** varan_retrospective (2026-06-19)
**לקח:** וראן ידע על כלל הstall. לא הפעיל אותו. ה-IC (דנה/רועי) לא אמורים לדווח על עצמם שהם תקועים — זה role של מנהל המובייל.
**מנגנון (וראן):** 48 שעות בלי commit מIC — וראן מפעיל stall-escalation. לא שואל. לא מחכה.

### MB-002 | navigation stack + state management — לפני IC, לא אחרי
**מקור:** varan_retrospective (2026-06-19)
**לקח:** דנה ורועי עבדו ב-parallel בלי שהוחלט: navigation stack, state management, AsyncStorage schema. קונפליקטים אפשריים ב-merge שלא נמנעו מראש.
**מנגנון (וראן):** לפני כל dispatch ל-IC — agents/plans/ מכיל החלטת navigation + state. ללא שניהם — dispatch לא יוצא.

### MB-003 | "האפליקציה באנגלית" ≠ i18n הושלם
**מקור:** roei_retrospective (2026-06-19)
**לקח:** LOCALE='en' שונה. אבל: אין t() helper שקורא אותו בweb. 614 מחרוזות עברית hardcoded בindex.html. "האפליקציה באנגלית" היא הצהרה שקרית עד ש: t() helper מחובר + grep מחזיר 0 Hebrew strings hardcoded.
**מנגנון (רועי):** לא להכריז i18n web כ"done" ללא שני הקריטריונים. בcycle הבא: FeedScreen.js (3 cards, getItemLayout, 24h).

### MB-004 | CameraScreen — gaps קריטיים לcycle הבא
**מקור:** dana_retrospective (2026-06-19)
**לקח:** CameraScreen קיים. שני gaps קריטיים: (1) expo-image-manipulator חסר ב-package.json → אין compression, (2) capturedPrimaryButton ללא onPress → navigate לא קיים.
**מנגנון (דנה):** cycle הבא — compressForUpload(uri) + onPress → target 400KB, commit אחד.

---

## ○ PRODUCT — איילון

### PR-001 | scope report = action list, לא status update
**מקור:** ayalon_retrospective (2026-06-19)
**לקח:** טבלת scope בBoard Sync היא לא "הנה המצב". היא "הנה מה שצריך לזוז ולמה הוא לא זז". כל שורה עם חסם — מסתיימת בaction item, לא בממצא.
**מנגנון:** פורמט קבוע לכל Board Sync: `סוכן | scope | status | חסם | action`.

---

## ○ CEO / STRATEGY — ג'ף

### CE-001 | שאלת פתיחה קנונית לכל cycle
**מקור:** jeff_retrospective (2026-06-19)
**לקח:** "מה ג'ף צריך להחליט היום? מה כבר מואצל?" — שאלה זו מנקה עמימות, מונעת centralization, ומאפשרת delegation אמיתי. בלי השאלה — הכל מגיע לג'ף, וזה צוואר בקבוק מוסווה כניהול.
**מנגנון:** השאלה הזו היא הדבר הראשון בכל cycle, לפני כל dispatch.

### CE-002 | בעיה מבנית = שלוש שכבות בו-זמנית, לא תיקון סדרתי
**מקור:** management_meeting_design_crisis (2026-06-19)
**לקח:** ישיבת design crisis חשפה שהבעיה אינה שכבה אחת — היא משוואה: data עם emoji כ-default + CSS ללא enforcement + "done" שמוגדר כ-"עובד" ולא כ-"נראה כמו Instagram" = מוצר שנראה כמו wireframe. תיקון שכבה אחת בלבד מחזיר לאותו מקום. בעיות מבניות דורשות פתרון מקביל לכל השכבות.
**מנגנון:** בישיבת root cause — שאל "כמה שכבות יש לבעיה?" לפני שמחליטים מה לתקן. אם יותר משכבה אחת — הגדר action item לכל שכבה בנפרד, ועם owner נפרד.

---

## ○ RESEARCH — מחקרים שנעשו. לפני שעושים מחקר חדש — בדוק כאן קודם.

> **כלל:** אם הנושא כבר נחקר — קרא את ה-doc. אל תשחזר מחקר שכבר קיים.

### R-001 | UX של רשתות חברתיות — Instagram, TikTok, Pinterest, Depop, Vinted
**תאריך:** 19.06.2026 | **מבצע:** מארק | **קובץ:** `docs/UX_RESEARCH.md`
**תמצית:**
- ניווט נוכחי (Home/חיפוש/FAB/פיד/ארון) תואם את הפרדיגמה — אין צורך לשנות סדר
- פיד לוקים: masonry 2-col (4:5 ratio) — לא grid ריבועי
- Marketplace card חסר: condition badge, size, seller handle, heart button
- 5 מיקרו-אינטראקציות P0: double-tap like, skeleton loading, swipe-to-dismiss sheets, shared element transition, filter chips horizontal scroll
- Pinterest/TikTok onboarding: ≤5 screens, value demonstration לפני sign-up
**מקורות שנצרכו (אל תחזור עליהם — חפש מקורות שונים אם דרוש מחקר נוסף):**
inro.social/blog/instagram-layout, raw.studio/tiktok-ux, beamoore.ca/depop-redesign, goodux.appcues.com/pinterest, goodux.appcues.com/tiktok, designstudiouiux.com/mobile-navigation, primotech.com/micro-interactions, smashingmagazine.com/tap-target-sizes

### R-002 | פסיכולוגיה של צבע לאפליקציות אופנה
**תאריך:** 19.06.2026 | **מבצע:** נטה | **קובץ:** `docs/COLOR_SYSTEM.md`
**תמצית:**
- Dark mode = תשתית ויזואלית: תמונות בולטות, תחושת premium. Dark-gray חם (#1a1625) עדיף על שחור טהור
- Accessible premium = חמימות מדיטרנית, לא Nordic קר — rose/terracotta לקהל ישראלי 18-35
- Dual accent: action חם (rose #e8526a = like/buy/follow) + ארגון (terracotta #c4714a = tag/category/price)
- CTA: saturation 60-70% = premium invitation. >80% = flash sale perception
- הפלטה החדשה כבר ב-`static/tokens.css`
**מקורות שנצרכו:**
uxcel.com/blog/color-palettes-social-networks, wisernotify.com/blog/cta-colors, fireart.studio/dark-mode-ui, buyitinisrael.com/design-trends-2025, mobbin.com/depop-colors, heatmap.com/color-psychology-cta, gendesigns.ai/dark-mode-guide
**עודכן 19.06.2026 — cycle 1:** shadow-accent עודכן ל-rose rgba בcycle 1 (מ-`rgba(123,92,255,.32)` → `rgba(232,82,106,.32)`). shadow-glow מסונכרן בו-זמנית. נוסף --success-surface. עדכון מקביל ב-tokens.css וב-awear-tokens.json.

### R-003 | מערכת Icons לAWEAR
**תאריך:** 19.06.2026 | **מבצע:** מארק | **קובץ:** `docs/ICON_SYSTEM.md`
**תמצית:**
- AWEAR כבר יש `ICONS` object + `icon()` function — לא צריך library חיצונית
- טבלת החלפות מלאה: כל emoji ב-UI chrome → `icon()` call ספציפי
- `CAT_EMOJI` object (שורה ~1598) — לבטל. `catIcon()` מחליף. 3 קריאות נשארו (שורות ~3268, ~3963, ~3218)
- Stroke weight: 1.5px עקבי. Hit targets: ≥44px
**מקורות שנצרכו:**
pkgpulse.com/lucide-vs-heroicons, allsvgicons.com/best-svg-icon-libraries-2026, lucide.dev/guide, css-tricks.com/icon-fonts-vs-svg

### R-004 | כללי עיצוב AWEAR — 7 כללים קונקרטיים
**תאריך:** 19.06.2026 | **מבצע:** ג'ף + ישיבת מנהלים | **קובץ:** `docs/DESIGN_STANDARDS.md`
**תמצית:**
- אפס emoji ב-UI chrome (grep לאימות)
- כל product card = `productImage()` — לא gradient/character
- background = token בלבד — `#2a2040`/`#1a1030` = פסילה
- typography: 5 גדלים + `var(--t-*)` חובה
- רשת 8pt — כל ערך מחוצה לרשימה דורש הסבר
- כל אינטראקציה = `:active` feedback
- שאלת העל: "יעלה ב-Instagram story?" — שורה חובה בכל PR של גבאנה
**מקורות:** ממחקרי R-001 + R-002 + ישיבת מנהלים פנימית

### R-005 | מאגר מוצרי אופנה + פרופילים
**תאריך:** 19.06.2026 | **מבצע:** general agents
**קבצים:** `static/data/products.json`, `static/data/profiles.json`, `static/data/posts.json`
**תמצית:**
- 65 מוצרים ב-6 קטגוריות (נעליים/מכנסיים/חולצות/ג'קטים/אקססוריז/שמלות) — URLs מאומתים
- 20 פרופילים פיקטיביים (10 ישראליים, 10 בינלאומיים) — תמונות מ-randomuser.me
- 40 פוסטים לפיד — 2 לכל פרופיל — תמונות Unsplash fashion/outfit
- ראה `static/data/README.md` לתיעוד המבנה
**מקורות שנצרכו:** randomuser.me API, images.unsplash.com (photo IDs ב-products.json), images.pexels.com

---

## ○ כיצד להוסיף לקח חדש

1. בחר סעיף מתאים (OW / MG / BE / DS / SF / MB / PR / CE)
2. הוסף ID חדש (הממשיך מה-ID האחרון בסעיף)
3. פורמט חובה:
   ```
   ### [ID] | [כותרת קצרה]
   **מקור:** [מי, מתי]
   **לקח:** [מה קרה ומדוע זה חשוב]
   **מנגנון:** [הפעולה הקונקרטית שמונעת חזרה]
   ```
4. אל תמחק לקח ישן — עדכן אם השתנה, וציין "עודכן: [תאריך]"

---

*עודכן לאחרונה: 19.06.2026 — לאחר תחקיר עצמי של כל 13 הסוכנים*

## CE-002 — Design CEO lesson: tokens ≠ visual progress (19.06.2026)

**מה קרה:** הדירקטוריון (כרמל) נתן פידבק: "לא שיניתם כמעט כלום בנראות". עשינו token system (DS), עשינו hex audit, עשינו color research — אבל המסכים עצמם נראו אותו דבר.

**הלקח:** token system הוא infrastructure. משתמש לא רואה CSS variables — הוא רואה layout, spacing, typography, depth. אפשר לעשות token migration מושלם בלי שהמשתמש ירגיש שום דבר.

**כלל להבא:** בכל cycle שיש בו design work — הגדר success metric ויזואלי: "screenshot שהיית שולח לאינסטגרם" ולא "grep -c hex = 0". גבאנה + ג'ף מאשרים screenshot comparison לפני סגירת cycle.

**action שנלקח:** Redesign sprint על Home + Feed. Mark כתב visual_redesign_brief.md עם 3 P0 קונקרטיים. Dolce תממש layout, spacing, hierarchy — לא רק tokens.
