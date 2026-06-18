# Critique Cycle 1 — Ayalon | 19.06.2026

---

## UX Research → Actions Check

המחקר של מארק מצוין מבחינת רוחב כיסוי. הבעיה היא שהוא מסתיים ברשימת המלצות — לא ב-action items מוגדרים עם owner וcycle. לכל המלצה בדקתי האם יש תרגום ספציפי לפיתוח.

| המלצה מהמחקר | סטטוס | Action item שחסר |
|---|---|---|
| ratio 4:5 לתמונות בפרופיל | לא יושם — הפיד מציג תמונות ב-600x750 (OK), אבל אין constraint מוגדר בפרופיל | דולצ'ה: הוסיפי CSS `aspect-ratio: 4/5` על thumbnail בעמוד פרופיל. cycle הבא. |
| DM/chat כprimary nav | לא קיים — אין DM בAWEAR בכלל | להכריע: האם AWEAR מכניסה DM? זו שאלה product-level, לא design. אניח שלא כRoadmap feature היום, אבל זה gap שיש לתעד. |
| Double-tap to like | **יושם** — קוד קיים בפועל (pointerup event, burstHeart call). |  |
| Masonry grid לפיד | לא קיים — הפיד מוציא כרטיסים ישרים, לא masonry. | דולצ'ה: CSS grid עם `grid-template-rows: masonry` (Chrome 2026) או JS fallback. owner: דולצ'ה. cycle הבא, P1. |
| Condition badge on card | **יושם חלקית** — בMarketplace יש badge. בפיד הרגיל אין condition כי הפוסטים לא מוצרים אלא לוקים. gap הגיוני. | להוסיף condition בcards של tab "מכירה שלי" בmarketplace. קיים בseed data אבל הcard של renderMySells מציג emoji ולא תמונה ולא badge. |
| Horizontal style chip row | **יושם חלקית** — יש filters בmarketplace. בפיד החברתי אין chips לפי style. | דולצ'ה: הוסיפי chips row מעל feed-scroll: Y2K / Minimal / Streetwear / Vintage / All. כבר יש activeFilter logic — רק חסר ה-UI. owner: דולצ'ה. P1. |
| Share sheet native | לא יושם — Share מציג `showToast('הקישור הועתק')` ותו לא. | דולצ'ה: `navigator.share()` כdrop-in. אם לא נתמך → fallback ל-clipboard. שורה אחת. P2. |
| Condition + Size בcard marketplace | **חלקי** — condition badge קיים. **size לא מוצג בcard** — גם לא קיים ב-MP_SEED data. | סאם: הוסף שדה `size` ל-marketplace item schema. דולצ'ה: הצג בcard. P1. |
| Search keywords בcloset | לא קיים — חיפוש בארון עובד לפי browse, לא keyword חופשי. | scope לcycle 2. |
| Shared element transition | לא קיים | P2 — אחרי שmarketplace card מקבל image. |
| Filter chips horizontal scroll | ראה לעיל | |
| Swipe-to-dismiss bottom sheets | לא בדקתי קוד, אבל המחקר מציין שAWEAR כיום דורשת לחיצה על X. | בדיקה: האם ה-bottom sheet הנוכחי מיישם touchmove? אם לא — דולצ'ה, P1. |
| Skeleton loading | לא קיים — Pollinations images מוצגות בלי skeleton. | דולצ'ה: skeleton shimmer לפני שתמונה נטענת. CSS בלבד. P1, משפיע על first impression. |
| Sell flow כwizard | לא בדקתי בעומק אבל MP_SELL_OPEN ו-openSellForm קיימים. | לבדוק בcycle הבא האם הwizard מודרך או טופס גולמי. |
| Private metrics mode (VSCO) | מהמחקר: "להעביר לאיילון" — וזה נכון, זו שאלה product. | ההחלטה שלי: **לא לאמץ** בשלב הזה. AWEAR צריכה engagement visible כדי לבנות social proof בשלבי bootstrap. לסמן כ-backlog. |

**סיכום:** מתוך 14 המלצות ספציפיות — 3 יושמו, 6 חסרות action item מפורש עם owner+cycle, 5 נדחו בצדק. הפער הוא שהמחקר הסתיים בDOC ולא הצמיח JIRA/backlog item אחד. זה לא כשל מארק — זה כשל שלי. עד עכשיו לא תרגמתי את המחקר לaction list שדולצ'ה יכולה לפתוח בבוקר.

---

## Data Authenticity Audit

### פרופילים — profiles.json

