# חידה: בידול וחפיר — למה אנחנו, ומה מגן כשגוגל מעתיקה מחר בבוקר

מסמך החלטה למייסדות (Carmel). מונחים טכניים באנגלית בכוונה.
תאריך: 2026-07-15 · מחבר: Bernard (Head of Strategy, Moat & Fundraising)

בונה על החלטות נעולות — לא פותח אף אחת מחדש: עמלת resale ‏15% · קרדיטים מודל A (מתוך העמלה, cap ‏≤50%) · affiliate day-1 ‏blended ~8% · wedge = single-player scan (חידה 02) · המודל הכן של חידה 05 ($2.98 net/attributed order, ‏~80% GM, ‏M12 ‏$60-160K ARR base case).

---

## מה השאלה בדיוק

ה-deck טוען (Slide 3): החפיר שלנו הוא flywheel של דאטה מתויג — AI מזהה, המשתמשת מאשרת/מתקנת, והתיקון נשמר כ-training signal שבבעלותנו. משקיע רציני ישאל שלוש שאלות, ולכל אחת חייבת להיות תשובה שלא נשברת ב-diligence:
1. **למה אתן ולא כל אחד מחמשת מחלקות המתחרים** — Instagram/Pinterest, Vinted/Depop, Whering/Indyx/Acloset, StyleDNA/Alta/Daydream, LTK/ShopMy — מה אנחנו עושים שהם **מבנית** לא יכולים להעתיק, ולמה לא.
2. **איזה מהחפירים המועמדים באמת מחזיק** מול מתחרה עם משאבים אינסופיים — ואיזה נשבר בשנה ולכן אסור למכור אותו.
3. **מה בדיוק לטעון בפגישה, מה לא, ומה עונים** על שלוש השאלות הקשות ביותר.

Spoiler חד: חפיר הדאטה שלנו אמיתי — אבל רק אם מנסחים אותו נכון. הניסוח הלא-נכון ("dataset קנייני", "אי אפשר להעתיק את הזיהוי") מת ב-diligence תוך חמש דקות. הניסוח הנכון — **per-user context ledger, לא aggregate dataset** — שורד, וכעת מגובה בקוד רץ.

---

## למה קריטי עכשיו

