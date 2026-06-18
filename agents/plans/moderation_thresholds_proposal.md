# Moderation Severity Thresholds — Proposal לאישור איילון

**תאריך:** 2026-06-19
**מחברת:** שירה (Social Features Engineer)
**סטטוס:** PENDING APPROVAL — לא יוצא לפרודקשן ללא sign-off של איילון

---

## המצב הנוכחי ב-app.py

`/api/moderate` קיים (שורות 556–593 ב-app.py).
מחזיר: `{"harmful": bool, "severity": "none"|"medium"|"high"}`.

הגדרות qualitative בsystem prompt:
- `"none"` = לא מזיק כלל
- `"medium"` = גבולי / גס / מעליב קלות, לא מסוכן
- `"high"` = מזיק בבירור: hate speech, הטרדה, איומים, תוכן מיני מפורש

**מה חסר:** אין הגדרה מה הFrontend עושה עם כל severity.
זו ההחלטה שעצרה אותנו — product decision, לא engineering.

---

## הצעה: behavior לפי severity

| Severity | מה הFrontend עושה | מה המשתמשת רואה |
|----------|-------------------|-----------------|
| `none` | מציג את התגובה מיידית | תגובה רגילה |
| `medium` | מציג optimistically + flagged internally בadmin log | התגובה נראית — לפוסטר ולכולם (ראה שאלה פתוחה #1) |
| `high` | מסתיר מיד + הודעה למשתמשת שכתבה | "התגובה לא פורסמה" |

**Fail open:** אם ה-API ל-moderation down → comment מוצג כ-`none`, מסומן internally כ-`pending_review`. זה כבר מקודד ב-app.py (שורה 593).

---

## Edge cases — הצעה

| מקרה | טיפול מוצע |
|------|-----------|
| ספאם: 3+ תגובות זהות מאותה משתמשת תוך 60 שניות | BLOCK — rate limit קיים (commit `9b67c80`) |
| URL בתגובה | → severity `medium` אוטומטי, בלי Claude call |
| מידע אישי (טלפון / email) — regex ברור | → severity `high` אוטומטי, מוסתר |
| False positive: תגובה תקינה נחסמה | report flow → reviewer יכול להחזיר אותה |

הurl + PII auto-detection מפחיתים Claude API calls ב-edge cases ברורים.

---

## שאלות פתוחות — חייבות אישור איילון

### שאלה 1 (הכי קריטית): MEDIUM = גלוי לכולם, או רק לפוסטר?

**אופציה A — גלוי לכולם + badge:** המשתמשות האחרות רואות את התגובה, אבל היא מסומנת (למשל badge קטן "תחת בדיקה"). שקוף לקהילה.

**אופציה B — גלוי רק לפוסטר:** הפוסטר רואה שיש תגובה, אחרות לא. כמו shadow-moderation קלה.

**אופציה C — גלוי לכולם בלי badge:** מוצג רגיל, רק admin רואה שזה flagged.

ה-tradeoff: A יותר שקוף אבל עלול לגרום ל"מה זה badge הזה?" C הכי פשוט לUX. B מגן יותר על קהילה.

### שאלה 2: HIGH — notify admin בזמן אמת?

כרגע high → hidden. האם צריך גם push לadmin (email / log entry)? או שadmin_log מספיק?

### שאלה 3: מי הreviewer ל-false positives?

כשמשתמשת מדווחת "תגובה שלי נחסמה בטעות" — מי בודק? admin panel מוגדר? ג'ף? תהליך?

---

## מה לא צריך אישור (כבר מקודד)

- Claude API call לmoderation — קיים
- Fail open על API error — קיים (שורה 593)
- Rate limit 3 comments/min — קיים (commit `9b67c80`)
- Report button → admin log — קיים (commit `9b67c80`)

---

## Live Test Status

**curl test: לא בוצע בcycle זה** — השרת לא רץ בסביבת הCI.
לפי כלל SF-002 ו-OW-002: feature לא מסומן "הושלם" ללא curl חי.

כשהשרת יורם:
```bash
curl -s -X POST http://localhost:8000/api/moderate \
  -H "Content-Type: application/json" \
  -d '{"text": "great outfit!"}' | python3 -m json.tool
```

**שים לב:** השדה הוא `text` (לא `comment`) — לפי `CommentModerationRequest` ב-app.py שורה 552.

---

## Action items אחרי אישור

1. איילון מחליט על שאלות 1–3
2. שירה מממשת frontend behavior לפי ההחלטה (ב-`addComment` ו-`moderateCommentAsync` ב-index.html)
3. curl test חי לפני merge
4. learnings.md SF-001 → מעדכנת: "thresholds אושרו, תאריך, commit"
