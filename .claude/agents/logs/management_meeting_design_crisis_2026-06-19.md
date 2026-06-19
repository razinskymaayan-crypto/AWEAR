# ישיבת מנהלים — Design Crisis
## 19.06.2026 | 09:15–10:30
## State: B — ג'ף מנחה + מתעד (ביצוע עצמי, לא delegation)

---

## משתתפים
- ג'ף — מנחה + מכריע
- מארק — Head of Design
- איילון — Product Director
- סטיב — CTO (נושאי implementation)

## לא בישיבה (יקבלו action items):
- דולצ'ה, גבאנה, נטה

---

## הקשר

כרמל ביקשה ישיבה דחופה: "AWEAR עדיין לא נראה טוב — גנרי, אימוג'ים לא קשורים, לא מלוטש, לא ברמה של Instagram/TikTok/Pinterest."

**נתוני baseline לפני הישיבה (מ-grep):**
- `var(--t-*)` — 0 שימושים בקוד החי
- hardcoded hex — 97 מקומות
- inline styles — 213 אלמנטים
- font-size hardcoded — 402 שורות
- emoji בקוד — לפחות 8 classes: `sheet-look-emoji`, `qo-emoji`, `tc-emoji`, `ex-result-emoji`, `rw-perk-icon`, `mp-item-img`, `sf-card-img`, `pc-feat-cover`
- `#2a2040` / `#1a1030` — צבעים שאינם קיימים ב-`awear-tokens.json`, 13+ הופעות

---

## שאלת פתיחה קנונית

"מה ג'ף צריך להחליט היום שלא יוחלט בלעדי?"

תשובה לפני הישיבה:
1. האם design system הוא blocker רשמי לשחרור
2. מי מחזיק בעלות scope phase 4 — מארק מחליט, ג'ף מאשר
3. האם "done" מוגדר מחדש החל מהיום

---

## סבב 1 — אבחון

**מארק:** Phase 3 תיקן את ה-chrome (ניווט, badges) אבל לא את ה-content. `mp-item-img` מציג `${item.emoji||'👗'}` — כל גלריית מוצרים נראית כמו wireframe. Instagram נראית כמו Instagram כי כל תמונה אמיתית.

**איילון:** משתמשת שרואה 👖 👗 👟 ב-marketplace לא חושבת "זה לא יפה" — היא חושבת "זה לא מוכן" ועוזבת. הבעיה היא data layer: `marketplace[]` מוגדר עם `emoji` field כ-display default. כל עוד ה-data מוגדר ככה — ביצוע עיצובי מושלם עדיין יציג emoji.

**סטיב:** root cause טכני — אין enforcement. `tokens.css` מוגדר, לא enforced בlinting, לא בCI, לא בPR review. `"DO NOT edit manually"` כתוב ב-tokens.css — אין generator. documentation שמציג pipeline שלא קיים מוציא אמינות מה-design system כולו.

---

## סבב 2 — שורש מבני

**הכרעת ג'ף:** שלוש שכבות, כולן נכונות, כולן חייבות להיתקן ביחד:

```
data עם emoji כ-default
+ CSS ללא enforcement
+ "done" = "עובד" במקום "נראה כמו Instagram"
= מוצר שנראה כמו wireframe
```

תיקון שכבה אחת בלבד — יחזור לאותו מקום.

**מארק (שורש עיצובי):** "done" מוגדר כ-"קוד עבד" לא כ-"נראה כמו רשת חברתית מובילה". Playwright בודק 0 pageerror. לא בודק "האם מסך הבית נראה כמו Instagram Explore?"

**איילון (שורש product):** placeholder הוגדר כ-"זמני" ומעולם לא זמנו אותו. content strategy לא מחובר לdesign.

**סטיב (שורש טכני):** CSS נכתב ישירות ב-10,000 שורות של `static/index.html` ללא linter, CSS modules, PostCSS plugin. ארכיטקטורה שלא נבנתה ל-scale.

---

## סבב 3 — הכרעות

### הכרעה 1 — הגדרת "done" משתנה מהיום
"done" = עמד בשאלת העל: "מסך זה היה עולה ב-Instagram story של AWEAR?"
לא "0 pageerror". לא "עבר QA". גבאנה לא חותמת על PR בלי תשובה מפורשת לשאלה הזו.

### הכרעה 2 — data layer
כל `emoji` field ב-`marketplace[]` ובdata objects של מוצרים מוחלף ב-`search_query` string אמיתי.
בעלות: איילון מגדיר את ה-search queries, דולצ'ה מיישמת.
מועד: cycle הבא.

