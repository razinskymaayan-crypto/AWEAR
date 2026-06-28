# INBOX — משימות לסוכנים

**איך נותנים משימה:** פשוט כתוב שורה תחת "משימות חדשות". בעברית רגילה. שורה אחת = משימה אחת.
אין צורך בתגיות, תאריכים או פורמט מיוחד. כל מה שכתוב שם — הסוכנים יעשו.

כשמסיימים, הם מעבירים את המשימה ל"הושלם" וכותבים לידה מה עשו.

═══════════════════════════════════════

## משימות חדשות

הקשר־על: יעד = דמו מלוטש. החזון המלא ב-docs/PRODUCT_VISION.md — קראו אותו לפני עבודה. עבדו לפי הסדר, משימה אחת לכל ריצה, מקצה לקצה, עם VALUE GATE אמיתי. אל תעשו סקרים/מחקר כל עוד יש כאן משימות.

בנו את מסך ה-WOW: בכניסה לפריט מתוך פוסט בפיד יוצג (א) אחוז התאמה בולט לארון שלי, (ב) 2-3 לוקים שה-AI הרכיב משילוב הפריט עם בגדים שכבר קיימים בארון שלי, (ג) "איך הוא נמכר" עם כפתור קנייה למקור. זה הלב של הדמו — תעדפו מעל הכל, ואפשר לפרק לכמה ריצות (קודם אחוז ההתאמה, אז הלוקים מהארון, אז הקנייה). [התקדמות: chunk 1/3 בוצע — band אחוז התאמה בולט עם calcCompatScore, צ'יפים של פריטי הארון, ו-empty state מזמין; Gabbana 8.5. נותרו chunk 2 (לוקים מהארון) ו-chunk 3 (קנייה למקור).]
ודאו שסריקת בגדים אמיתית עובדת מקצה לקצה עם Claude Vision: צילום → זיהוי מותג/צבע/חומר → search_query → הוספה לארון → buy_options. אם זה נופל ל-demo mode למרות שיש מפתח — אבחנו ותקנו (המפתח ב-.env וב-GitHub secret).
נקו את שורת ה-Stories בפיד: עדיין מציגה שמות ישנים (Noa, Yael). חברו אותה ל-3 המשתמשות האמיתיות Tamar / Carmel / Maayan עם האווטארים האמיתיים (static/img/users/<name>/avatar.jpg).
עמוד הפרופיל הציבורי (לחיצה על שם בפיד): ודאו שמוצגים אווטאר אמיתי, וייב, והלוקים של המשתמשת — במיוחד ל-Tamar/Carmel/Maayan.
האסתטיקה: הביאו את מסכי הליבה (Feed, מסך פריט, פרופיל) לסטנדרט מינימל-פרימיום עם נשמה עריכתית (Zara × Vogue) — light נקי, תמונות גדולות, טיפוגרפיה חזקה. גבאנה 8.5+.
AI Stylist: לוק יומי לפי הקשר (יום בשבוע / שעה ביום) + צ'אט ליצירת לוקים, והוסיפו סינון לוקים בסטייל טינדר. החליטו איפה זה יושב במסך ה-AI ותעדו ב-IDEAS.md מאיזו מכסה יומית מתחילים פרימיום.

═══════════════════════════════════════

## הושלם
- Store Insight redesign — done (rebuilt the My Store Insight sheet from a stats-duplicate into an actionable advisor: Store Health score + 3 distinct KPIs, a "Do next" stack of recommendation cards — refresh stale listings, complete incomplete listings, fix pricing outliers, list unworn closet items — a conversion funnel with a diagnostic line, and a weekly sales goal. Removed the duplicated Performance/Audience/Category/Top-performer blocks. Gabbana 9.5, check-render OK).
- צילום מסך החנות + הסבר על כל פיצ'ר — done (sent Telegram: Store screenshot + full feature guide covering Shop/Community/My Store tabs, search, AI Stylist bar, category filters, Filter & Sort sheet, Matches My Closet, product-card badges/compat/CO2, and seller storefront).
- הסרת פיצ'ר מזג האוויר מדף הבית — done (removed weather card HTML/CSS + fetchWeather JS from home view; tightened greeting spacing).
- שנו את סדר הטאבים בניווט התחתון: feed, store, AI, DM, profile — done (commit 91d29f7: nav reordered, Feed is now default).
- סקר משתמשים על סטטיסטיקת הארון (Analytics) — done (100-expert panel ≈6.4/10; shipped 5 fixes: conic progress-arc rings, actionable Health hint, utilization/rewear disambiguation, Hidden Cost→sell, tap feedback; Gabbana 8.5; charts+doc to Telegram).
