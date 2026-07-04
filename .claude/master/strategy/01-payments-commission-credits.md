# חידה: תשלומים + עמלה + קרדיטים

מסמך החלטה למייסד (Carmel). מכין תשתית עסקית-טכנית לפני גיוס. מונחים טכניים באנגלית בכוונה.
תאריך: 2026-07-04 · מחבר: Steve (CTO)

---

## מה השאלה בדיוק

איך רצה עסקה אמיתית ב-AWEAR — ואיך שומרים על 3 דברים בו-זמנית:
1. **הקרדיטים** לקונים וליוצרים (creator credits) — ledger append-only, idempotent.
2. **העמלה שלנו** — 15% commission, בלי לאבד אותה.
3. **בלי להפסיד כסף** ובלי להיכנס לביצה רגולטורית שתתקע צוות pre-seed.

השאלה מתפרקת ל-3 סוגי supply, שכל אחד עובד אחרת לגמרי:
- **(a) Affiliate** — המשתמש קונה באתר של הקמעונאי (Zara, ASOS וכו'). אנחנו לא נוגעים בכסף.
- **(b) In-app checkout / dropshipping** — אנחנו מעבדים את התשלום.
- **(c) P2P resale** — משתמש מוכר פריט מהארון שלו למשתמש אחר.

ההבדל המהותי בין השלושה הוא **מי ה-Merchant of Record (MoR)** — מי מופיע על חיוב הכרטיס, מי אחראי משפטית למוצר, מי סופג chargebacks, מי חייב במס.

---

## למה קריטי עכשיו

- אנחנו pre-investor, מגייסים ~$70-80K בעוד 2-4 שבועות. **ה-runway לא סובל טעות תשתיתית.**
- הבחירה בין "affiliate בלבד" ל-"in-app checkout" משנה מהיסוד את **פרופיל הסיכון המשפטי, המס, וה-compliance** — ומשקיע חכם ישאל על זה בדיוק.
- הקרדיטים כבר "locked" כהחלטה מוצרית (buyer credit + creator credit). אם לא נתכנן את ה-unit economics שלהם **עכשיו**, הם יכולים לאכול את כל ה-15% ולהפוך כל עסקה למפסידה.
- הכי חשוב: יש **חסם מבני קונקרטי** ל-AWEAR כחברה ישראלית (פירוט בהמשך) שמכתיב את התשובה.

---

## שלושת ה-flows — איך עסקה אמיתית רצה בפועל

### (a) Affiliate — המשתמש קונה אצל הקמעונאי
- **מי מחזיק בכסף:** הקמעונאי (Zara/ASOS/וכו'). אנחנו אף פעם לא נוגעים בכספי הקונה.
- **מי ה-MoR:** הקמעונאי. הוא גובה, מנפיק קבלה, אחראי למוצר, למס, ל-refund, ל-chargeback. **אנחנו לא.**
- **Payment infra:** אין. אנחנו רק שולחים tracked link דרך רשת אפיליאט (AWIN / Rakuten / CJ). הרשת מייחסת את המכירה ומשלמת לנו commission.
- **מה אנחנו מקבלים:** commission מהרשת. AWIN מ-$20 (payout פעמיים בחודש), CJ net-30 מ-$50, Rakuten רבעוני. הכסף מגיע אלינו **net** — הרשת כבר טיפלה בכל השאר.
- **Payout ל-sellers:** לא רלוונטי, אין sellers.

### (b) In-app checkout / dropshipping — אנחנו מעבדים תשלום
- **מי מחזיק בכסף:** אנחנו (דרך processor).
- **מי ה-MoR:** **אנחנו.** ברגע שאנחנו מעבדים את התשלום ומגדירים תנאי מכירה — אנחנו ה-MoR/deemed seller. זה אומר: אנחנו אחראים משפטית למוצר, סופגים chargebacks, וחייבים במס מכירות/VAT (ראה סעיף compliance).
- **Payment infra:** Stripe (או PSP חלופי). ב-dropshipping אנחנו קונים מהספק ומוכרים לצרכן — אנחנו seller לכל דבר.
- **Payout לספק:** אנחנו משלמים לספק מתוך מה שגבינו. ה-margin שלנו = מחיר לצרכן − עלות מהספק − דמי processing − chargeback reserve.

### (c) P2P resale — משתמש מוכר לארון של משתמש אחר
- **מי מחזיק בכסף:** אנחנו זמנית (escrow), עד אישור קבלה. כך עובדים Poshmark ו-Depop — מחזיקים בכסף ב-escrow ומשחררים ~2-3 ימים אחרי delivery.
- **מי ה-MoR:** **הפלטפורמה** (אנחנו). זה המודל של destination/separate charges ב-Stripe Connect — כשאתה לא משתמש ב-direct charges, הפלטפורמה היא ה-MoR, משלמת את עמלות Stripe, ומטפלת ב-disputes/refunds. **הפלטפורמה גם אחראית לכסות יתרות שליליות של connected accounts.**
- **Payment infra:** Stripe Connect. Depop עברו בדיוק לזה (מ-PayPal ל-Stripe Connect). המוכר הוא connected account.
- **Payout למוכר:** אחרי escrow, Stripe מעביר למוכר (connected account) פחות ה-15% שלנו. **כאן נמצא החסם המבני — ראה למטה.**

---

## החסם המבני שמכתיב הכול — Stripe Connect + ישראל

זו העובדה הכי חשובה במסמך, ומבוססת על תיעוד Stripe רשמי:

> **פלטפורמות Stripe Connect שמבוססות ב-US / UK / EEA / Canada / Switzerland יכולות להעביר כספים ל-connected accounts באותם אזורים. Stripe לא תומכת ב-self-serve cross-border payouts לפלטפורמות מחוץ לרשימה הזו. ישראל לא ברשימה.**

מה זה אומר בפועל ל-AWEAR כחברה **ישראלית**:
- **flow (c) P2P ו-flow (b) marketplace payouts לא רצים out-of-the-box.** פלטפורמה ישראלית לא יכולה להריץ Stripe Connect קלאסי שמשלם ל-sellers ב-US/EU בצורה self-serve.
- העקיפה של Stripe היא **Global Payouts** (150+ מדינות) — אבל זה מסלול נפרד, כבד יותר, לרוב דורש שיחת sales, ולא ה-Connect ה"קסום" שכולם מדמיינים.
- זה **הופך את (b) ו-(c) מ"פיצ'ר" ל"פרויקט compliance + legal + banking"** — בדיוק מה שצוות pre-seed לא צריך עכשיו.

רמת ביטחון: **גבוהה** לגבי המגבלה העקרונית (תיעוד Stripe מפורש). **בינונית** לגבי הניואנס המדויק לישראל — צריך אימות ישיר מול Stripe sales לפני שמסתמכים על מספר או תאריך. זו החלטה שאסור לבסס על הנחה.

---

## Compliance — מה באמת חוסם צוות pre-seed

מה שמשתנה דרמטית לפי מי ה-MoR:

| נושא | Affiliate (a) | In-app / P2P (b,c) |
|------|---------------|--------------------|
| **US Sales tax nexus** | הקמעונאי אחראי. לא אנחנו. | ברוב המדינות economic nexus מופעל ב-**$100K או 200 עסקאות** ב-12 חודשים. **dropshipping יכול ליצור nexus ללא קשר לווליום.** ברגע שיש nexus — חייבים לרשום, לגבות, ולהעביר מס בכל state בנפרד. |
| **EU VAT** | הקמעונאי. | תחת ה-**deemed seller rule** ל-non-EU sellers: אם אנחנו קובעים תנאי מכירה / מעבדים תשלום / מטפלים בהזמנה — **אנחנו ה-deemed seller** וחייבים ב-VAT (OSS/IOSS). |
| **Refunds** | הקמעונאי. | אנחנו. צריך policy, כסף מוקצה, ותהליך. |
| **Chargebacks** | הקמעונאי. | אנחנו סופגים. ב-P2P — הפלטפורמה מכסה גם negative balances של sellers. |
| **KYC / AML לתשלומים ל-sellers** | לא רלוונטי. | חובה. כל connected account שמקבל כסף עובר KYC. זה עומס תפעולי אמיתי. |

**המסקנה החד-משמעית:** flow (a) משאיר את **כל** נטל ה-compliance אצל הקמעונאי. flows (b) ו-(c) מעבירים את כולו **אלינו** — לחברה ישראלית pre-seed, בלי צוות פיננסי, בלי banking infrastructure, בלי runway לזה.

---

## Unit economics של הקרדיטים — עם דוגמה על מכירה של $100

זו הנקודה שבה אפשר להרוג את העסק בשקט. **השאלה: הקרדיט ממומן מתוך ה-15% שלנו, או על גביו?**

### מכירה של $100, commission 15% = $15 gross לנו.

**מודל A — קרדיט OUT OF ה-15% (מתוך העמלה):**
נניח buyer credit 3% + creator credit 2% = 5% credits.
- ההכנסה שלנו: $15 (העמלה).
- קרדיטים שהנפקנו: $5.
- **נטו לנו: $15 − $5 = $10.** עדיין רווחי. ✅
- הסיכון היחיד: אם נעלה קרדיטים מעל 15%, ניכנס להפסד. חייבים **cap** על סך הקרדיטים כאחוז מהעמלה.

**מודל B — קרדיט ON TOP של ה-15% (מכיסנו, מעבר לעמלה):**
- ההכנסה שלנו: $15.
- קרדיטים: $5 — אבל **לא מתוך העמלה, אלא הוצאה נוספת** שאנחנו מסבסדים.
- **נטו לנו: $15 − $5 = $10 בעסקה הראשונה** — נראה זהה, אבל:
- **הבעיה:** קרדיט שנוצר "on top" הוא **התחייבות (liability)** שלא מגובה בהכנסה תואמת. אם המשתמש צובר קרדיטים בלי לקנות (למשל creator שמביא views אבל לא מכירות), אנחנו מנפיקים כסף אמיתי בלי הכנסה כנגדו. **זה הופך לסבסידיה לא מוגבלת.**

### ההכרעה על הקרדיטים
- **ממנים קרדיטים OUT OF ה-15% (מודל A), עם cap קשיח.**
- כלל ברזל: **סך הקרדיטים בעסקה ≤ X% מהעמלה** (למשל cap ב-50% מהעמלה = עד 7.5% מתוך 15%). כך **בכל עסקה** אנחנו רווחיים by construction, ואי אפשר להיכנס למינוס.
- קרדיט **נצבר רק כשיש עסקה מיוחסת בפועל** (attributed, settled) — לא על views, לא על clicks. אחרת יוצרים liability בלי revenue.

### לוגיקת ה-ledger (high level — append-only, idempotent)
עקרונות שמונעים אובדן עמלה או הנפקה כפולה:
- **append-only:** אף פעם לא מעדכנים/מוחקים שורה. כל אירוע = שורה חדשה. balance = סכום השורות. זה מה שמונע tampering ומאפשר audit.
- **idempotent:** לכל אירוע `event_id` ייחודי (למשל `sale_id + type`). אם אותו event מגיע פעמיים (retry, webhook כפול) — לא נוצרת שורה שנייה. **זה מונע double-credit** מ-webhooks של Stripe/affiliate שמגיעים יותר מפעם אחת.
- שלושה סוגי שורות: `EARN` (נצבר על עסקה settled), `HOLD` (מוקפא עד סיום חלון refund/return), `REDEEM` (נוצל במכירה).
- **קרדיט נכנס ל-HOLD קודם, EARN רק אחרי חלון ה-refund** — כדי לא לשלם קרדיט על עסקה שתתבטל.
- **REDEEM אף פעם לא נוגע בעמלה שלנו:** הקרדיט מוריד ממה שהמשתמש משלם, לא ממה שאנחנו גובים. העמלה נגבית מהעסקה, הקרדיט הוא הנחה שממומנת מתוך תקציב הקרדיטים (מודל A). כך העמלה מובטחת.
- **redeem בתוך transaction אטומי** עם בדיקת balance: אי אפשר לממש קרדיט שאין. race condition נמנע ע"י `SELECT ... FOR UPDATE` לוגי (או, ב-SQLite שלנו: כתיבה סדרתית + בדיקת balance מחושב לפני INSERT של REDEEM).

---

## האפשרויות ל-day-1 stack

### אפשרות 1 — Affiliate-only (zero payment risk, no MoR)
- **איך עובד:** רק flow (a). המשתמש קונה אצל הקמעונאי דרך tracked link. אנחנו מרוויחים commission מהרשת. אין in-app payment, אין sellers, אין escrow.
- **Pros:** אנחנו **לא MoR** על שום דבר. אפס אחריות מס/VAT/refund/chargeback/KYC. עוקף לגמרי את חסם Stripe-Connect-ישראל. אפשר לשלוח **מחר**. משקיע רואה סיפור נקי.
- **Cons:** ה-15% commission שלנו **תלוי בשיעורי האפיליאט של הקמעונאי** (לרוב 5-12%, לא בהכרח 15% מלא) — צריך לתקף שהמתמטיקה סוגרת. פחות שליטה על החוויה. אין P2P resale ב-day 1 (החלק שהוא "locked" מוצרית נדחה).
- **עלות/מורכבות:** נמוכה מאוד. הרשמה ל-AWIN ($1 deposit), CJ, Rakuten. אינטגרציית link-tracking + webhook לספירת commission.
- **מה דורש ממך:** אישור שדוחים P2P ו-in-app checkout ל-phase מאוחר. הרשמה עסקית לרשתות האפיליאט (דורש ישות + פרטי חברה).

### אפשרות 2 — Full in-app checkout via Stripe Connect (אנחנו MoR)
- **איך עובד:** כל ה-flows (a+b+c). אנחנו מעבדים תשלומים, escrow ל-P2P, payout ל-sellers.
- **Pros:** שליטה מלאה בחוויה ובכסף. margin מלא. P2P מהיום הראשון. הכי "פלטפורמה".
- **Cons:** **אנחנו MoR על הכל** → מס/VAT/refunds/chargebacks/KYC. **מתנגש חזיתית בחסם Stripe-Connect-ישראל** ל-cross-border payouts. דורש banking + legal + מסלול Global Payouts. **לא ריאלי ל-pre-seed בישראל בטווח הגיוס.**
- **עלות/מורכבות:** גבוהה מאוד. שבועות-חודשים של compliance + הקמת תשתית תשלומים + KYC ops.
- **מה דורש ממך:** יועץ מס בינלאומי, שיחת Stripe sales, potentially ישות מחוץ לישראל, ותקציב compliance. לא ריאלי בלוח הזמנים.

### אפשרות 3 — Hybrid מדורג (המלצה)
- **איך עובד:**
  - **Day 1 (עכשיו → גיוס):** Affiliate-only. אפס MoR. שולחים מהר, מגייסים על סיפור נקי.
  - **Ledger מוכן מראש:** ה-credit ledger (append-only, idempotent) נבנה עכשיו וצובר קרדיטים על עסקאות affiliate מיוחסות — כך שהמנגנון חי ומוכח לפני שיש in-app money.
  - **Phase 2 (post-raise):** מוסיפים in-app checkout / P2P **רק אחרי** שנפתר חסם ה-payout — דרך Stripe Global Payouts, PSP חלופי (למשל שמתמחה ב-marketplaces cross-border), או ישות מתאימה. החלטה **בלתי הפיכה** → עוצרים לאישור לפני ביצוע.
- **Pros:** מקבל את היתרונות של אפשרות 1 עכשיו, בונה תשתית לאפשרות 2 בלי הסיכון עכשיו. הקרדיטים עובדים day 1 בלי money-risk. מסלול הצמיחה ברור למשקיע.
- **Cons:** דורש משמעת לא לזלוג ל-in-app checkout מוקדם מדי. שתי אינטגרציות לאורך זמן.
- **עלות/מורכבות:** נמוכה עכשיו, בינונית ב-phase 2 (מתוכננת).
- **מה דורש ממך:** אותה הרשמה כמו אפשרות 1 + החלטה עקרונית ש-in-app/P2P נכנס רק אחרי גיוס + פתרון payout מאומת.

---

## ההמלצה + למה

**אפשרות 3 — Hybrid מדורג. Affiliate-only ל-day 1, credit-ledger חי מהיום, in-app/P2P דחוי ל-post-raise עם payout-solution מאומת.**

רמת ביטחון: **גבוהה.**

למה:
1. **החסם המבני מכתיב זאת.** Stripe Connect לא נותן לפלטפורמה ישראלית cross-border payouts self-serve. כל מודל שמניח in-app payout ביום 1 בנוי על הנחה שגויה. affiliate עוקף את זה לגמרי.
2. **הסיכון המשפטי לא שלנו.** ב-affiliate, ה-MoR הוא הקמעונאי — אפס חשיפת מס/VAT/chargeback/KYC. זה בדיוק מה שצוות pre-seed צריך: להוריד סיכון, לא להוסיף.
3. **מהירות = runway.** אפשר לשלוח את ה-flow הזה עכשיו ולגייס עליו. in-app checkout היה דוחה את המכירה בשבועות של compliance.
4. **הקרדיטים נשארים רווחיים by construction** (מודל A + cap), וה-ledger כבר מוכח על עסקאות אמיתיות לפני שנכנס כסף פנימי — כך ש-phase 2 נבנה על יסוד בדוק.

**מה זה כן דורש:** לתקף שהמתמטיקה של 15% סוגרת מול שיעורי האפיליאט בפועל. אם רשת נותנת רק 8%, ה-"15% commission" שלנו הוא בפועל 8% ב-day 1 — עדיין רווחי, אבל צריך שהמספר יהיה מודע ולא מופתע.

---

## מה חוסם / מה צריך ממך (החלטה או פעולה אנושית)

1. **[החלטה — קריטית]** לאשר: **P2P resale ו-in-app checkout נדחים ל-post-raise.** זו החלטה מוצרית שרק את יכולה לקבל, כי "resale suggestion = 50%" ננעל מוצרית. אני ממליץ לדחות את ה-*מימוש התשלומי* שלו, לא את הרעיון.
2. **[פעולה אנושית — לא יכול לעשות לבד]** הרשמה עסקית ל-AWIN / Rakuten / CJ — דורש ישות משפטית, פרטי חברה, ולעיתים אישור. **תלוי בישות הרשומה של AWEAR.** צריך לוודא שלרשתות אין חסם ל-publisher ישראלי (לא אושר במקורות — צריך אימות ישיר).
3. **[פעולה אנושית]** **שיחת Stripe sales** לאימות המצב המדויק של Connect/Global-Payouts לפלטפורמה ישראלית לפני שנסמן את phase 2. אל תסמכי על הנחה — זו החלטה בלתי הפיכה.
4. **[החלטה]** לאשר את **מדיניות הקרדיטים:** מודל A (out of commission) + cap קשיח (מוצע: קרדיטים ≤ 50% מהעמלה). זה קובע את ה-guardrail שמונע הפסד.
5. **[פתוח — צריך אימות]** האם לישות של AWEAR יש ישות/חשבון בנק שמאפשר בכלל את phase 2, או שנצטרך מבנה תאגידי אחר (למשל ישות US/EU). לא להחליט עכשיו — לסמן כתלות ל-phase 2.

---

## השלכות על הקוד / המוצר

- **Currency internal = USD** — כבר תואם. ה-ledger כולו ב-USD, המרה רק בתצוגה.
- **Credit ledger** — טבלה חדשה ב-SQLite (`credits_ledger`), append-only, עם `event_id` UNIQUE ל-idempotency (Iron Rule BE-005: SQLite מיום 1, לא in-memory). שורות: `EARN / HOLD / REDEEM`, כל אחת עם `user_id, sale_id, amount_usd, type, event_id, created_at`. balance = `SUM(amount)` per user, לא שדה נפרד.
- **Affiliate attribution** — endpoint שמקבל webhook מהרשת (או polling), מאמת עסקה, ויוצר שורת `HOLD` → `EARN` אחרי חלון refund. חייב MG-005 pattern ל-user_key + rate limit (per backend orientation).
- **אין קוד תשלומים day 1** — לא Stripe SDK, לא checkout. זה מוריד שטח תקיפה אבטחתי ומפשט מאוד את ה-app.
- **idempotency בכל webhook** — כל handler בודק `event_id` לפני INSERT. זה ה-guard המרכזי מפני double-credit.
- **Phase 2 = שינוי ארכיטקטורה מהותי** (MoR, payments, KYC) → תיאום עם ג'ף + החלטה בלתי הפיכה → עצירה לאישור, לא dispatch אוטונומי.

---

## מקורות

- [Stripe — Understand the merchant of record in a Connect integration](https://docs.stripe.com/connect/merchant-of-record) — direct vs destination/separate charges קובע מי ה-MoR.
- [Stripe — Cross-border payouts](https://docs.stripe.com/connect/cross-border-payouts) — הרשימה US/UK/EEA/Canada/Switzerland; ישראל לא בפנים.
- [Stripe — Service agreement types (recipient agreement)](https://docs.stripe.com/connect/service-agreement-types) — recipient accounts לא תומכים ב-cross-border payouts; צריך Global Payouts.
- [Stripe — Global Payouts / send money (150+ countries)](https://docs.stripe.com/global-payouts/send-money) — המסלול החלופי ל-payouts מחוץ לרשימת Connect.
- [Stripe — Global availability](https://stripe.com/global) — רמות התמיכה לפי מדינה.
- [Numeral — Marketplace Facilitator Laws State by State (2026)](https://www.numeral.com/blog/marketplace-facilitator) — מי גובה מס כשיש marketplace facilitator.
- [Stripe — Understanding the tax obligations of marketplaces in the US](https://stripe.com/guides/understanding-the-tax-obligations-of-marketplaces-in-the-us) — nexus + חובות marketplace.
- [Sales Tax Institute — Economic Nexus State Chart](https://www.salestaxinstitute.com/resources/economic-nexus-state-guide) — סף $100K / 200 עסקאות.
- [TaxJar — Do international sellers have to deal with US sales tax?](https://www.taxjar.com/blog/international-sellers-deal-sales-tax-u-s) — חברה לא-אמריקאית + nexus.
- [LedgerGurus — US Sales Tax for Dropshippers](https://ledgergurus.com/sales-tax-for-dropshippers/) — dropshipping ו-nexus.
- [Taxually — Marketplace Facilitator Laws](https://www.taxually.com/blog/what-are-marketplace-facilitator-laws-and-how-do-they-impact-sellers) + [Stripe — Sales tax and VAT for marketplace sellers](https://stripe.com/guides/guide-to-sales-tax-and-vat-for-marketplace-sellers) — EU deemed-seller rule ל-non-EU sellers.
- [CLOSO — How Does Poshmark Pay Sellers (2025)](https://closo.co/blogs/community/how-does-poshmark-pay-sellers-complete-guide-2025) — escrow, שחרור אחרי delivery.
- [Depop Help — How payouts work](https://depophelp.zendesk.com/hc/en-gb/articles/25245286495377-How-payouts-work-UK) + [SellerAider — Depop Payments](https://selleraider.com/depop-payments/) — Depop על Stripe Connect, escrow, timing.
- [AWIN / CJ / Rakuten payment thresholds](https://www.publift.com/blog/best-affiliate-networks-for-publishers) — AWIN $20, CJ $50 net-30, Rakuten רבעוני.

---

**סטטוס: דורש בדיקה** — המסמך שלם והמלצה ברורה. שני פריטים דורשים אימות אנושי לפני הסתמכות: (1) המצב המדויק של Stripe Connect/Global-Payouts לפלטפורמה ישראלית (שיחת sales), (2) קבלת publisher ישראלי ברשתות האפיליאט. שניהם מסומנים כתלויות, לא חוסמים את day-1 affiliate.
