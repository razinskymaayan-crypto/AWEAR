# knowledge/ds.md — Design System
> **קרא גם:** [[OW.md]] (כל קודי OW-* — Org-Wide Iron Rules, single source of truth; אל תעצור ב-006, יש עוד)

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

### DS-014 | Light mode — החלטה סופית, לא "עתידי"
**מקור:** visual vision session — board (2026-06-19)
**לקח:** Light + Dark mode auto לפי מכשיר — החלטת board, לא feature אופציונלי. כל קומפוננט חדש שנכתב ב-Cycle 3 ואילך חייב לעבוד בשני המצבים. hardcoded color על רקע שלא מושפע מ-prefers-color-scheme = P0.
**מנגנון:** כל CSS color שמשתמש ב-token → עובד אוטומטית. כל hardcoded hex → שבירה בlight mode. Cycle 3 migration כולל: הוספת `@media (prefers-color-scheme: light)` ל-tokens.css.

### DS-015 | benchmark נכון: Instagram + Pinterest + Zara (לא TikTok/Depop/Linear)
**מקור:** visual vision session — board (2026-06-19)
**לקח:** AWEAR = יוקרה נגישה, editorial, photo-first. הbenchmark הנכון: Instagram (community + photo), Pinterest (discovery + aspiration), Zara (accessible aspiration). TikTok = too loud. Depop = too grungy. Linear = tech, לא fashion. כל החלטת עיצוב נמדדת מול שלושת אלה, לא מול tech apps.
**מנגנון:** שאלת העל של גבאנה מתעדכנת מ-"Instagram story" ל-"Instagram/Pinterest/Zara story".

---

### DS-016 | פריט שנקנה/נסרק חייב לשאת image_url עד הארון
**מקור:** A3/A6 demo-image fix (2026-06-25)
**לקח:** `_productImgUrl(it)` ב-static/index.html נופל ל-`loremflickr.com` (תמונות Flickr אקראיות) כשאין `it.image_url`. כל מקום שמוסיף פריט לארון (handleCheckout/handleLookCheckout, scan, wishlist) חייב להעתיק `image_url` (ו-`brand_vibe`/`brand`, `id`) מהמקור — אחרת מיד אחרי "קניתי" רגע ה-demo המרכזי מציג תמונה אקראית במקום ה-catalog image שהמשתמשת ראתה. זה שובר את L1 ("clean catalog image") בלי console error.
**מנגנון:** בכל `w.unshift({...})` שמוסיף פריט נרכש/נסרק — כלול `image_url:it.image_url||''`. grep: `grep -n "w.unshift" static/index.html` ובדוק שכל אחד נושא image_url.


### DS-017 | כל avatar img חיצוני חייב onerror fallback — לא רק product images
**מקור:** A6 demo reliability — avatar fallback (2026-06-26)
**לקח:** imgFallback() כיסה רק product images (productImage()). 4 avatar imgs (feed card, peopleCard x2, user profile) נטענו ישירות מ-randomuser.me בלי onerror — אם ה-CDN חסום/איטי בדמו החי, כל avatar הופך ל-broken-image glyph. avatar שבור בפיד = בדיוק ההפך מ"התמונה היא הכוכב".
**מנגנון:** קיים avatarFallback(img) (ליד imgFallback) שמחליף את ה-img ב-.avatar-fallback (עיגול ראשי-תיבות על gradient accent->accent2, מראה את .up-avatar-initials המאושר). כל <img> של avatar חייב data-name="${attr(name)}" + onerror="this.onerror=null;avatarFallback(this)". grep אכיפה: grep -nE "<img[^>]*(avatar|randomuser|portraits)" static/index.html — כל תוצאה חייבת avatarFallback. ל-img עם width:100% ה-helper נופל ל-parentElement.offsetWidth כדי לא לטעות בגודל העיגול.


### DS-018 | mobile bottom-sheet: מחוות הסגירה על רצועת-ידית, לא על כל ה-sheet
**מקור:** Valentino, item-sheet iOS fix (2026-06-30) — swipe-to-dismiss חובר לכל ה-buySheet → ב-iOS ה-pointer-drag תפס גם את אזור התוכן הנגלל ונלחם בגלילה הנייטיב. דיווח המשתמש: "החלון קופץ מלמטה, לא נותן לסגור למטה ולא לגלול נורמלי".
**לקח:** bottom-sheet עם תוכן נגלל חייב להפריד את מחוות הסגירה (drag-down) מגלילת התוכן ומגלילת ה-body. drag על כל ה-sheet = scroll-trap.
**מנגנון:** (1) scope את ה-pointer-drag לרצועת ידית בלבד (`.sheet-grab`, `touch-action:none`, עם pointer capture). (2) אזור התוכן: `overflow-y:auto` + `overscroll-behavior:contain` + `touch-action:pan-y` + `-webkit-overflow-scrolling:touch`. (3) נעל גלילת body ב-open (`body.sheet-open .phone main{overflow:hidden}`) ושחרר תמיד ב-close. (4) ספק 3 דרכי סגירה: גרירה / tap על הרקע / כפתור X ≥44px.


### DS-019 | awear-tokens.json (root) = פלטת ה-DARK בלבד; light חי רק ב-tokens.css/app.css
**מקור:** jeff-rejection של mark (2026-07-12) — ריצה קודמת כתבה ערכי light-theme (muted #726D66, success #1a7a4a) לתוך awear-tokens.json → נפילת AA על dark וסתירה מול הבלוק הכהה של tokens.css. תוקן 2026-07-13 (netta): ה-json סונכרן לערכי ה-:root הכהים של tokens.css, והכפיל היתום static/awear-tokens.json (אפס צרכנים) נמחק.
**לקח:** שרשרת הטוקנים היא כיוונית: awear-tokens.json (root) מחזיק את פלטת ה-DARK (Mediterranean Modern) ומיובא ישירות ע"י mobile/theme/tokens.js; ערכת ה-LIGHT קיימת רק ב-tokens.css @media (prefers-color-scheme: light) וב-:root של app.css (founder override 2026-06-21, מנצח בקסקדה). כתיבת ערכי light ל-json שוברת גם את mobile וגם את כלל הסנכרון json-css.
**מנגנון:** לפני commit שנוגע בטוקנים: (1) ערכי color ב-json זהים לבלוק הכהה של tokens.css (עד ה-@media); (2) grep -c 'color-mix' awear-tokens.json = 0 (RN לא מפרסר color-mix — המר ל-rgba מקביל); (3) קובץ טוקנים חדש = צרכן מחווט או שאינו נולד (wire-it-up).


### DS-020 | contrast fix = background math, לא text cosmetics
**מקור:** gabbana — Analytics identity-card contrast re-gate, נכשל פעמיים (2026-07-14)
**לקח:** opacity bump ו-text-shadow לא זזים את מספרי ה-WCAG — הצל מוחרג מחישוב הקונטרסט. ממצא contrast נסגר רק ע"י שינוי הרקע (darken של gradient stop / scrim / היפוך fill) ודריבת היחס מחדש בנקודת ה-gradient הגרועה ביותר, בתמה שבאמת נרנדרת (light `:root` override מנצח, לא dark fallback).
**מנגנון:** לפני סגירת contrast finding — שאל "מה שינה את ה-background?" אם התשובה היא opacity/shadow/text-only → לא נסגר. חשב ratio מחדש ב-worst-case gradient position, ב-theme הרנדר בפועל.
