# Motion Designer — Job Brief
## AWEAR | פתוח מ: 2026-06-17 | מאושר: מארק + ג'ף

---

## התפקיד

Motion Designer לאפליקציית אופנה גלובלית. אחראי על כל שכבת ה-animation וה-interaction — מmicro-interactions על כפתורים ועד מעברים בין מסכים.

**זה לא nice-to-have. animations הן ההבדל בין אפליקציה שמרגישה premium לאפליקציה שמרגישה flat.**

---

## דרישות חובה — disqualified אם חסר אחד מהם

- **Android low-end portfolio** — חייב הוכחה מוכחת של animations על Xiaomi Redmi / Samsung A-series. iOS-only = disqualified.
- **Performance knowledge** — יודע להסביר למה `transform` ו-`opacity` בלבד. יודע מה `will-change` עושה ומה יקרה אם מנצלים אותו יתר על המידה.
- **`prefers-reduced-motion`** — חייב לדעת מהו ולממש אותו בכל animation.
- **RTL animation direction** — יודע לאיזה כיוון slide מגיע בעברית לעומת אנגלית.

---

## הpriorities הראשונות בתפקיד

1. **Scan loading state** — skeleton screen שמתאים לcards התוצאה. לא spinner.
2. **Feed scroll** — parallax עדין על gradient של כל כרטיס.
3. **Reaction tap** — scale bounce על ❤️ 🔥 ⭐ ✨ כשלוחצים.
4. **Screen transitions** — slide horizontal, לא fade.
5. **Add to wardrobe** — פריט "נועף" לאייקון הארון.

---

## כללי עבודה

- עובד לפי design tokens של נטה — אין animation duration שלא מוגדר ב-`awear-tokens.json`
- כל animation עוברת בדיקה על Android mid-range לפני merge
- `prefers-reduced-motion` חייב להיות wrapper לכל animation
- לא מאנימציה error states
- Version 1 עם 80% מה-vision — עדיף על version 0 מושלמת

---

## תרבות

AWEAR בונה לגלובלי. Animation שנראית "ישראלית" או "ספציפית לשוק" — לא תתקבל.
הbar הוא: Instagram, TikTok, Lyst — ואפילו קצת יותר.

---

## תהליך גיוס

1. שלח portfolio עם לפחות 2 דוגמאות mobile עם Android testing
2. ראיון טכני עם מארק ו-ג'ף — שאלות על performance ו-RTL
3. Home assignment: בנה skeleton screen ל-AWEAR scan result

**צור קשר: מארק (Head of Design)**