- **פגישת משקיע בעוד 2-4 שבועות**, וטענת החפיר היא Slide 3 — ה"wow" של ה-deck. אם היא נופלת, כל השאר נופל איתה.
- **לפני שבוע בדיוק (2026-07-07) Whering — המתחרה הקרובה ביותר, 10M users — גייסה $7M בהובלת eBay Ventures ו-Google AI Futures Fund**, במוצהר כדי לבנות בדיוק את שכבת ה-AI שלנו: virtual try-on, personalization, styling chatbot ([WWD](https://wwd.com/business-news/technology/whering-styling-app-investment-ebay-google-ai-futures-1239053470/), [Tech.eu](https://tech.eu/2026/07/07/whering-lands-7m-as-digital-wardrobe-platform-reaches-10m-users/)). זה חותך לשני הכיוונים: ולידציה עוצמתית לקטגוריה ולתזמון — וטיימר שרץ.
- **החפיר כבר לא סליידוור:** נכון ל-2026-07-15, ה-backend סוגר את הלולאה בקוד — טבלת `scan_corrections` ב-SQLite (ledger append-only, idempotent) + ‏`/api/analyze` שמזריק את התיקונים ההיסטוריים של כל משתמשת לתוך קריאת ה-Vision החיה שלה (`app.py`). מסך האישור "צדקנו?" ב-UI עדיין בפיתוח — אבל המנגנון עצמו shipped. אפשר להגיד למשקיע "זה רץ", בכנות, על צד השרת.

---

## מפת הקרב — חמש מחלקות מתחרים, ומה כל אחת מבנית לא יכולה

### 1. Instagram / Pinterest / Google Lens — הענקים

**העובדה שהכי חשוב להגיד בפגישה: הענקים כבר ניסו — ונסוגו.** Instagram הסירה את ה-Shop tab (פברואר 2023) וסגרה את live shopping (מרץ 2023), במוצהר כדי לחזור להתמקד ב-ads ([TechCrunch](https://techcrunch.com/2023/02/14/instagram-is-killing-live-shopping-in-march-will-focus-on-ads-instead/), [Retail Dive](https://www.retaildive.com/news/instagram-sunsets-live-shopping-social-commerce-retreat/642841/)). Google Lens מריצה ~20B חיפושים ויזואליים בחודש, ~20% מהם shopping ([Google blog](https://blog.google/products/ads-commerce/google-lens-ai-overviews-ads-marketers/)) — **הזיהוי עצמו commoditized, ואנחנו לא טוענים אחרת.**

**מה הם מבנית לא יכולים:** המודל העסקי שלהם הוא attention→ads. הם יודעים מה את **מסתכלת** עליו; הם לא יודעים מה **יש לך**, מה את באמת לובשת, ומה התאים לך בפועל. ארון פרטי ומתויג של המשתמשת אינו ad inventory — הוא נכס של המשתמשת, וכל ניסיון של Meta להפוך אותו לטרגוט פרסומי מתנגש חזיתית ב-privacy positioning שלהם. Lens הוא **stateless**: מזהה את הפריט, לא את ההתאמה *אלייך*. ה-WOW שלנו ("85% match לארון שלך") דורש state פר-משתמשת שאין להם ואין להם מסלול עסקי לבנות.

**מה כן להעתיק להם קל:** זיהוי פריט מתמונה. לכן זה לא החפיר שלנו — זה ה-commodity שאנחנו בונים מעליו.

### 2. Vinted / Depop — נזילות ה-resale

Vinted היא מכונה: ‏€813.4M הכנסות 2024, ‏€76.7M רווח נקי, שווי €5B בסקנדרי ([Vinted newsroom](https://company.vinted.com/newsroom/Vinted-delivers-strong-profitable-growth-while-investing), [FashionNetwork](https://us.fashionnetwork.com/news/Vinted-quadruples-profit-in-2024-as-revenue-climbs-to-813-4-million,1724908.html)). החפיר שלהם — liquidity — אמיתי ולא ניתן לתקיפה חזיתית. **ולכן אנחנו לא תוקפים אותו** (resale אצלנו = Phase 3, נעול).

**מה הם מבנית לא יכולים:** הם רואים את הפריט רק ברגע אחד — כשהוא **עוזב** את הארון. אין להם wardrobe graph, אין להם שימוש יומיומי, אין להם סיבת-פתיחה בבוקר. המנוע הכלכלי שלהם הוא take על טרנזקציה; ארון דיגיטלי + סטיילינג יומי הוא עבורם cost center שלא מאיץ אף עסקה בטווח הרבעון. להפוך מ"מקום למכור" ל"בית יומי לארון" זו היפוך זהות מוצרי מלא — ה-Depop-too-grungy positioning עובד נגדם אצל נועה.

**מה שאנחנו לוקחים מהם:** ברגע שהארון כבר דיגיטלי אצלנו, listing הוא קליק אחד (אפס צילום מחדש) — זו הדרך היחידה שבה עמלת 15% מעל שוק-שהתכנס-לאפס יכולה להחזיק (המתח הזה נותר שאלת מייסדות פתוחה מחידה 05 — לא נפתח כאן).

### 3. Whering / Indyx / Acloset — אפליקציות הארון. **המתחרה האמיתי.**

כאן הכנות הכי חשובה: **זו המחלקה המסוכנת, לא Meta.** Whering: ‏10M users, ‏~$14M גיוס מצטבר, וכסף טרי של eBay+Google לבניית AI ([Tech.eu](https://tech.eu/2026/07/07/whering-lands-7m-as-digital-wardrobe-platform-reaches-10m-users/)). ההנחה שלנו חייבת להיות ש**היא תוסיף AI scan תוך 6-12 חודשים.**

**מה בכל זאת חסר להם מבנית (היום):** (א) **הלולאה המלאה** — הם utility. אין feed shoppable, אין match% על פריט שראית בעולם, אין גשר סושיאל↔ארון↔קנייה. להוסיף רשת חברתית מעל utility זה בדיוק הקושי ההפוך משלנו — ולהם אין את ה-single-player-first playbook כי הבסיס שלהם כבר בנוי אחרת. (ב) **ledger התיקונים** — גם אם יוסיפו scan, per-user correction loop שמוזרק ל-inference הוא ארכיטקטורה, לא פיצ'ר; אצלנו הוא כבר בקוד. (ג) **מבנה עלויות** — הם צוות מגויס-הון קלאסי; אנחנו agentic — כל דולר אצלנו קונה יותר איטרציות.

**וידוי אדוורסרי מלא:** אף אחד מהשלושה אינו בלתי-עביר עבורם עם $7M ו-Google מאחור. היתרון שלנו מולם הוא **חלון של 12-18 חודשים + לולאה מלאה**, לא חומה. זו בדיוק הסיבה שהמסמך הזה ממליץ למכור למשקיע *מנגנון מצטבר + מהירות*, לא "בלתי אפשרי להעתיק".

### 4. StyleDNA / Alta / Daydream — סטייליסטיות AI

Alta: ‏$11M seed (Menlo Ventures, יוני 2025), closet+stylist, ‏4,000 brands ([TechCrunch](https://techcrunch.com/2025/06/16/alta-raises-11m-to-bring-clueless-fashion-tech-to-life-with-all-star-investors/)). Daydream (Julie Bornstein): ‏$50M seed, chat-based fashion search, ‏8,000 brands, affiliate model — בלי ארון בכלל ([TechCrunch](https://techcrunch.com/2024/06/20/former-stitch-fix-coo-julie-bornstein-secures-50m-to-build-a-new-age-e-commerce-search-engine/), [Fortune](https://fortune.com/2025/06/25/daydream-fashion-ai-shopping-agent-marketplace-julie-bornstein/)). StyleDNA גובה $7.99-19.99/חודש (teardown פנימי).

**מה הם מבנית לא יכולים:** Daydream היא search-first — אין לה מושג מה יש לך, רק מה ביקשת; ה-context שלה מתאפס בין שיחות. Alta היא הקרובה תזתית — אבל היא free-and-subsidized ($11M runway, לא מודל), premium-coded (LVMH, סטיליסטית של מישל אובמה) ולא בנויה כרשת Gen-Z. אף אחת מהן לא בנתה את הגשר **סושיאל→ארון→קנייה** שהוא ה-WOW שלנו — Daydream כי אין ארון, Alta כי אין סושיאל.

**מה זה כן מוכיח:** ‏$61M+ הון חכם זרם לתזה "הארון + AI הוא הדבר הבא" בתוך שנה. הקטגוריה מאומתת; השאלה היא רק מי סוגר את הלולאה קודם.

### 5. LTK / ShopMy — creator affiliate rails

LTK: ‏$6B+ GMV שנתי ([Sacra](https://sacra.com/c/shopmy/), מקורות חידה 05). הם הבעלים של מונטיזציית creators — **ולא של אף גרם מידע על הארון של הקונה.** הצרכנית אצלם היא אנונימית שמקליקה על לינק; אין לה profile, אין לה ארון, אין לה סיבה לחזור בלי ה-creator.

**מה הם מבנית לא יכולים:** להפוך לאפליקציית צרכנית עם ארון = לקנבל את ה-positioning כולו (הם מוכרים ל-creators נאמנות; צרכנית עם ארון עצמאי מחלישה את התלות ב-creator). אצלנו creator credits (5%, מודל A, נעול) הם שכבה מעל הארון — לא התחליף לו.

---

## שש מועמדויות החפיר — הביקורת האדוורסרית שמנסה להרוג כל אחת

### (a) Per-user labeled wardrobe data + HITL correction flywheel — **המנצח, בניסוח מתוקן**

**התזה:** כל scan → אישור/תיקון של המשתמשת → נשמר ב-ledger בבעלותנו → מוזרק לכל inference עתידי שלה → הסטייליסטית של *הפריט הבא* כבר מכירה את הארון, הגזרה והטעם שלה. "Every user trains her own stylist."

**הדוב החזק ביותר #1 — "Google Lens / GPT vision הפכו זיהוי ל-commodity":** נכון לחלוטין, ואנחנו מודים בזה מראש. ה-memo המודלף של Google אמר את זה על עצמם: "We Have No Moat" — המודל אינו החפיר ([SemiAnalysis](https://newsletter.semianalysis.com/p/google-we-have-no-moat-and-neither), [Simon Willison](https://simonwillison.net/2023/May/4/no-moat/)). **המסקנה עובדת לטובתנו:** מודל מושלם עדיין לא יודע מה יש בארון שלה, מה היא באמת לובשת, ומה החזירה. ה-context הוא הנכס, לא ה-capability. מודלים טובים יותר רק מוזילים את ה-COGS שלנו (חידה 05: ‏$0.25/MAU) ולא נוגעים בחפיר.

**הדוב החזק ביותר #2 — "per-user data moat חלש ב-N קטן":** נכון חלקית — וכאן ההבחנה שמצילה את הטענה. חפיר דאטה **אגרגטיבי** (fine-tuning dataset) באמת דורש מיליוני משתמשות ואסור למכור אותו היום. אבל חפיר **פר-משתמשת** לא תלוי ב-N הכולל — הוא תלוי ב-tenure שלה: הערך למשתמשת ה-500 זהה לערך למשתמשת ה-5,000,000, כי הוא נבנה מהתיקונים *שלה*. זה בדיוק מודל Spotify: ‏Taste Profile שנבנה משנות האזנה יוצר switching cost רגשי — churn נטו ~2% ([App Economy Insights](https://www.appeconomyinsights.com/p/spotify-the-wrapped-effect), [markhub24](https://www.markhub24.com/post/spotify-s-discover-weekly-how-personalization-became-a-competitive-moat)). והתקדים הישראלי: Waze — דאטה שנוצר משימוש, לא ממודל — נמכרה לגוגל ב-$1.1B כשגם Facebook ו-Apple התחרו עליה ([TechCrunch](https://techcrunch.com/2013/06/11/its-official-google-buys-waze-giving-a-social-data-boost-to-its-location-and-mapping-business/)).

**הדוב #3 — "אין הוכחה שהתיקונים משפרים בפועל":** הוגן. המנגנון shipped; ה**אפקט** טרם נמדד. לכן זה נכנס ל-falsifiables (למטה) ולא נטען בפגישה כעובדה מדודה.

**ורדיקט: חפיר אמיתי — בתנאי שמוכרים אותו כ-per-user compounding context + switching cost, לא כ-"proprietary dataset".** מחזיק גם מול מתחרה אינסופי, כי המתחרה מתחיל מאפס *אצל כל משתמשת* גם אם העתיק את כל הקוד.

### (b) Network effects (feed / marketplace liquidity)

**דוב: "אין לכם רשת".** נכון. ‏0 network effects היום; חידה 02 בכוונה בנתה wedge single-player עם שכבת רשת דקה. **ורדיקט: לא לטעון היום. זה חפיר-היעד של M12-M18** — feed שממיר + one-click resale listings מהארון (היצע שאין לאף מרקטפלייס: הפריט כבר מצולם, מתויג ומתומחר). מי שמוכר network effects בלי רשת נשרף ב-diligence.

### (c) Switching costs — הארון-כנכס

**דוב: "אותו scan שמייבא ארון מ-Whering בשעה — מייבא גם את הארון שלכם החוצה".** נכון לגבי **התמונות**. לא נכון לגבי **ההיסטוריה**: תיקונים, wear-data, רכישות מיוחסות, לוקים שנשמרו — את אלה אי אפשר לצלם מחדש. **ורדיקט: תקף, אבל הוא לא חפיר עצמאי — הוא התוצאה של (a).** למכור אותם ביחד כטענה אחת.

### (d) Supply / brand partnerships

**דוב: ל-Daydream ‏8,000 brands, ל-Phia ‏6,200, ל-Alta ‏4,000 — תוך חודשים.** אין תשובה. Affiliate supply הוא commodity מוחלט. **ורדיקט: נפסל כחפיר. לא להזכיר כבידול לעולם.**

### (e) Agentic cost structure

**דוב: "כל סטארטאפ ב-2026 הוא AI-native; זה יתרון של 18 חודשים, לא חפיר".** מסכים חלקית — זה לא חפיר (ניתן להעתקה עקרונית), אבל זה **מכפיל מהירות** בדיוק בחלון שבו המרוץ מול Whering מוכרע: יותר איטרציות לדולר, ‏$70-80K שמתפקדים כ-$2M. **ורדיקט: למכור כ-unfair advantage / execution speed — לא בתווית "Moat".** (השלכה ל-deck — ראו "מתחים" למטה.)

### (f) Brand / community

**דוב: אפס brand equity היום.** נכון. Depop הוכיחה שקהילה היא חפיר אמיתי בקטגוריה — אחרי שנים. **ורדיקט: אופציה ל-M24+, לא לטעון.**

### הדירוג הסופי

| # | חפיר | סטטוס | מתי טוענים |
|---|---|---|---|
| 1 | **(a)+(c) Per-user correction ledger + closet-as-asset** | מנגנון shipped בקוד; אפקט למדידה | **עכשיו — הטענה המרכזית** |
| 2 | (e) Agentic execution speed | פועל ומוכח (המוצר עצמו) | עכשיו — כ-advantage, לא moat |
| 3 | (b) Network effects + one-click resale supply | יעד M12-M18 | כ-roadmap בלבד |
| 4 | (f) Brand/community | M24+ | לא בפגישה |
| — | (d) Brand partnerships | commodity | לעולם לא |

---

## ההמלצה החותכת — The Correction Ledger Moat

**התזה למשקיע במשפט אחד:** *הזיהוי הוא commodity — ההקשר הוא החפיר. כל תיקון של המשתמשת הוא training signal בבעלותנו שמוזרק לכל inference עתידי שלה; המוצר משתפר עבורה עם כל שימוש, ולעזוב = למחוק את הזיכרון של הסטייליסטית שלך. המנגנון הזה כבר רץ בקוד — לא בעתיד, היום.*

**למה זו הטענה הנכונה:** (1) היא שורדת את שלושת הדובים החזקים כי היא לא תלויה ב-N, לא תלויה בעליונות מודל, ומגובה בתקדימי Spotify/Waze; (2) היא מגובה ב-shipped code — `scan_corrections` + הזרקה ל-`/api/analyze` — מה שאף מתחרה בגודלנו לא יכול להראות; (3) היא מתחברת ישר ל-WOW המוצרי (match% מדויק יותר ככל שמתקנים) — החפיר *הוא* חוויית המוצר, לא שקף נפרד.

**רצף החפירים בזמן (למכור כ-סיפור, לא כהבטחה):** Phase 1 — personal context moat (עכשיו, בקוד) → Phase 2 — intent graph (רכישות מיוחסות מעשירות את ה-ledger) → Phase 3 — network effects: feed + one-click resale supply מהארונות המתויגים → Phase 4 — brand. אותו closet-graph שמזין את ארבעת מנועי ההכנסה (חידה 05) מזין גם את ארבעת שלבי החפיר. **זו הסימטריה שסוגרת את ה-thesis.**

**חלופות מדורגות:**
1. Correction-Ledger-first כמתואר — **מומלץ.**
2. להוביל עם "agentic company" כ-moat ראשי — נדחה: זה ה-wow התפעולי אבל לא defensibility; משקיע מתוחכם יפרק את זה ("כולם agentic עכשיו").
3. להוביל עם network-effects-roadmap — נדחה: מוכר עתיד במקום הווה, בדיוק מה שחידה 02 נבנתה למנוע.
4. Data-asset-for-AI-training narrative ("נמכור את הדאטה") — **נפסל בתוקף**: מת ב-diligence (N קטן), מסוכן privacy-wise, ומזהם את יחסי האמון עם המשתמשות.

---

## נרטיב הגיוס — מה טוענים, מה לא, ומה עונים

### מה טוענים (defensible)
- "מנוע הזיהוי משתפר פר-משתמשת מכל תיקון — והלולאה הזו **כבר רצה בצד השרת** (ה-UI בפיתוח)."
- "הענקים נסוגו מ-commerce ‏(Instagram ‏2023); הקטגוריה שלנו מגויסת בטירוף — Whering ‏$7M מ-eBay+Google לפני שבוע, Alta ‏$11M, Daydream ‏$50M — ואף אחד לא סגר את הלולאה סושיאל↔ארון↔קנייה."
- "החפיר גדל עם ה-tenure של כל משתמשת, לא עם ה-N הכולל — לכן הוא רלוונטי כבר ב-500 בטא, ומדיד" (מדדי falsifiability למטה).
- "Switching cost = ההיסטוריה, לא התמונות: תיקונים, wear-data, רכישות — אי אפשר לסרוק אותם מחדש אצל מתחרה."

### מה לא טוענים (מת ב-diligence)
- ❌ "יש לנו dataset קנייני בעל ערך אימון" — ב-N הנוכחי זו הגזמה שתישבר.
- ❌ "אי אפשר להעתיק את הזיהוי שלנו" — Lens עושה 20B/חודש; הזיהוי commodity.
- ❌ "יש לנו network effects" — אין. Roadmap בלבד.
- ❌ "brand partnerships כבידול" — commodity אצל כולם.
- ❌ כל שריד של $11/user/month — נקבר בחידה 05, נשאר קבור.

### שלוש השאלות הקשות + התשובות המוכנות

**Q1: "Whering עם 10M users והכסף של Google תשיק scan תוך שני קוורטרים. למה אתן?"**
A: "נכון, והם יעשו את זה — הגיוס שלהם הוא הוולידציה הכי טובה שקיבלנו. אבל scan הוא הפיצ'ר; החפיר הוא הלולאה: תיקון→ledger→הזרקה ל-inference→match% על כל פריט ב-feed→קנייה מיוחסת שמעשירה את ה-ledger. הם utility שצריך לבנות רשת ומסחר מעל בסיס קיים של 10M הרגלים אחרים; אנחנו בנינו את הלולאה המלאה מהיום הראשון, במבנה עלויות שנותן פי-כמה איטרציות לדולר. במרוץ של 12-18 חודשים, מהירות הלמידה היא ההגנה — ואת שלנו רואים בקצב ה-shipping של האב-טיפוס."

**Q2: "מודל vision הבא יהיה מושלם — אז דאטת התיקונים שלכן שווה אפס?"**
A: "להפך. מודל מושלם עדיין לא יודע מה יש בארון שלה, מה מהארון היא באמת לובשת, מה החזירה ולמה. אנחנו לא מתחרים ב-capability — אנחנו הבעלים של ה-context. ככל שהמודלים משתפרים, ה-COGS שלנו יורד (היום ~$0.25/MAU) והחפיר לא זז, כי הוא בנתונים שרק המשתמשת שלנו ייצרה. גוגל עצמה כתבה ב-memo המפורסם: המודל אינו החפיר."

**Q3: "עם 500 משתמשות בטא — איזה חפיר יש לכן בכלל היום?"**
A: "היום יש לנו מנגנון, לא נכס — ואנחנו הראשונים שנגיד את זה. אבל המנגנון shipped בקוד ומדיד: תוך 90 יום נראה אם דיוק ה-scan של משתמשת ותיקה עולה על של משתמשת חדשה, ואם retention של מי שתיקנה ≥5 פריטים גבוה משמעותית. אם כן — כל משתמשת חדשה שהכסף שלך מביא נכנסת למכונה שממירה שימוש ל-defensibility. גם Waze התחילה כמנגנון איסוף בלי דאטה — הדאטה הגיע עם המשתמשים, והמנגנון הוא ששווה היה $1.1B."

---

## מה חייב להיות נכון (falsifiable, למדידה ב-cohort הראשון)

1. **Correction engagement:** ‏≥40% מה-scans מקבלות אישור/תיקון במסך "צדקנו?" (ברגע שה-UI עולה). מתחת ל-20% — הלולאה לא נסגרת בפועל והטענה נחלשת.
2. **Tenure accuracy delta:** דיוק זיהוי (שיעור שדות ללא תיקון) של משתמשות עם ≥10 תיקונים היסטוריים גבוה מדיד ממשתמשות חדשות. זו ההוכחה שההזרקה עובדת — המדד החשוב ביותר במסמך הזה.
3. **Correction→retention link:** ‏D30 של משתמשות עם ≥5 תיקונים גבוה פי ≥1.5 מכאלה עם 0 (מבסס את טענת ה-switching cost).
4. **מסך "צדקנו?" ב-UI חי לפני הפגישה** — אחרת הטענה נשארת "backend רץ, UI בפיתוח" (עדיין כנה, פחות חזקה בדמו).

---

## מתחים מול ה-deck הקיים (לתיקון לפני הפגישה — דורש אישור Carmel)

1. **Slide 3, "Moat #2 — חברה אגנטית":** האנליזה כאן קובעת שזה execution advantage, לא moat (ניתן להעתקה עקרונית — ומשקיע חד יגיד זאת ראשון). כותרת השקף "The Unfair Advantage" כבר נכונה — ההמלצה: לשנות את התיוג הפנימי מ-"Moat #2" ל-"Advantage #2", ולהשאיר את הכוח של הטענה במקום שבו היא בלתי מנוצחת: המוצר עצמו נבנה כך.
2. **Slide 3 speaker note, "דאטה שאי אפשר לגרד או לקנות":** נכון per-user, אבל בניסוח הנוכחי נשמע כמו aggregate-dataset claim שנשבר ב-N קטן. להחליף ל-framing של המסמך הזה: "החפיר גדל עם ה-tenure של כל משתמשת, לא עם מספר המשתמשות".
3. **Slide 3 עדכון חיובי:** אפשר ומומלץ להוסיף "המנגנון רץ בקוד היום (server-side)" — ב-2026-07-12 זה עוד היה אספירציה; מ-2026-07-15 זה עובדה. נשאר כפוף לכלל הכנות של Slide 8: מסך האישור עצמו לא מוצג כ-shipped עד שהוא חי.
4. **חדש ל-appendix הסיכונים:** להוסיף שורה "Whering + Google money" עם המיטיגציה (לולאה מלאה + מהירות) — עדיף שאנחנו נעלה את זה לפני שהמשקיע מגגל "wardrobe app".

---

## מה צריך מקרמל

1. **[קריטי — לפני הפגישה]** אישור שלושת תיקוני ה-deck (מתחים 1-3) + תוספת סיכון Whering (מתח 4). שעה עבודה, מציל את Slide 3 מ-diligence.
2. **[קריטי — מוצר]** תיעדוף מסך "צדקנו?" ל-live לפני הפגישה (falsifiable #4) — הדמו של החפיר תלוי בו.
3. **[החלטה]** האם לנקוב בשם Whering ובגיוס שלה בפגישה. המלצתי: **כן, יזום** — זה ממסגר אותנו כמי שמכירות את השוק לעומק והופך איום לוולידציה.

---

## מקורות

- [TechCrunch — Instagram is killing live shopping](https://techcrunch.com/2023/02/14/instagram-is-killing-live-shopping-in-march-will-focus-on-ads-instead/) · [Retail Dive — Instagram sunsets live shopping](https://www.retaildive.com/news/instagram-sunsets-live-shopping-social-commerce-retreat/642841/) · [Retail Dive — Shop tab removal](https://www.retaildive.com/news/instagram-meta-remove-shopping-tab/640040/) — נסיגת הענקים מ-social commerce ‏2023.
- [Google blog — Lens + AI Overviews for marketers](https://blog.google/products/ads-commerce/google-lens-ai-overviews-ads-marketers/) — ‏~20B חיפושי Lens/חודש, ~20% shopping.
- [WWD — Whering raises $7M led by eBay Ventures, Google AI Futures](https://wwd.com/business-news/technology/whering-styling-app-investment-ebay-google-ai-futures-1239053470/) · [Tech.eu — Whering at 10M users](https://tech.eu/2026/07/07/whering-lands-7m-as-digital-wardrobe-platform-reaches-10m-users/) — 2026-07-07.
- [Vinted newsroom — 2024 results](https://company.vinted.com/newsroom/Vinted-delivers-strong-profitable-growth-while-investing) · [FashionNetwork — Vinted quadruples profit](https://us.fashionnetwork.com/news/Vinted-quadruples-profit-in-2024-as-revenue-climbs-to-813-4-million,1724908.html) — ‏€813.4M revenue, ‏€76.7M profit, ‏€5B valuation.
- [TechCrunch — Alta raises $11M](https://techcrunch.com/2025/06/16/alta-raises-11m-to-bring-clueless-fashion-tech-to-life-with-all-star-investors/) · [Menlo Ventures — why we backed Alta](https://menlovc.com/perspective/agentic-styling-and-shopping-why-were-backing-alta/) — ‏4,000 brands.
- [TechCrunch — Daydream $50M seed](https://techcrunch.com/2024/06/20/former-stitch-fix-coo-julie-bornstein-secures-50m-to-build-a-new-age-e-commerce-search-engine/) · [Fortune — Daydream launch](https://fortune.com/2025/06/25/daydream-fashion-ai-shopping-agent-marketplace-julie-bornstein/) — ‏8,000 brands, affiliate model, אין ארון.
- [SemiAnalysis — "We Have No Moat" leaked Google memo](https://newsletter.semianalysis.com/p/google-we-have-no-moat-and-neither) · [Simon Willison — no moat](https://simonwillison.net/2023/May/4/no-moat/) — המודל אינו החפיר.
- [TechCrunch — Google buys Waze $1.1B](https://techcrunch.com/2013/06/11/its-official-google-buys-waze-giving-a-social-data-boost-to-its-location-and-mapping-business/) — תקדים data-from-usage.
- [App Economy Insights — Spotify: The Wrapped Effect](https://www.appeconomyinsights.com/p/spotify-the-wrapped-effect) · [markhub24 — Discover Weekly as moat](https://www.markhub24.com/post/spotify-s-discover-weekly-how-personalization-became-a-competitive-moat) — taste profile ⇒ churn ~2%, switching cost רגשי.
- [Sacra — ShopMy](https://sacra.com/c/shopmy/) — LTK ‏$6B+ GMV (מקורות חידה 05).
- פנימיים: `app.py` (scan_corrections ledger + הזרקה ל-`/api/analyze`, shipped 2026-07-15) · `.claude/master/strategy/05-unit-economics.md` · `02-distribution-cold-start.md` · `docs/PITCH_DECK.md` · teardowns ‏`docs/research/2026-07-05-*`.

---

**סטטוס: דורש אישור מייסדות על תיקוני Slide 3 + תיעדוף מסך "צדקנו?".** אף החלטה נעולה לא נפתחה; המתח סביב עמלת ה-resale ‏15% נשאר אצל חידה 05. הטענה המרכזית מגובה בקוד רץ ובארבעה מדדי falsifiability — זה חפיר שאפשר להגן עליו בחדר, כי הוא לא מבטיח קסם, הוא מראה מכונה.
