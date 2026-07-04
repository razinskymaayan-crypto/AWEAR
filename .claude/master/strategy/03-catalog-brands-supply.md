# חידה: קטלוג ומותגים — מאיפה הבגדים באים

> מסמך החלטה למייסדת (כרמל). מצב: לפני גיוס, ~$70-80K ב-2-4 שבועות. חברה ישראלית, מכירה גלובלית, English-first.
> החלטות נעולות: Affiliate מיום 1 (AWIN/Rakuten/CJ) → dropshipping ב-scale. הצעת resale = 50%, עמלה = 15%.
> רמת ביטחון כללית של המסמך: **גבוהה (85%)** על ה-affiliate; בינונית-גבוהה על dropshipping ו-P2P.

---

## מה השאלה בדיוק

ה-WOW של AWEAR: משתמש מצלם פריט → רואה % התאמה לארון + לוקים מה-AI → **קונה**. כדי שזה יעבוד צריך **קטלוג בגדים אמיתי בתוך האפליקציה** ביום הראשון: תמונות, מחירים, קישורים לרכישה. השאלה הפרקטית:

1. מאיפה מגיעים הבגדים ביום 1 — בלי שיש לנו עדיין מותג אחד שחתם איתנו?
2. **האם אנחנו בכלל צריכים שמותגים "ישתפו פעולה"** איתנו כדי להתחיל?

התשובה הקצרה שתפורט להלן: **לא. לא צריך שום מותג שיסכים לשום דבר ביום 1.** רשתות ה-affiliate נותנות גישה חוקית ל-feed של מיליוני מוצרים — תמונה, מחיר, deep link לרכישה — בלי שאנחנו מדברים עם אף מותג. זה פותר את "מאיפה הבגדים" במלואו לשלב הראשון.

---

## למה זה קריטי עכשיו

- **בלי קטלוג אין WOW, ובלי WOW אין דמו למשקיע.** ה-% התאמה והלוקים חייבים להצביע על מוצרים אמיתיים שאפשר לקנות. seed data (65 מוצרים שיש לנו ב-`static/data/products.json`) מספיק לפיתוח — לא מספיק להדגמה משכנעת.
- **הסיפור למשקיע חייב להיות "אין תלות בשיתופי פעולה".** משקיע ששומע "אנחנו צריכים ש-Zara תחתום איתנו" — בורח. משקיע ששומע "אנחנו מושכים feed של 3M מוצרים ב-API ביום 1, אפס תלות במותג" — נשאר.
- **זה זול והפיך.** להירשם ל-Sovrn/AWIN עולה $0-5 ולוקח ימים. זו החלטה מסוג "בצע עכשיו ותלמד" — לא בלתי-הפיכה.

---

## מה מצאנו על רשתות ה-Affiliate (תנאים אמיתיים, יולי 2026)

### הסיווג הקריטי: "רשת ישירה" מול "אגרגטור"

יש שני סוגי שחקנים, וזה משנה הכל עבורנו:

- **רשתות ישירות (AWIN, Rakuten, CJ):** נותנות **product feeds מלאים** (תמונות, מחירים, deep links, קטגוריות, מלאי) — בדיוק מה שצריך כדי לבנות קטלוג בתוך אפליקציה. **החיסרון:** צריך אישור לכל תוכנית מפרסם בנפרד, וחלק מהמותגים דורשים אתר עם תנועה מוכחת.
- **אגרגטורים (Sovrn Commerce, Skimlinks):** נותנים גישה ל-48,500+ מפרסמים ב-API אחד, **בלי צורך להתקבל לכל מותג בנפרד**, ו**בלי דרישת תנועה מינימלית**. אידיאלי ל-cold start.

### טבלת השוואה

