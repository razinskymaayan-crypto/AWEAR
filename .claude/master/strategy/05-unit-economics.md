# חידה: כלכלת יחידה ורווחיות — המנוע הכלכלי האמיתי

מסמך החלטה למייסדות (Carmel). מונחים טכניים באנגלית בכוונה.
תאריך: 2026-07-06 · מחבר: Tobi (Head of Commerce & Unit Economics)

בונה על החלטות נעולות: עמלת resale ‏15% · resale suggestion ‏50% · affiliate day-1 · קרדיטים מודל A (מתוך העמלה, cap ‏≤50%) · hybrid מדורג מחידה 01 · wedge = single-player scan מחידה 02.

---

## מה השאלה בדיוק

מהו המנוע הכלכלי האמיתי של AWEAR בקנה מידה של מוביל קטגוריה — ו**האם כלכלת היחידה נסגרת**:
1. כמה AWEAR באמת מרוויחה על משתמש פעיל (contribution per user), אחרי קרדיטים, אחרי reversals, אחרי עלויות Claude API.
2. כמה עולה להביא משתמש (CAC) בכל ערוץ, ומה ה-LTV הריאלי בעקומות retention אמיתיות.
3. **האם המספרים ב-MASTER_PLAN חלק ז׳ (contribution ~$11/user/month, GM ~85%, LTV/CAC >4x, M18 ~$800K ARR) שורדים מגע עם benchmarks אמיתיים** — כי משקיע יבדוק בדיוק את זה ב-diligence.

Spoiler חד: חלק מהמספרים שורדים, חלק לא. המסמך נותן את המודל המתוקן שאפשר להגן עליו.

---

## למה קריטי עכשיו

- **פגישת משקיע בעוד 2-4 שבועות.** ה-deck כרגע טוען ~$11 contribution/user/month. משקיע שעושה את החשבון הפשוט (attach rate × AOV × affiliate rate) יגיע למספר אחר בסדר גודל — ועדיף שאנחנו נתקן לפני שהוא מגלה. deck עם מספר לא-ניתן-להגנה שורף אמון על **כל** שאר המספרים.
- הקרדיטים כבר נעולים (מודל A + cap). עכשיו צריך לדעת מה הם עושים ל-margin בפועל.
- החלטות תקציב ($18K שיווק מתוך $70-80K) תלויות ישירות בשאלה האם paid CAC אי-פעם מחזיר את עצמו. תשובה: בשלב ה-affiliate — לא. זה משנה איך מוציאים את הכסף.

---

## המנועים המועמדים — 5 אלטרנטיבות, כל אחת עם מספרים

### מנוע A — Affiliate take-rate (המצב הנוכחי, day-1)

**איך מרוויחים:** המשתמש קונה אצל הקמעונאי דרך tracked link; אנחנו מקבלים commission מהרשת.