**מה עובד:**
- biographies אמינות ומפורטות. "vintage collector hunting through Tel Aviv's flea markets | Jaffa-based" — זה נשמע כמו בן אדם אמיתי.
- מגוון אתני ועיר מגורים הגיוני: TLV, חיפה, ב"ש, ירושלים, מושב בית יצחק — לא הכל TLV bubble.
- שילוב של עברית ואנגלית בbiographies תואם לקהל היעד (18-35 ת"א דוברי שתי שפות).
- style_tags מגוונים: Y2K, vintage, boho, minimal, streetwear, luxury, avant-garde, cottagecore, dark academia, sporty. כיסוי טוב.
- mix של גברים ונשים, ישראלים ומשתמשים בינלאומיים בTLV.

**בעיות:**
1. **followers distribution לא הגיונית לפלטפורמה חדשה.** camille.luxe עם 31,500 followers ו-lucas.drip עם 18,900 followers — זו פלטפורמה שרק עלתה. בפלטפורמה חדשה, המשתמשים הכי פעילים מגיעים עם 1k-5k, לא 30k+. זה גם לא מאפשר לבדוק edge case של "פרופיל עם 0 followers" (אין כזה בdataset).
2. **joined dates לא מגיעים לפני 2023-05.** המשמעות: אין "early adopters" מ-2022. אם AWEAR תציג "חבר מאז 2022" — אין בdata נתון כזה לבדיקה.
3. **כפילות avatar_url:** user_008 ו-user_017 משתמשים באותה כתובת (`women/38.jpg`). user_013 ו-user_016 — `women/82.jpg`. זה יגרום לשני פרופילים שנראים זהים בUI.
4. **אין פרופיל עם 0 posts.** לא בדקנו edge case של משתמש חדש שלא העלה כלום.
5. **אין פרופיל עם bio ריק.** edge case חשוב לUI.

### פוסטים — posts.json

**מה עובד:**
- captions מרגישות אמיתיות — שפה, אמוג'י, תמהיל עברית/אנגלית.
- likes distribution הגיונית יחסית: post_001 של user_001 (4,320 followers) קיבל 412 לייקים — כ-10%, הגיוני.
- dates מפוזרות על פני שבועיים — לא הכל אותו יום.
- items_tagged מחוברים ל-prod IDs — data referential integrity בסדר.

**בעיות:**
1. **אין comments content.** יש comments count אבל אין array של comments בpost object. האפליקציה לא יכולה לרנדר תגובות אמיתיות מהdata.
2. **post_007 ו-post_008 של user_004 (12,600 followers) — 2,100 לייקים על post_008.** זה 16.7% engagement rate, גבוה מאד לפיד אלגוריתמי. לא שגיאה גסה אבל כדאי לשים לב.
3. **חסר פוסט עם 0 לייקים.** edge case: כרטיס פיד עם ספירה אפס — נראה תקין בUI?
4. **חסר פוסט ללא items_tagged.** edge case: כרטיס ללא "shop the look" — UI מטפל בזה?
5. **post_013 מיום 2026-06-19** — יום ה-cycle הנוכחי. זה תקין, אבל צריך לוודא שrenderFeed מסדר לפי created_at ולא ID.

---

## Gap Analysis: Research vs App

קראתי את renderFeed ואת renderMarketplace. הנה הgaps הממשיים:

### בפיד החברתי (renderFeed)

1. **אין style chips מעל הפיד.** activeFilter קיים בcode, אבל ה-UI chips לא ממוקמות בתוך renderFeed — הן נמצאות בנפרד לפי הקוד. צריך לאמת האם הן בפועל נראות מעל הפיד.
2. **burstHeart קיים, double-tap קיים — אבל אין visual feedback בnon-liked state.** כלומר: אם לחצתי double-tap ולייקתי, הlikes counter לא מתעדכן — רק האייקון משתנה. הcount נשאר על המספר הbeardisplay מהpost object.
3. **אין skeleton loading.** הפיד מוסיף כרטיסים ישירות, תמונות נטענות ריקות.
4. **share:** `showToast('הקישור הועתק')` — אין `navigator.share()`, אין העתקה לclipboard בפועל. ה-toast שקרי.

### בMarketplace (renderMarketplace)

1. **card מציג emoji במקום תמונת מוצר בMySells tab.** `renderMySells` משתמש ב-`item.emoji||'👗'` ישירות כtext, לא `productImage(item)`. זה inconsistency עם browse tab שכן מציג תמונות.
2. **חסר שדה size בcard.** המחקר ציין בפירוש ש-Vinted מציג size+condition on card. כיום AWEAR מציג רק condition ומחיר.
3. **item click פותח openSheetSingle עם `price_estimate_usd: item.price`.** זה mapping ישיר — תקין, אבל לאחר שינוי השם של סאם צריך לוודא שהשדה תואם.
4. **אין search/filter חופשי בmarketplace.** רק category filters. מחפשת "adidas"? לא יכולה.

### מה הפיצ'ר הכי חסר — משתמשת 18-35 ת"א ביום ראשון

**style chips מעל הפיד + skeleton loading.**

הסדר: היא נכנסת לפיד. רואה ריבועים ריקים לשניה-שתיים (Pollinations אטי). לא יודעת איך לצמצם לסגנון שמתאים לה. בהינתן שאין לה עדיין following, הפיד נראה kkrandom. היא תצא.

אם היה: (א) skeleton שמראה שמשהו נטען, (ב) chips שמאפשרות לה לבחור Y2K או Minimal מיד — היא נשארת 30 שניות יותר. 30 שניות בonboarding experience = הבדל בין retention לchurn.

---

## Top Blocker

**MarketPlace cards לא מציגים תמונות בtab "מכירה שלי".**

זה הblocker הכי עקרוני כרגע — לא כי זה הbug הגדול ביותר, אלא כי זה הדבר שמשתמשת שתגיע ממחקר UX תראה ראשון. היא תיכנס לmarketplace, תסתכל על הseed items שיש להם תמונות (browse), ואז תלחץ על "מכירה שלי" ותראה emoji 👖 במקום תמונה. זה קורע את האמינות.

**הצעה:** 3 שורות קוד — `renderMySells` מחליף `item.emoji||'👗'` ב-`productImage(item)`. owner: דולצ'ה. זמן: שעה. impact: אחידות visulaית בין כל tabs של marketplace.

---

## P0 | P1 | P2

### P0 — לפני שמציגים למשתמש אמיתי

- **avatar_url כפולים בprofiles.json** — user_008/user_017 ו-user_013/user_016 חולקים תמונה. יצור confusion מיידית בUI. תיקון: החלף 2 כתובות.
- **renderMySells מציג emoji כtext, לא תמונת מוצר.** inconsistency עם browse tab. owner: דולצ'ה.
- **share button לא עושה כלום בפועל** — toast "הקישור הועתק" ללא clipboard write. שקרי למשתמש. owner: דולצ'ה, 2 שורות: `navigator.clipboard.writeText(location.href)`.

### P1 — cycle הבא

- **Skeleton loading** לתמונות פיד ומוצרים — Pollinations אטי, ריבועים ריקים = broken feeling.
- **Style chips מעל הפיד** — Y2K / Minimal / Streetwear / Vintage / All. activeFilter logic קיים, רק UI chips חסרים.
- **size field ב-marketplace card** — הוסף לMPSEED schema + הצג בcard. תואם מחקר Vinted.
- **Comments array בposts.json** — כדי שUI יוכל לרנדר תגובות אמיתיות.
- **Edge cases בprofiles.json** — פרופיל עם 0 posts, bio ריק, follower count 0.

### P2 — לאחר מכן

- **Masonry grid** בפיד הלוקים — visual improvement משמעותי אבל לא blocker.
- **navigator.share()** native iOS sheet במקום toast בלבד.
- **Search חופשי** בmarketplace (keyword, לא רק category).
- **Shared element transition** בפתיחת card — Pinterest-style. אחרי שcard מקבל תמונה.
- **likes counter update בdouble-tap** — כרגע ה-count לא משתנה בUI, רק האייקון.
- **Private metrics mode** — backlog, לא cycle הבא.

---

## GOOD

מארק ייצר מחקר UX שהוא באמת שמיש — לא סיכום כללי אלא טבלות מה לאמץ, מה לא, ולמה. זה הסטנדרט שרציתי לראות, ואני אומר את זה מפורש. הפיד החברתי כולל double-tap, burstHeart, like toggle, save, share, report — כל הבסיס הנכון. הdata הפיקטיבי מרגיש אמיתי ברמה שגורמת לי לרצות לגלול בפיד. הbiographies בפרטיקולר — טוב. וה-marketplace כולל compatibility score ("התאמה לארון") שהוא פיצ'ר differentiating שמעט מתחרות עושות — צריך להמשיך ולהדגיש אותו ויזואלית.

---

*Ayalon | Product Director | AWEAR | 19.06.2026*