| רשת | סוג | Product feed? | עמלת אופנה טיפוסית | דרישת אישור | מתאים ל-pre-revenue? |
|-----|-----|---------------|---------------------|-------------|----------------------|
| **Sovrn Commerce** | אגרגטור | כן — Approved Merchants API כולל תמונות, מחירים, deep links, מדינות | CPA לפי מוכר; משתנה | **אין מינימום תנועה**; אישור ידני לפי איכות; רוב המותגים לא דורשים אישור פרטני | **הכי כן** |
| **Skimlinks** | אגרגטור | כן — 48,500+ מוכרים מ-50+ רשתות | לרוב 5-10% אחרי חלוקה עם Skimlinks | אישור ידני; ללא מינימום תנועה קשיח | **כן** |
| **AWIN** | רשת ישירה | כן — Product Feed API, "מיליוני מוצרים", תמונות+מחירים+deep links | **3-15%**, עד 20% ב-high-ticket | **$5 פיקדון** (מוחזר בתשלום הראשון); אישור פלטפורמה 1-3 ימים; אישור תוכנית לכל מותג בנפרד | **כן, עם מאמץ** |
| **CJ Affiliate** | רשת ישירה | כן — Shopping Feed / product catalog: תמונות, מחירים, הנחות, תיאורים | **3-50%** לפי מותג | חינם; צריך אתר; גיל 18+; אישור לכל תוכנית (מיידי עד ~שבועיים) | **כן, עם מאמץ** |
| **Rakuten Advertising** | רשת ישירה | כן | 3-15% | דורש **אתר חי עם תוכן איכותי**; מפרסמי אופנה עשויים לדרוש **תנועה חודשית מינימלית** | **בעייתי ל-pre-revenue** |
| **ShopStyle / Collective Voice** | אגרגטור אופנה | היה | 10-20% | — | **פסול — נסגר 31.3.2026** |
| **LTK (RewardStyle)** | רשת influencers | כן | 10-20% | דורש **קהל מוכח ברשתות + בלוג עקבי** | **לא — לא מיועד לאפליקציה כמונו** |

### ה-gotchas האמיתיים (מה שיפיל אותנו אם לא נדע)

1. **Collective Voice (ShopStyle) — מת.** הפלטפורמה נסגרת ל-creators ב-31.3.2026, תשלומים אחרונים ב-19.7.2026. **למחוק אותה מכל תוכנית.** (זו הייתה אופציה מובנת מאליה לאופנה — היום היא מלכודת.)
2. **דרישת תנועה מהמותגים הגדולים.** גם ב-AWIN/CJ, מותג ספציפי (למשל ASOS) **יכול לדחות** מפרסם ללא תנועה. הפתרון: לא לבנות תלות במותג בודד — למשוך feed רחב, ולהתחיל מהמותגים שמאשרים אוטומטית.
3. **זכויות שימוש בתמונות — ה-gotcha המשפטי החשוב ביותר.** התמונות ב-feed מגיעות מהמותג. הרישיון להציג אותן מוגבל לתנאי ה-API/הרשת, ולעתים **לא ברור אם למותג עצמו יש זכות להעביר את התמונות הלאה**. כלל ברזל: **להציג תמונות רק מה-feed הרשמי (URL מה-API), אף פעם לא download+reupload,** ותמיד עם deep link לעמוד המוצר בלבד. זה בדיוק המודל שאמזון אוכף (חובה Product Advertising API, אסור לשמור תמונות).
4. **אישור ידני = לא מיידי.** Sovrn/Skimlinks דורשים שהאתר/אפליקציה כבר יפיקו clicks לפני אישור מלא. כלומר: **צריך MVP חי עם תעבורה כלשהי**, ולו קטנה, כדי לעבור אישור. לא צריך traffic גדול — צריך traffic *אמיתי*.
5. **English-first עוזר לנו.** רוב המותגים ב-AWIN/CJ/Sovrn הם US/UK/EU. היותנו גלובליים-אנגלית מקל על אישור — לא מפריע.

---

## האם צריך מותגים בכלל? (הכרעה כנה)

**לא ביום 1. וכנראה לא עד שיש לנו נפח מכירות שמעניין מותג לדבר איתנו ישירות.**

הטיעון הכן:

- **מה ש-affiliate פותר לגמרי:** "מאיפה הבגדים". Feed רשמי = קטלוג חוקי של מיליוני פריטים עם תמונות, מחירים ו-deep links. זה כל מה שצריך כדי שה-WOW יעבוד ושמשתמש יקנה. **אפס שיחות עם מותגים.**
- **מה ש-affiliate לא נותן, ולמה זה לא חשוב עכשיו:**
  - עמלה נמוכה יותר (3-15%) מול deal ישיר (20-40%). לא רלוונטי בשלב שאין נפח.
  - אין בקרה על מלאי/מחיר בזמן אמת מעבר למה שב-feed. נסבל.
  - אין בלעדיות. לא צריך בלעדיות כדי להוכיח מוצר.
