# IN — Intelligence (מודיעין) Knowledge

> קובץ הדומיין של Scout ([[scout.md]]). קטלוג המקורות + כללי מודיעין שמצטברים.
> תובנה גולמית → `intel_insights` (דרך `scripts/intel_db.py`). דפוס שמשנה איך בונים → קוד IN כאן + שורה ב-[[INDEX.md]].

---

## קטלוג מקורות — על מה חולשים ואיך מגיעים

| סוג (`source_type`) | מקורות | ניתוב | Loop stage שמוזן |
|---------------------|--------|-------|------------------|
| `competitor` | Whering, Acloset, Save Your Wardrobe, Depop, Vinted, LTK, Grailed | WebSearch/WebFetch (דפי שיווק/UX ציבוריים) + app-store review APIs | MATCH, LOOKS, EARN |
| `trend` | Google Trends, Pinterest Trends, editorial (Vogue/Zara lookbooks), Pantone/color forecasts | API (`pytrends`) → אחרת WebFetch | MATCH, LOOKS |
| `pricing` | רשתות affiliate, retailer עם API רשמי, resale prices ציבוריים (Vinted/Depop listings) | **API/affiliate רשמי בלבד — לא scraping** | BUY, EARN |
| `social` | App Store + Google Play reviews (סנטימנט מתחרים), Reddit (r/femalefashionadvice), YouTube | review-API/RSS ציבורי + WebSearch | הכל (פערי-פיצ'ר) |
| `tech_ux` | changelogs של מתחרים, Mobbin, GitHub trending | WebFetch (דפים ציבוריים) | LOOKS, כללי |
| `other` | weather×occasion (יש תשתית weather) → MATCH; creator drops (LTK/TikTok Shop) → trend velocity | mixed | MATCH, BUY |

**עיקרון:** כל מקור ממופה לשלב ב-Loop — מודיעין מזין את הצפון (SCAN→MATCH→LOOKS→BUY→EARN), לא רק wiki.

---

## קודי IN

| קוד | כלל | הערה |
|-----|-----|------|
| IN-001 | **DEDUP FIRST** — `intel_db.py known "<topic>"` לפני כל WebSearch. ידוע → קרא doc, אל תשחזר | מונע פיצוץ טוקנים + כפילות |
| IN-002 | **תקרת fetch** — ≤6 קריאות web לריצה. עומק על מקור אחד > סריקה רדודה של עשרה | מודיעין = ~25% קיבולת, לא בור |
| IN-003 | **API רשמי בלבד** — affiliate/RSS/review-API/דפים ציבוריים. אין scraping מאחורי login, אין עקיפת robots | הכרעת מייסד נעולה; ToS + שבירות |
| IN-004 | **כל תובנה נסגרת** — priority=impact*confidence-effort → בוצע (INBOX/IDEAS) או הוסלם (FOUNDER_QUESTIONS). לא נשארת תלויה | טבלת החלטה ב-scout.md |
| IN-005 | **אסקלציה = רק אסטרטגי/בלתי-הפיך** — כל השאר Scout מבצע לבד. שומר על רעש נמוך למייסדים | הכרעת מייסד |
| IN-006 | **מקור → Loop stage** — כל תובנה מסומנת loop_stage; מודיעין שלא מקדם את הלולאה = polish, נמוך | תואם כלל העל של CYCLE_PROTOCOL |

---

## מבנה המאגר (intel_insights)
`scripts/intel_db.py` — CLI: `known` (dedup) · `add` (insert) · `score` (priority) · `set-status` · `list`.
עמודות מפתח: `topic` (slug ל-dedup), `source_type`, `loop_stage`, `impact/confidence/effort` (1-5), `status` (new→deliberating→acted|escalated|parked|superseded), `proposal`, `doc_path` (→ synthesis ב-docs/research/).

*נוצר: 04.07.2026 — Phase 1 של Intelligence Base.*
