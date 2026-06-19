# learnings — AWEAR agents
> קרא רק את הסעיפים הרלוונטיים לתפקידך.

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

### DS-010 | search_query > emoji ב-data objects — productImage() לא משתמש ב-emoji
**מקור:** dolce — P1-C fix cycle 2 (2026-06-19), Gabbana feedback
**לקח:** SHOP_SEED items כללו `emoji:` field שלא שימש את `productImage()` (שמשתמש ב-`search_query || q || name`). emoji field ב-data objects = dead weight שגורם ל-grep false-positives ומסכן שישתמשו בו כ-fallback בטעות. search_query מדויק באנגלית = תמונת מוצר ממוקדת יותר מ-pollinations. badge strings עם emoji (badge:'חם🔥') = P0 — badge הוא UI chrome.
**מנגנון:** כל data object עם product — חייב `search_query` (לא emoji). אם רואים `emoji:` ב-data object → מחק, הוסף `search_query`. badge strings שמכילים emoji → טקסט בלבד.

### DS-012 | emoji בdata objects = time bomb — בדוק גם SF_ITEMS ו-STYLISTS_DATA
**מקור:** dolce — P1-C fix cycle גבאנה (2026-06-19)
**לקח:** תיקון MP_SEED emoji → search_query חשף שאותו pattern קיים ב-SF_ITEMS (20 פריטים) ו-STYLISTS_DATA (6 stylists) ובstories data (7 rows). cycle זה הוגבל ל-MP_SEED בלבד לפי scope מארק — אבל ה-debt ידוע ומתועד. toast strings עם ✓ גם הם P0-adjacent — נקיון שלהם לא מאחר.
**מנגנון (cycle הבא):** `grep -n "emoji:'[^']" static/index.html` — SF_ITEMS ו-STYLISTS_DATA → replace עם `search_query` + `avatar_bg` (ל-stylists) בלבד. stories data → avatar initials fallback.

### DS-011 | RefreshControl ב-RN — tokens עובדים, CSS vars לא
**מקור:** netta — feat/rn-token-adoption (2026-06-19)
**לקח:** FeedScreen.js ב-mobile כלל comment "hex חייב כי CSS vars לא נתמכות ב-RefreshControl". נכון לweb — שגוי לRN. `RefreshControl` מקבל JS string value — לכן `colors.accent` (מtokens.js) עובד ישירות, ללא CSS variable. ההבחנה: CSS var = web runtime, tokens.js = JS constants = עובדים בכל JS context.
**מנגנון:** לפני כל "חייב hardcoded" ב-RN StyleSheet — שאל: "CSS var limitation, או JS string?" JS string → token עובד. CSS var → RN לא תומך, tokens.js כן.

### DS-013 | Gabbana audit = git diff, לא קובץ שלם
**מקור:** simulation probe — gabbana (2026-06-19)
**לקח:** audit של index.html השלם עולה ~82,000 טוקנים. audit של `git diff main...branch -- static/index.html` עולה ~8,000 טוקנים ומכסה את כל השינויים בפועל. קריאת קובץ שלם = בדיקת קוד שלא נגעו בו.
**מנגנון:** `git diff main...$(git branch --show-current) -- static/index.html` → audit רק על השינויים. לאחר מכן grep הbranch הספציפי לP0 criteria.

---