- **מתי כן לרדוף אחרי deal ישיר:** רק כשיש **data** — נגיד "אנחנו שולחים X רכישות/חודש ל-brand Y דרך affiliate". אז ה-deal הישיר הופך למובן מאליו מצד המותג, כי מראים לו הכנסה קיימת. זה **מהופך** לרדיפה מוקדמת: קודם מוכיחים ערך דרך affiliate, ואז המותג רוצה אותנו.

**מסקנה:** לרדוף אחרי מותגים לפני שיש נפח = בזבוז זמן מייסדת יקר על deals שלא ייסגרו. Affiliate feeds מנתקים את התלות הזו לחלוטין.

---

## דרופשיפינג ב-scale (מה זה באמת)

מתי dropshipping מנצח affiliate: כשאנחנו רוצים **לשלוט בחוויה end-to-end** (checkout באפליקציה, מיתוג, שולי רווח גבוהים יותר) — ורק כשיש נפח שמצדיק את התפעול.

- **ספקים אמיתיים:** AliExpress (רחב, זול, איטי), **CJdropshipping** (ללא דמי מנוי, CJPacket 6-12 ימים, אינטגרציית TikTok Shop), **Spocket** (ספקי US/EU, משלוח בימים, הנחות סיטונאי 30-60%, קטלוג צר יותר ומחיר ליחידה גבוה).
- **שוליים:** Spocket מנהל 30-60% הנחת סיטונאות → שולי רווח בריאים; AliExpress זול יותר אבל איטי ועם סיכון איכות.
- **החזרות — הסיכון הגדול.** ב-CJ ל-"service products" (ספק חיצוני) המדיניות **לא בהכרח מכסה סכסוכי איכות**. באופנה, שיעורי החזרה גבוהים מטבעם (מידות). זה עלול לאכול את כל שולי הרווח אם לא מנהלים אותו.
- **מתי לעבור:** כש-affiliate מוכיח אילו קטגוריות/מוצרים נמכרים → מייצרים אותם/מ-source אותם ב-dropshipping עם שוליים כפולים. לא לפני.

**המלצה:** dropshipping הוא **שלב 2-3**, לא יום 1. הוא דורש תפעול (הזמנות, החזרות, שירות לקוחות) שאין לו הצדקה לפני PMF.

---

## P2P Resale כמקור אספקה שלישי (Cold-start ללא שותף)

זה **הנשק הסודי ל-cold start**: משתמשים מעלים בגדים מהארון שלהם למכירה (resale 50%, עמלה 15%). **אפס תלות בשותף חיצוני.**

- **למה זה חזק:** כל משתמש שמצלם את הארון שלו הוא כבר מקור מלאי פוטנציאלי. זה סוגר לולאה: הארון שכבר סרקנו ל-% התאמה הופך למלאי מכירה. אף מתחרה affiliate לא נותן את זה.
- **הבנצ'מרק לעמלה שלנו (15%) הגיוני:** Poshmark לוקח 20%, eBay ~13%, Depop 3.3%+$0.45, Vinted 0% (הקונה משלם 5%). 15% שלנו יושב באמצע — תחרותי, לא זול מדי.
- **המספרים:** Vinted חצתה 100M משתמשים, €10B GMV, נכנסה ל-US 2026. eBay קנתה את Depop ב-$1.2B (פברואר 2026). שוק ה-resale ב-US צפוי ל-$40B עד 2029. **הרוח הגבית חזקה.**
- **החסרונות:** מלאי לא צפוי (chicken-and-egg — צריך מסה קריטית של מוכרים), אמון (זיופים, מצב הפריט), לוגיסטיקת משלוח בין משתמשים, ומודרציה. זה feature שדורש בנייה — לא switch שמדליקים.

**המלצה:** P2P הוא **שלב 2** — feature ה-differentiation שלנו, אבל לא ביום 1 כי הוא לא פותר קטלוג ביום הראשון (אין עדיין משתמשים שמעלים).

---

## האפשרויות

### אופציה A — Aggregator-first (Sovrn/Skimlinks) ← **מומלץ ליום 1**
**איך:** נרשמים ל-Sovrn Commerce + Skimlinks, מושכים feed רחב דרך API אחד. תמונות+מחירים+deep links לתוך ה-WOW.
- **יתרונות:** ללא מינימום תנועה; ללא אישור פרטני לכל מותג; API אחד = מהיר להטמעה; קטלוג ענק מיידית; חוקי לחלוטין.
- **חסרונות:** עמלה מחולקת (נמוכה יותר); אישור ידני דורש MVP חי עם clicks; פחות שליטה על מלאי.
- **עלות/מאמץ:** ~$0. שבוע-שבועיים אינטגרציה הנדסית.
- **דורש מכרמל:** להרשם (חשבון + פרטי בנק), ולוודא שיש MVP חי לאישור.