**המספרים האמיתיים (לא 15%):**
- שיעורי אופנה בפועל: H&M ‏7-10.5%, Zappos ‏7% (cookie ‏14 יום), Lululemon ‏7-10% (cookie ‏30 יום), Net-A-Porter עד 10%, PrettyLittleThing עד 15% ([Lasso — fashion affiliate programs](https://getlasso.co/niche/fashion/), [Shopify best affiliate programs](https://www.shopify.com/blog/best-affiliate-programs)). **Blended ריאלי: ~8%** (fast-fashion נמוך, premium גבוה) — תואם את התיקון שכבר ננעל בחידה 01 (5-12%).
- **Reversals:** שיעור החזרות באופנה אונליין = 25-40% ([3DLOOK fashion conversion](https://3dlook.ai/content-hub/average-conversion-rate-for-fashion-ecommerce/), [UniformMarket](https://www.uniformmarket.com/statistics/ecommerce-fashion-insights-trends)). commission על עסקה שהוחזרה מתבטל. **נטו אפקטיבי: ~5.8% מה-GMV.**
- AOV אופנה: ממוצע תעשייה $183-196 ב-Americas ([DynamicYield benchmarks](https://marketing.dynamicyield.com/benchmarks/average-order-value/), [Speed Commerce](https://www.speedcommerce.com/insights/e-commerce-average-order-value-e-commerce-benchmarks/)) — אבל הקהל שלנו (נועה, 16-25, fast-fashion-heavy) ריאלי יותר סביב **$70-90 להזמנה**.

**דוגמה עסקה — הזמנת $85:**
$85 × 8% = $6.80 gross → אחרי reversals (27%) = **$4.96** → קרדיטים (40% מהעמלה, מתחת ל-cap) = −$1.98 → **נטו ל-AWEAR: ~$2.98 להזמנה מיוחסת.**

**Validation חיצוני:** Phia — affiliate-only טהור — גייסה $35M Series A בשווי ~$185M עם "מאות אלפי MAU" ו-6,200 retail partners ([TechCrunch, ינואר 2026](https://techcrunch.com/2026/01/27/phoebe-gates-and-sophia-kiannis-phia-raises-35m-to-make-shopping-fun-again/); teardown פנימי: `docs/research/2026-07-05-phia-buy-to-source-teardown.md`). המודל **fundable** — אבל שימי לב: גם Phia לא הראתה רווח, רק "11x revenue growth".

**ביקורת אדוורסרית — מה הורג את זה בסקייל:**
1. **Attribution leakage.** מעבר app→browser→checkout מאבד tracking ב-20-50% מהמקרים (ITP של Safari, cookies נחסמים, משתמש שסוגר וקונה אחר-כך ישירות). כל conversion שלא יוחס = הכנסה שעבדנו בשבילה ולא קיבלנו.
2. **אין לנו כוח תמחור.** הרשת והקמעונאי קובעים את ה-rate; הם יכולים לחתוך אותו מחר (Amazon עשתה זאת היסטורית לכל ה-affiliates שלה).
3. **התקרה המתמטית:** כדי להגיע ל-$11/user/month במנוע הזה, כל MAU צריך לקנות **~$2,300/שנה** דרך AWEAR. לא קיים. affiliate הוא מנוע הוכחת-intent, לא מנוע סקייל.

### מנוע B — P2P resale take-rate (15%, post-raise per חידה 01)

**המספרים האמיתיים של השוק — והם לא נוחים:**
- **Poshmark: ‏20% take rate** ($2.95 flat מתחת ל-$15) ([Poshmark support](https://support.poshmark.com/s/article/297755057?language=en_US)) — ולמרות ה-take הגבוה בענף, לא הגיעה לרווחיות עקבית ונמכרה ל-Naver ב-$1.2B, מתחת לשווי ה-IPO ([CNBC](https://www.cnbc.com/2022/10/03/south-koreas-naver-to-buy-us-e-retailer-poshmark-for-1point2-billion.html)).
- **Depop: ביטלה את עמלת ה-10% למוכרים ב-US/UK** — נשאר רק processing ‏3.3%+$0.45 ([Depop newsroom](https://news.depop.com/company-news/depop-removes-selling-fees-in-the-united-states-evolves-fee-structure/)). כלומר: seller-side take rate בשוק שלנו נמצא ב-**race to zero**.
- **Vinted: המודל שניצח** — ‏0% למוכרת; הקונה משלמת Buyer Protection של ~5% + ~€0.70 ([Vinted help](https://www.vinted.com/help/342-buyer-protection-fee-on-vinted)). רווח ראשון אי-פעם רק ב-2023: €596.3M הכנסות → **€17.8M רווח נקי (~3% net margin)** ([Vinted newsroom](https://company.vinted.com/newsroom/vinted-reaches-profitability), [Sifted](https://sifted.eu/articles/vinted-startup-lithuania-profit-news)).

**דוגמה עסקה — פריט resale ב-$40 (‏50% ממחיר מקורי $80):**
עמלת 15% = $6.00 → קרדיטים (cap 50%) עד −$3.00 → processing ~‎−$1.75 → shipping-support/disputes ~‎−$0.50 → **נטו: $0.75-3.25 לעסקה.** עובד — אבל רק אם המוכרות מוכנות לשלם 15% כשבצד השני Depop גובה 0% ו-Vinted גובה 0%.

**ביקורת אדוורסרית:**
1. **ה-15% שלנו הוא מעל-שוק ב-2026.** מוכרת רציונלית עם פריט שווה תעלה אותו ל-Vinted (0%) ולא ל-AWEAR (15%). ה-hook היחיד שמצדיק premium: הפריט **כבר בארון הדיגיטלי** — listing בקליק אחד, אפס צילום מחדש. זה חפיר אמיתי אבל צריך לבדוק כמה הוא שווה בעמלה. ⚠️ **מתח מול החלטה נעולה — שאלת מייסדות, לא מחליטים כאן.**
2. חסם Stripe-Connect-ישראל (חידה 01) — לא רץ לפני פתרון payout. נעול post-raise.
3. הלקח מ-Vinted: רווחיות ב-P2P resale מגיעה רק בסקייל ענק ובמרווח דק. זה מנוע volume, לא מנוע margin.

### מנוע C — Dropshipping / 1P margin (שלב 2-3 במאסטר-פלאן)

**איך מרוויחים:** קונים מהספק ב-wholesale, מוכרים לצרכן; margin ‏20-40% במקום commission ‏8%.
**דוגמה:** פריט שנמכר ב-$60, עלות ספק $40 → $20 gross (33%) → אחרי processing (~$2), החזרות (25-40% באופנה — כל החזרה מוחקת את הרווח של ~2 מכירות), customer support, chargebacks → **נטו ריאלי $6-10 לפריט.** פי 2-3 מ-affiliate לאותה מכירה.

**ביקורת אדוורסרית:**
1. אנחנו הופכים ל-MoR מלא: sales tax nexus, EU VAT deemed-seller, chargebacks, refunds (הטבלה המלאה בחידה 01). לחברה ישראלית pre-seed — לא לפני גיוס + ישות מתאימה.
2. שיעור ההחזרות באופנה (25-40%) הוא רוצח המרווח האמיתי של המנוע הזה; מי שלא בנה reverse-logistics מפסיד על כל החזרה פעמיים.
3. dropshipping ג'נרי (Spocket/Zendrop) = מוצרים שכולם מוכרים = תחרות מחיר טהורה. עובד רק על קטגוריות שבהן ה-data שלנו יודע מה יימכר (מנוע ה-match הוא היתרון, לא הלוגיסטיקה).

### מנוע D — Ads / sponsored placement (מודל Pinterest)

**התקרה הידועה:** Pinterest ARPU שנתי — **גלובלי $7.21, ‏US+Canada ‏$30.84, אירופה ~$4.24** ([Pinterest FY2025 filings](https://www.sec.gov/Archives/edgar/data/0001506293/000150629325000228/q3-25xpressrelease.htm), [RecurPost stats](https://recurpost.com/blog/pinterest-statistics/)). Meta family-of-apps: ‏$57 ([stockdividendscreener](https://stockdividendscreener.com/information-technology/comparison-of-average-revenue-per-user-for-social-media-companies/)).

**ביקורת אדוורסרית:** ARPU של $7/שנה גלובלי = **$0.60/user/month** — וזה אחרי שבנית מערך מכירות ads, מיליוני MAU, ו-brand safety. מתחת ל-5-10M MAU המנוע הזה לא קיים כלכלית. הוא שלב 4, לא תשובה לגיוס הנוכחי. הערך שלו למסמך: הוא ה-**benchmark שמוכיח כמה $11/user/month היה שאפתני** — פי 18 מ-Pinterest הגלובלית.

### מנוע E — Premium subscription (AI stylist כ-tier בתשלום)

**ההוכחה שהקטגוריה משלמת — מה-teardowns הפנימיים שלנו:**
- **StyleDNA: ‏$7.99-19.99/חודש**, ‏4.3★ על 7.3K דירוגים — freemium שנחסם לפי מספר פריטים בארון (`docs/research/2026-07-05-alta-styledna-teardown.md`).
- **Whering: ~£4.99/חודש** מדווח (לא מאומת רשמית; `docs/research/2026-07-05-whering-teardown.md`), 9M+ משתמשות.
- Alta חינמית — אבל מסובסדת ב-$11M seed; זה לא מודל, זה runway.

**דוגמה:** ‏AWEAR Pro ב-$5.99/חודש (unlimited scans, unlimited AI looks, packing lists, price-drop alerts). אחרי app-store cut ‏15% (small-business tier) = **$5.09 נטו/חודש למנוי.** בשיעור המרה freemium טיפוסי 3-5%: תוספת של **$0.15-0.25 per MAU/month** — אבל היופי: המנויות הן בדיוק ה-power users שצורכות הכי הרבה Claude API, כלומר **ה-subscription מממן את ה-COGS של כל המערכת.**

**ביקורת אדוורסרית:** paywall מוקדם מדי הורג את ה-viral loop (ה-scan הוא ה-wedge — לחסום אותו = להרוג את חידה 02). לכן: ה-scan הראשוני לעולם חינם; משלמים על עומק (unlimited + פיצ'רים כבדים). וסיכון שני: Alta החינמית מחנכת את השוק שסטיילינג AI = חינם.

---

## THE NUMBERS — המודל המלא, בכנות

### טבלת הנחות (Phase 1, affiliate + credits, M1-M12)

| הנחה | ערך | מקור/נימוק |
|---|---|---|
| Blended affiliate rate | 8% | טווח אמיתי 7-10.5% fashion (מקורות במנוע A) |
| Reversal rate | 27% | החזרות אופנה 25-40% |
| נטו אפקטיבי מ-GMV | ~5.8% | ‎8% × 0.73 |
| AOV (קהל Gen-Z) | $85 | ממוצע תעשייה $183 מוטה premium; הקהל שלנו fast-fashion |
| משתמשות שמבצעות רכישה מיוחסת בחודש | 6.5% מה-MAU | shopping-app conversion ‏2-3% × uplift מ-intent גבוה (closet-match) — הנחה אופטימית-סבירה, לבדיקה ב-cohort הראשון |
| רכישות מיוחסות/רוכשת/חודש | 1.2 | תדירות קניה + attribution loss |
| קרדיטים | 40% מהעמלה נטו | מתחת ל-cap הנעול (≤50%) |
| Claude API / MAU / חודש | $0.25 | scan פריט ב-Haiku ‏4.5 ($1/$5 per M tokens): ‏~1.6K image tokens + prompt ≈ $0.004/פריט; look-gen ב-Sonnet ($3/$15) ≈ $0.02; ‏~20 scans חודש ראשון ואז דעיכה + caching ([Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing)) |
| Infra (hosting/CDN/DB) / MAU / חודש | $0.03 | סטנדרטי בשלב הזה |
| D30 retention target | 12% | פי 2.5 מנורמת shopping ‏(4.8-5%, [Adjust](https://www.adjust.com/blog/shopping-app-trends/), [UXCam benchmarks](https://uxcam.com/blog/mobile-app-retention-benchmarks/)) בזכות utility hook; המספר "68% ל-AI apps" ממקורות שיווקיים — לא מתכננים עליו |
| Churn חודשי (מפעילות) | 15% | ⇒ אורך חיים ממוצע ~6.7 חודשים |

### Contribution לכל 1,000 MAU בחודש (Phase 1)

| שורה | חישוב | $ |
|---|---|---|
| GMV מיוחס | 65 רוכשות × 1.2 × $85 | $6,630 |
| Commission gross ‏(8%) | | $530 |
| אחרי reversals ‏(−27%) | | $387 |
| קרדיטים (−40%) | | −$155 |
| **הכנסה נטו** | | **$232** |
| Claude API | 1,000 × $0.25 | −$250 |
| Infra | 1,000 × $0.03 | −$30 |
| **Contribution** | | **≈ −$48** |

### הוורדיקט מול MASTER_PLAN חלק ז׳ — שורה שורה

| טענת ה-plan | שורד diligence? | המספר הכן |
|---|---|---|
| Contribution ~$11/user/month | **לא. סטייה של פי ~20-40.** דורש $2,300 GMV שנתי מיוחס לכל MAU | **$0.20-0.40 revenue/MAU/month ב-Phase 1; contribution ‏≈ 0± עד שמוסיפים Pro.** ‏$11 נכון רק כ-contribution per **transacting** user ($2.98/הזמנה × ~3.7 הזמנות) — לשנות את ה-framing ב-deck, לא רק את המספר |
| Gross margin ~85% | **כן, בערך נכון** — הכנסת affiliate היא כמעט margin טהור; אבל חסר-משמעות כשה-revenue קטן מה-API COGS. להציג GM יחד עם contribution, לא לבד | GM ‏~80-90% על ההכנסה; contribution חיובי רק מ-attach ‏>8% או עם Pro tier |
| CAC אורגני $3-7 | **כן** — founder-led + viral card + barter credits; עקבי עם חידה 02 | לשמור. אבל **paid CAC = $20-50** למשתמשת פעילה (CPI ‏$2.5-6.2 בצפון-אמריקה ([Mapendo](https://mapendo.co/blog/cost-per-install-2025-the-ultimate-report-to-grow-your-app-worldwide), [Insert Affiliate](https://insertaffiliate.com/blog/mobile-app-user-acquisition-cost-benchmarks/)) ÷ activation ‏~40% ÷ retention) — **אסור לקנות משתמשות בשלב ה-affiliate** |
| LTV/CAC >4x | **לא ב-Phase 1.** LTV affiliate-only ≈ $2-4 (6.7 חודשים × $0.3-0.6) מול CAC אורגני $3-7 ⇒ ‏0.5-1.3x | ‏>4x מושג רק במנוע המדורג: LTV משולב $8-15 (affiliate + Pro) מול CAC אורגני ~$3 ⇒ ‏**2.5-5x** — אפשרי, בתנאי שה-Pro מומר ב-3%+ |
| M18 ~$800K ARR | **לא במסלול הנוכחי.** דורש ~$67K MRR = ‏~70-100K MAU במספרים כנים (מול 7,000 מתוכנן ב-M12) | תחזית ניתנת-להגנה: M12 ‏~10-15K MAU × $0.5-0.9 blended ⇒ ‏$60-160K ARR run-rate; ‏$800K הוא תרחיש upside עם Pro+resale חיים, לא base case |

**השורה התחתונה למשקיע:** לא מוכרים "אנחנו רווחיים per-user היום". מוכרים: (1) intent-graph שממיר פי 2-3 מ-shopping app רגיל, (2) קרדיטים רווחיים by construction (מודל A + cap — מתמטית אי אפשר להפסיד על עסקה), (3) מסלול מדורג שכל שלב בו מוכח ע"י שחקן אמיתי בשוק (Phia/StyleDNA/Vinted), (4) COGS משתנה נמוך ($0.28/MAU) שיורד עם caching. זה סיפור שגם שורד diligence וגם טוב יותר מהסיפור הנוכחי.

---

## ההמלצה החותכת — The Staged Revenue Engine

**מנוע אחד לא סוגר את הכלכלה. ארבעה שלבים מדורגים כן — וכל שלב מוכח ע"י comp אמיתי בשוק:**

- **Phase 1 (עכשיו → גיוס): Affiliate + credits — מנוע הוכחת-intent, לא מנוע רווח.** מטרתו metrics: attach rate, K-factor, D30. יעד: attach ‏≥5%, ‏D30 ‏≥10%. ‏CAC אורגני בלבד; אפס paid. (Comp: Phia — fundable ב-$185M על המודל הזה בדיוק.)
- **Phase 2 (post-raise, M6-M12): AWEAR Pro ‏$5.99/mo — מנוע ה-margin הראשון.** scan ראשוני לעולם חינם (מגן על ה-wedge); Pro = unlimited + פיצ'רים כבדי-API. ‏3-5% conversion הופך את ה-contribution לחיובי מבנית: המנויות מממנות את ה-COGS של כולן. (Comp: StyleDNA גובה $7.99-19.99 בהצלחה.)
- **Phase 3 (post-raise + payout solution): P2P resale + dropshipping סלקטיבי — מנוע ה-GMV.** ‏resale רק אחרי פתרון חסם Stripe-ישראל (חידה 01), עם עיון מחדש במבנה ה-15% מול שוק שהתכנס ל-buyer-pays (שאלת מייסדות למטה). dropshipping רק בקטגוריות שה-match-data שלנו מוכיח בהן demand. (Comps: Vinted — רווחית; Poshmark — האזהרה.)
- **Phase 4 (‏5M+ MAU): Sponsored placement — מנוע ה-ARPU האינקרמנטלי.** ‏$0.5-2/user/year בהתחלה, תקרת Pinterest ‏$7-30. לא לפני סקייל.

**למה זה הסידור הנכון:** כל שלב מממן ומוכיח את הבא; אף שלב לא דורש להיות MoR לפני שיש ישות וצוות; הקרדיטים (מודל A) נשארים רווחיים בכל שלב by construction; וה-deck מספר סיפור שכל מרכיב בו כבר עובד אצל מישהו — רק לא ביחד. **היחד הוא ה-thesis: אותו closet-graph מזין את כל ארבעת המנועים.**

**חלופות מדורגות:**
1. Staged engine כמתואר — **מומלץ.**
2. אותו דבר אבל Pro כבר ב-Phase 1 — מפתה כלכלית (מכסה API מהיום), נדחה: מסכן את ה-viral wedge לפני שיש proof. לשקול רק אם עלות ה-API בפועל חורגת מ-$0.40/MAU.
3. דילוג על Pro, ישר ל-resale/dropshipping — דוחה margin ב-6-12 חודשים ותלוי בפתרון payout שלא בשליטתנו. נחות.
4. Affiliate-only עד הסוף (מודל Phia הטהור) — עובד רק עם צמיחה של Phia (מאות אלפי MAU מהר); בלי זה אין מנוע רווח. נפסל כתוכנית, נשמר כ-fallback.

---

## מה חייב להיות נכון (falsifiable, למדידה ב-cohort הראשון)

1. **Attach:** ‏≥5% מה-MAU מבצעות רכישה מיוחסת בחודש (המודל מניח 6.5%). מתחת ל-3% — ה-thesis של intent-graph נחלש, לחזק את ה-BUY surface לפני scale.
2. **D30 ≥ 10%** (פי 2 מנורמת הקטגוריה). מתחת ל-7% — בעיית retention לפני בעיית monetization (חידה 07 של Anna).
3. **Claude API ≤ $0.40/MAU/month** בפועל. מעל — להקדים את Pro (חלופה 2) או להוריד ל-Haiku בכל ה-flows.
4. **Affiliate approval:** רשתות מקבלות publisher ישראלי וה-tracking מיוחס ≥60% מהרכישות בפועל (תלות פתוחה מחידה 01).
5. **CAC אורגני ≤ $7** נשמר עד 10K users (תוכנית חידה 02).

---

## 3 המהלכים הראשונים

1. **לתקן את ה-deck לפני הפגישה:** להחליף "contribution ~$11/user/month" ב-framing הכן — ‏"$2.98 net revenue per attributed order, ‏~80% GM, מסלול מדורג ל-$1-2 contribution/MAU/month" + תחזית מתוקנת. זה שינוי שקרמל חייבת לאשר (לוקח שעה, שווה את כל ה-diligence).
2. **Instrumentation של 4 המדדים הפלסיפיקציוניים** (attach, D30, API-cost/MAU, attribution rate) — כך שה-cohort הראשון של 1,000 המשתמשות (חידה 02) מודד אותם מהיום הראשון. בלי זה אין לנו מודל, יש ניחוש.
3. **מדידת עלות API אמיתית:** לוג של token-count per scan/look-gen על 100 הסריקות הראשונות → לאמת את הנחת ה-$0.25/MAU או לתקן אותה. (זו ההנחה הכי קלה לאימות והכי מסוכנת אם שגויה.)

---

## שאלות פתוחות למייסדות (רק החלטות מייסדות אמיתיות)

1. **[קריטי — לפני הפגישה]** אישור תיקון מספרי ה-deck (מהלך 1). המספרים הנוכחיים לא שורדים diligence; ההמלצה: להציג את המודל הכן — הוא חזק יותר, לא חלש יותר.
2. **[Phase 3, לא דחוף — אבל נעול ולכן רק אתן]** עמלת ה-resale ‏15% (החלטה נעולה) מול שוק שהתכנס ל-Depop ‏0% / Vinted buyer-pays ‏~5%+€0.70. אופציות: (א) להשאיר 15% ולהמר על ה-one-click-listing premium; (ב) לעבור buyer-pays ‏~7-10%; (ג) hybrid — ‏15% שכולל קרדיטים מוגדלים בחזרה לאקוסיסטם. **המלצתי: (ג)**, אבל זו החלטה נעולה — לא נוגע בלי אישור. אין צורך להכריע לפני הגיוס; כן כדאי לדעת מה עונים אם משקיע שואל.
3. **[Phase 2]** אישור עקרוני ל-AWEAR Pro כ-tier בתשלום (מחיר סופי יוחלט אחרי ה-cohort) — האם subscription מתיישב עם ה-brand ("accessible luxury")? המלצתי: כן, כשה-scan הבסיסי לעולם חינם.

---

## מקורות

- [Lasso — 25 Best Fashion Affiliate Programs](https://getlasso.co/niche/fashion/) · [Shopify — Best Affiliate Programs](https://www.shopify.com/blog/best-affiliate-programs) — שיעורי עמלה אמיתיים: H&M ‏7-10.5%, Zappos ‏7%, Lululemon ‏7-10%, PLT עד 15%.
- [3DLOOK — Fashion ecommerce conversion](https://3dlook.ai/content-hub/average-conversion-rate-for-fashion-ecommerce/) · [UniformMarket — Fashion ecommerce stats](https://www.uniformmarket.com/statistics/ecommerce-fashion-insights-trends) — conversion ‏2-3.3%, החזרות 25-40%.
- [DynamicYield — AOV benchmarks](https://marketing.dynamicyield.com/benchmarks/average-order-value/) · [Speed Commerce — AOV](https://www.speedcommerce.com/insights/e-commerce-average-order-value-e-commerce-benchmarks/) — AOV אופנה $183-196.
- [Poshmark — selling fees](https://support.poshmark.com/s/article/297755057?language=en_US) · [CNBC — Naver buys Poshmark $1.2B](https://www.cnbc.com/2022/10/03/south-koreas-naver-to-buy-us-e-retailer-poshmark-for-1point2-billion.html) — ‏20% take, המכירה מתחת ל-IPO.
- [Depop — removes US selling fees](https://news.depop.com/company-news/depop-removes-selling-fees-in-the-united-states-evolves-fee-structure/) — ‏0% seller fee, נשאר 3.3%+$0.45 processing.
- [Vinted — reaches profitability](https://company.vinted.com/newsroom/vinted-reaches-profitability) · [Sifted](https://sifted.eu/articles/vinted-startup-lithuania-profit-news) · [Vinted — Buyer Protection fee](https://www.vinted.com/help/342-buyer-protection-fee-on-vinted) — ‏€596.3M revenue / €17.8M profit ‏2023; buyer-pays ‏~5%+€0.70.
- [Sacra — ShopMy](https://sacra.com/c/shopmy/) · [LTK — how it works for brands](https://company.shopltk.com/en-gb/how-it-works-brands) · [CreatorFlow — ShopMy vs LTK](https://creatorflow.so/blog/shopmy-vs-ltk-affiliate-platform-comparison/) — LTK ‏$6B+ GMV, ממוצע brand commission ‏~16%, creators ‏10-30%.
- [Mapendo — CPI 2025 report](https://mapendo.co/blog/cost-per-install-2025-the-ultimate-report-to-grow-your-app-worldwide) · [Insert Affiliate — UA cost benchmarks](https://insertaffiliate.com/blog/mobile-app-user-acquisition-cost-benchmarks/) · [Adjust — shopping app trends](https://www.adjust.com/blog/shopping-app-trends/) — CPI shopping ‏$0.9-6.2, ‏NA ‏~$2.49.
- [UXCam — retention benchmarks](https://uxcam.com/blog/mobile-app-retention-benchmarks/) · [Plotline — retention by industry](https://www.plotline.so/blog/retention-rates-mobile-apps-by-industry) — ‏D30 shopping ‏~3-6%.
- [Pinterest FY2025 8-K](https://www.sec.gov/Archives/edgar/data/0001506293/000150629325000228/q3-25xpressrelease.htm) · [RecurPost — Pinterest statistics](https://recurpost.com/blog/pinterest-statistics/) · [stockdividendscreener — ARPU comparison](https://stockdividendscreener.com/information-technology/comparison-of-average-revenue-per-user-for-social-media-companies/) — ARPU גלובלי $7.21, ‏US+CA ‏$30.84; Meta ‏$57.
- [TechCrunch — Phia raises $35M](https://techcrunch.com/2026/01/27/phoebe-gates-and-sophia-kiannis-phia-raises-35m-to-make-shopping-fun-again/) + teardown פנימי `docs/research/2026-07-05-phia-buy-to-source-teardown.md`.
- Teardowns פנימיים: `docs/research/2026-07-05-alta-styledna-teardown.md` (StyleDNA ‏$7.99-19.99/mo) · `docs/research/2026-07-05-whering-teardown.md` (‏~£4.99/mo לא מאומת).
- [Anthropic — Claude API pricing](https://platform.claude.com/docs/en/about-claude/pricing) — Haiku ‏4.5 ‏$1/$5, Sonnet ‏$3/$15 per M tokens.

---

**סטטוס: דורש אישור מייסדות על מהלך 1 (תיקון deck).** המודל המלא ניתן להגנה ב-diligence; ההנחה הכי רגישה (attach 6.5%) מסומנת לאימות ב-cohort הראשון. אף החלטה נעולה לא שונתה — המתח סביב עמלת ה-resale ‏15% הועלה כשאלת מייסדות בלבד.