### הכרעה 3 — tokens enforcement
נטה כותבת `scripts/build-tokens.js` שמייצר `tokens.css` מ-`awear-tokens.json`.
סטיב מגדיר CI step מינימלי.
יעד: `var(--t-*)` > 50 שימושים עד סוף cycle הבא.

### הכרעה 4 — phase 4 ownership
מארק מגיש scope Phase 4 לג'ף לפני Board Sync הבא. אם לא מוגש — ג'ף מחליט.

---

## 7 כללי Instagram (הוגדרו בישיבה, עודכנו ב-DESIGN_STANDARDS.md)

| # | כלל | פקודת אימות | DoD |
|---|-----|------------|-----|
| 1 | אפס emoji ב-UI chrome | `grep -n "\.qo-emoji\|\.tc-emoji\|\.ex-result-emoji" index.html` | 0 results |
| 2 | כל product card = תמונה אמיתית | `grep "item.emoji\|'👗'\|'👖'" index.html | grep -v user-content` | 0 results |
| 3 | background = token, לא hex | `grep -c "#2a2040\|#1a1030" index.html` | 0 |
| 4 | typography scale — 5 גדלים בלבד | `grep "font-size" index.html | grep -v "var(--t-"` | 0 (post-migration) |
| 5 | רשת 8pt | ערך שאינו 4/8/12/16/24/32px — דורש הסבר | PR description |
| 6 | כל אינטראקציה = feedback | כל `onclick` ← `:active` CSS | אין onclick ללא :active |
| 7 | שאלת העל בפועל | גבאנה: "היה עולה ב-Instagram story?" | שורת תגובה מפורשת בכל PR |

---

## Action Items

### דולצ'ה
| # | משימה | DoD |
|---|--------|-----|
| D1 | Marketplace data: החלף 8 `emoji` fields ב-`search_query`, עדכן render | `grep "item.emoji" index.html` = 0. Playwright מציג תמונות. |
| D2 | מפה 13+ הופעות `#2a2040`/`#1a1030` ל-tokens | `grep -c "#2a2040\|#1a1030" index.html` = 0. Regression clean. |
| D3 | Self-check לפני כל review request | תיעוד self-check ב-PR description של כל PR. |

### גבאנה
| # | משימה | DoD |
|---|--------|-----|
| G1 | Audit מלא לפי 7 הכללים החדשים | מסמך עם P0/P1/P2 per rule + ציון מ-10. Input: commit hash + 7 כללים כ-checklist. |
| G2 | "שאלת העל" בכל PR | `Visual QA: עבר שאלת העל / לא עבר — [סיבה]` בכל PR שגבאנה חותמת. |

### נטה
| # | משימה | DoD |
|---|--------|-----|
| N1 | `scripts/build-tokens.js` | `node scripts/build-tokens.js` מייצר output נכון. `"DO NOT edit manually"` הופך לאמת. |
| N2 | Typography migration batch 1 — HomeScreen | `grep "font-size" index.html | grep -v "var(--t-" | grep -i home` = 0. `grep -c "var(--t-" index.html` > 0. |

### מארק
| # | משימה | DoD |
|---|--------|-----|
| M1 | Scope Phase 4 — הגש לג'ף לפני Board Sync | מסמך: מה Phase 4 מכסה + rationale + who + success metric. |
| M2 | עדכון DESIGN_STANDARDS.md | PR עם 7 כללים ב-section נפרד, אישור גבאנה. (בוצע על ידי ג'ף בישיבה — State B מתועד.) |

---

## State A/B תיעוד

- **עדכון DESIGN_STANDARDS.md** — State B: ג'ף ביצע בישיבה, לא מארק. תועד כאן במפורש.
- **שאר ה-action items** — State A: הוקצו לצוות, מארק מפקח.

---

## לקח חדש לlearnings.md

**CE-002** — ישיבת מנהלים שעוסקת בבעיה מבנית חייבת להסתיים ב-root cause אחד ולא ברשימת כוונות. שלוש שכבות בו-זמנית (data / enforcement / definition of done) דורשות פתרון מקביל, לא סדרתי. אם מתקנים רק שכבה אחת — הבעיה חוזרת.

---

## מה לא הוכרע בישיבה זו (ויישאר פתוח לBoard Sync)
- האם design system הוא blocker רשמי לשחרור — ממתין לscope Phase 4 של מארק ולנתוני migration של נטה.
- RTL audit — נדחה לPhase 4.
- Error states ו-empty states — נדחו לPhase 4.

---

*תיעד: ג'ף | 19.06.2026*
*הפץ ל: מארק, איילון, סטיב (ישיבה). דולצ'ה, גבאנה, נטה (action items).*
*דוח בורד: ייכלל במייל הבוקר לכרמל + מעיין.*