### אופציה B — Direct network feeds (AWIN + CJ) ← **מומלץ במקביל, שלב 1.5**
**איך:** נרשמים ל-AWIN ($5 מוחזר) ו-CJ (חינם), מבקשים אישור לתוכניות אופנה שמאשרות אוטומטית, מושכים product feeds.
- **יתרונות:** עמלות טובות יותר (3-15%, עד 20%+); שליטה טובה יותר ב-feed; מותגים מוכרים (ASOS, Nike, Zalando).
- **חסרונות:** אישור לכל מותג בנפרד; חלק ידחו ללא תנועה; יותר עבודת ניהול.
- **עלות/מאמץ:** ~$5. מאמץ ניהולי מתמשך (אישורי תוכניות).
- **דורש מכרמל:** רישום + החלטה אילו verticals אופנה לתעדף.

### אופציה C — Direct brand deals ← **דחייה עד scale**
- **יתרונות:** עמלות 20-40%, בלעדיות, מיתוג.
- **חסרונות:** לא ייסגר בלי נפח מוכח; זולל זמן מייסדת; לא פותר קטלוג ביום 1.
- **המלצה:** **לא עכשיו.** לחזור לזה עם data.

### אופציה D — Dropshipping / P2P ← **שלב 2-3**
- Dropshipping: שליטה מלאה + שוליים, אבל תפעול והחזרות. אחרי PMF.
- P2P resale: differentiation ייחודי, cold-start ללא שותף — אבל דורש מסת משתמשים. שלב 2.

---

## ההמלצה + סדר הגדילה

**המלצה: Aggregator-first, direct-feed במקביל, ואז P2P, ואז dropshipping/direct deals. רמת ביטחון: 85%.**

**Day-1 supply stack:**
1. **Sovrn Commerce + Skimlinks** — עמוד השדרה של הקטלוג. ללא מינימום תנועה, API אחד, מיליוני מוצרים. זה מה שממלא את ה-WOW ביום 1.
2. **AWIN + CJ במקביל** — למותגי אופנה שמאשרים אוטומטית, לעמלות טובות יותר. מתחילים מוקדם כי אישורים לוקחים זמן.
3. **Rakuten / LTK — לא עכשיו** (דרישת תנועה / קהל influencers).

**סדר הגדילה (sequence):**
- **שלב 0 (עכשיו, לדמו למשקיע):** feed מ-Sovrn/Skimlinks + AWIN/CJ → קטלוג אמיתי באפליקציה.
- **שלב 1 (post-raise, 0-3 חודשים):** לייצב affiliate, למדוד אילו קטגוריות ממירות.
- **שלב 2 (3-9 חודשים):** להשיק **P2P resale** (ה-differentiation שלנו) — סוגר את לולאת הארון→מלאי.
- **שלב 3 (9+ חודשים, עם data):** dropshipping לקטגוריות מנצחות + direct brand deals ממונפים על נפח affiliate מוכח.

**למה זה הכיוון:** מנתק את התלות במותגים לחלוטין (התשובה לחידה), זול והפיך, נותן קטלוג אמיתי ביום 1, ומחזיק סיפור חזק למשקיע ("אפס תלות בשיתופי פעולה, קטלוג של מיליוני מוצרים ב-API אחד, plus מנוע resale ייחודי").

---

## מה צריך ממך (כרמל)

1. **החלטה מרכזית אחת:** לאשר את ה-stack Aggregator-first (Sovrn+Skimlinks) כעמוד השדרה של הקטלוג ליום 1 — **כן/לא**. אם כן, אני מדליק את זה השבוע.
2. **רישום חשבונות:** צריך פרטי חברה + חשבון בנק לרישום כמפרסם ב-Sovrn/AWIN/CJ. מי מבצע — את או שאני מקצה למישהו בצוות?
3. **אישור scope תמונות:** לאשר את כלל הברזל — **מציגים תמונות רק מ-feed רשמי דרך API, לעולם לא download+reupload**, תמיד deep link לעמוד המוצר. זו הגנה משפטית קריטית.
4. **החלטת עיתוי P2P:** לאשר ש-P2P resale הוא שלב 2 (post-raise) ולא יום 1 — או להסביר אם את רוצה אותו מוקדם יותר כ-hero feature לדמו.
5. **Direct deals:** לאשר שלא רודפים אחרי מותגים לפני נפח מוכח (משחרר זמן מייסדת).

