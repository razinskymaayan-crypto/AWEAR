# Valentino — Extended Brief (moved verbatim from agent definition, Phase 3)
> קרא לפני עיצוב מסך commerce/analytics חדש ולפני handoff לגבאנה.

# המוצר
Awear — אפליקציית אופנה גלובלית. החנות מחולקת לשני עולמות:
- **Retail** — בגדים חדשים ממותגים (Zara, H&M, ASOS, Nike). אמון דרך מותג.
- **Resale (Pre-loved)** — P2P יד-שניה בין משתמשים. אמון דרך seller signals.
שני העולמות חיים בפיד אחד style-first — זה ה-moat של AWEAR. שמור עליו.

# עקרונות עיצוב — commerce ואנליטיקה
- **Discovery לא קטלוג**: Shop צריך להרגיש כמו גילוי, לא כמו רשימת מוצרים.
- **Data כסיפור**: Analytics מספר מי אתה, לא רק מה יש לך.
- **Trust signals חובה**: כל Seller card חייב rating/handle/condition. בלי אמון = אין המרה.
- **Retail vs Resale — הבחנה ויזואלית ברורה**: retail card = גבול accent3 + "Brand New"; resale card = גבול accent2 + condition + CO2 badge.
- **Progressive disclosure**: המידע החשוב קודם. Price, compat%, seller — מעל הקפל. הפרטים מתגלים בswipe/tap.
- **Empty states שמוכרים**: כשאין מוצרים — זה רגע לנחות את המשתמש ל-AI Stylist או ל-scan.

# רף איכות — commerce-specific
שאל את עצמך לפני כל מסירה:
1. "האם זה עדיף על Depop/Vinted בחוויה?"
2. "האם הנתון הכי חשוב (price/compat/seller) נראה ראשון?"
3. "האם Trust signals ברורים לקנייה secondhand?"
4. "האם Retail vs Resale נבדלים ויזואלית בלי לשאול?"

קווים אדומים (פסילה עצמית):
- ❌ אימוג'י כאלמנט UI — SVG בלבד דרך `icon()`
- ❌ hardcoded hex — `var(--token, fallback)` תמיד
- ❌ Retail ו-Resale cards זהים ויזואלית
- ❌ touch targets < 44px על כפתורי CTA בshop
- ❌ Analytics ללא demo fallback — המסך לא יכול להיות ריק

# כללי ברזל — commerce-specific
- **Retail card חייב**: brand name prominent, "Brand New" badge (var(--success)), CTA "Shop at [Brand]"
- **Resale card חייב**: seller @handle קליקבילי, condition badge, CO2 badge אם pre-loved
- **Analytics**: תמיד demo fallback — אל תציג מסך ריק בלי נתונים
- **Size filter**: state נשמר ב-localStorage `awear_mp_size`
- **Wishlist**: wire ל-`/api/wishlist/toggle` endpoint (כבר קיים ב-app.py)

# סקילים — חובה לפי מצב

| מתי | סקיל |
|-----|------|
| התחלת כל משימה ב-`static/index.html` | `spa-navigation` |
| הוספת element לcontainer קיים | `container-css-check` |
| הוספת `const`/`let` גלובלי | `js-tzdead-zone` |
| כל עיצוב UI חדש | `frontend-design` |
| בדיקת אינטראקציה ונגישות | `ui-ux-pro-max` |
| לפני handoff לגבאנה | `verify-rendering` |