---

## מקורות

**רשתות affiliate — אישור ו-feeds:**
- [Awin — Product Feed Publisher Guide](https://help.awin.com/developers/docs/product-feed-publisher-guide-intro)
- [Awin — Product feeds intro](https://help.awin.com/developers/docs/product-feed-intro)
- [Awin — Application process & joining fee ($5 deposit)](https://www.awin.com/gb/compliance-and-regulations/application-process-and-joining-fee)
- [Awin Review 2026 — commissions, approval timelines](https://earnifyhub.com/blog/affiliate/awin-review-2026)
- [Awin Review — $5 deposit refund details](https://orichi.info/awin-review/)
- [Sovrn — Getting Approved for Commerce (no minimum traffic, manual review)](https://www.sovrn.com/blog/getting-approved-for-commerce/)
- [Sovrn — API Onboarding Guide for Commerce](https://knowledge.sovrn.com/kb/api-onboarding-guide-for-commerce)
- [Sovrn — Getting Started with Commerce](https://knowledge.sovrn.com/kb/getting-started-with-sovrn-commerce)
- [Skimlinks — official site (48,500+ merchants)](https://www.skimlinks.com/)
- [Skimlinks Review — merchants & payouts](https://www.craigcampbellseo.com/skimlinks)
- [CJ — Making the Most of CJ's Shopping Feed Format](https://junction.cj.com/article/making-most-cjs-shopping-feed-format)
- [CJ Affiliate — publisher requirements & approval](https://smartblogger.com/cj-affiliate-commission-junction/)
- [Complete Guide to CJ Affiliate 2026](https://nichehacks.com/cj-affiliate/)
- [Rakuten — Requirements for New Publishers](https://pubhelp.rakutenadvertising.com/hc/en-us/articles/360060314292-Requirements-for-New-Publishers)
- [Rakuten — Become a Publisher](https://pubhelp.rakutenadvertising.com/hc/en-us/articles/13214492487309-Become-a-Publisher)
- [ShopStyle/Collective Voice — commission & shutdown Mar 2026](https://getlasso.co/affiliate/shopstyle/)
- [LTK / RewardStyle — acceptance requirements](https://goforkady.com/rewardstyle-liketoknowit-ultimate-guide-accepted/)

**זכויות שימוש בתמונות:**
- [Using copyrighted images in affiliate product feeds](https://www.multiplicit.co.uk/using-copyrighted-images-in-affiliate-product-feeds/)
- [Amazon Associates — Operating Policies (image/API rules)](https://affiliate-program.amazon.com/help/operating/policies)
- [Can I Use Amazon Product Images on My Affiliate Website? (Lasso)](https://getlasso.co/can-i-use-amazon-product-images-on-my-affiliate-website/)

**Dropshipping:**
- [16 Best Dropshipping Suppliers 2026 (Shopify)](https://www.shopify.com/blog/dropshipping-suppliers)
- [CJdropshipping vs AliExpress 2026 (Importify)](https://www.importify.com/blog/cjdropshipping-vs-aliexpress/)
- [Dropshipping Returns & Refunds 2026](https://www.dailyfulfill.com/dropshipping-returns-refunds-the-complete-guide-2026/)
- [Top US Dropshipping Suppliers Women's Clothing 2026 (CJ)](https://cjdropshipping.com/blogs/selling-strategies/dropshipping-suppliers-usa-women-s-clothing)

**P2P resale — עמלות ושוק:**
- [Marketplace Selling Fees Compared 2026 (Voolist)](https://www.voolist.com/blog/marketplace-fees-comparison-2026)
- [Vinted Fees 2026 — $0 seller fees](https://www.voolist.com/blog/vinted-fees-2026)
- [Poshmark Fees 2026 — 20% breakdown](https://www.voolist.com/blog/poshmark-fees-2026)
- [Depop vs Poshmark 2026 (fees, audience)](https://www.voolist.com/blog/depop-vs-poshmark-2026)
- [Vinted vs Poshmark vs Depop vs eBay 2026 (market shift)](https://www.flipsail.io/blog/vinted-market-shift)
