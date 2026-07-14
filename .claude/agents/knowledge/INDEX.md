# Knowledge INDEX — AWEAR Agent Learning Codes
> Entry point לכל סוכן. מצא את הקודים הרלוונטיים לתפקידך, ואז קרא את הקובץ המלא.
> **Single source of truth לכל קוד לימוד — כולל OW-* שקיים רק ב-[[OW.md]].**
> **אכיפה מכנית (OW-006):** DS-004/DS-008/DS-009 + הגנת קבצי-סוד נאכפים ב-PreToolUse hooks (`scripts/hook_pretool_guard.py`, `scripts/hook_bash_guard.py`); SQLi/secrets/invariants ב-`scripts/guard_checks.sh` בשער jeff-merge. בדיקות: `python3 scripts/test_hooks.py`.

---

## Org-Wide (כל סוכן חייב לקרוא)

| קוד | תקציר | קובץ |
|-----|--------|------|
| OW-001 | Rename = grep 3 שכבות (app.py + index.html + mobile/) לפני merge | [[OW.md]] |
| OW-002 | "הושלם" ≠ "נבדק" — DoD מפורש, לא הצהרה | [[OW.md]] |
| OW-003 | תיאום לפני עבודה על קבצים משותפים — קרא activity_log קודם | [[OW.md]] |
| OW-004 | יודע שהכלי קיים ≠ מפעיל אותו — בדוק skills בתחילת task | [[OW.md]] |
| OW-005 | תשתית קיימת ≠ בשימוש — grep לפני דיווח coverage | [[OW.md]] |
| OW-006 | כלל ללא מנגנון אכיפה = המלצה בלבד | [[OW.md]] |
| OW-007 | מיפוי live-data: לפתור שדה אמיתי, לא לקודד קבוע (`category:'top'` bug) | [[OW.md]] |
| OW-008 | לחווט ל-DOM לפי ה-class האמיתי מאתר ה-render (`.fca-ico` vs `.fca-icon`) | [[OW.md]] |
| OW-009 | grep למערכת קיימת-אך-לא-מחווטת לפני בנייה חדשה (orphaned comment sheet) | [[OW.md]] |
| OW-010 | סוכנים במקביל על קובץ-ענק = worktrees + עוגני-CSS נפרדים, merge בטור | [[OW.md]] |
| OW-011 | אנטי-זגזוג — לא לחזור לאזור שכבר טופל; polish=נמוך, 1/ריצה; spec נעול | [[OW.md]] |
| OW-012 | שאל אל תנחש — FOUNDER_QUESTIONS יומי; directive שעונה = עדיפות עליונה | [[OW.md]] |
| OW-013 | מיזוג בטור: gate diff/reset מול $BASE פר-ענף, לא origin/main; תיקון gate = notes/*.patch + הסלמה למייסד | [[OW.md]] |

---

## Backend + Integration (סאם, אורן)

| קוד | תקציר | קובץ |
|-----|--------|------|
| BE-001 | Rename → backend-rename-safety skill → grep 3 שכבות → commit | [[be.md]] |
| BE-002 | look_total_usd — fallback מעורב ILS/USD נותר פתוח | [[be.md]] |
| BE-003 | Schema owner = סאם. Integration = אורן. לא מתחלפים | [[be.md]] |
| BE-004 | in-memory store → SQLite: init_db() + _get_db() + row_factory | [[be.md]] |
| BE-005 | saves/bookmarks/likes = SQLite מיום ראשון, לא in-memory | [[be.md]] |
| BE-006 | `user_key = (request.client.host if request.client else None) or "anon"` — בכל endpoint חדש | [[be.md]] |
| BE-IDEMPOTENT | כתיבת כסף/קרדיט = idempotency key (`client_ref`, SELECT-before-INSERT) | [[be.md]] |
| BE-TAG-INTEGRITY | הפניות id בין קבצים = orphan check פרוגרמטי + cache reload + curl verify | [[be.md]] |
| BE-DIAG-LIVENESS | "key configured" ≠ "key works" — probe אמיתי opt-in עם error enum | [[be.md]] |

---

## Design System (נטה, דולצ'ה, גבאנה)

| קוד | תקציר | קובץ |
|-----|--------|------|
| DS-001 | Token קיים ≠ token בשימוש — grep מספרי לפני "coverage" | [[ds.md]] |
| DS-002 | P0-filers: self-check לפני גבאנה (emoji? hardcoded hex? placeholder?) | [[ds.md]] |
| DS-003 | Audit ללא commit+screen+breakpoint = audit חלקי | [[ds.md]] |
| DS-004 | CSS fallback חובה לכל var() — `var(--token, exact-fallback)` | [[ds.md]] |
| DS-005 | Token קיים ≠ ערך נכון — WCAG check + screenshot לפני merge | [[ds.md]] |
| DS-006 | Emoji עוקפות icon system — `icon()` תמיד, לא emoji ישיר | [[ds.md]] |
| DS-007 | CDN לא נדרש — icon חדש → SVG path ל-ICONS object | [[ds.md]] |
| DS-008 | `icon()` רק ב-JS template literals — Static HTML = inline SVG | [[ds.md]] |
| DS-009 | font-size על image container = placeholder ghost — הסר | [[ds.md]] |
| DS-010 | `search_query` > emoji בdata objects — productImage() לא משתמש ב-emoji | [[ds.md]] |
| DS-011 | RefreshControl ב-RN: CSS vars לא עובדות, tokens.js כן | [[ds.md]] |
| DS-012 | emoji ב-SF_ITEMS ו-STYLISTS_DATA = debt ידוע — grep לפני cycle | [[ds.md]] |
| DS-013 | Gabbana audit = git diff (~8K tokens), לא קובץ שלם (~82K) | [[ds.md]] |
| DS-014 | Light mode = החלטת board. כל קומפוננט חדש עובד בשני מצבים | [[ds.md]] |
| DS-015 | Benchmark = Instagram + Pinterest + Zara (לא TikTok/Depop/Linear) | [[ds.md]] |
| DS-016 | פריט שנקנה/נסרק חייב לשאת image_url עד הארון (כל w.unshift) | [[ds.md]] |
| DS-017 | כל avatar img חיצוני חייב onerror→avatarFallback, לא רק product images | [[ds.md]] |
| DS-018 | mobile bottom-sheet: drag-to-dismiss על רצועת-ידית בלבד, לא scroll-trap | [[ds.md]] |
| DS-019 | awear-tokens.json = פלטת DARK בלבד (mobile מייבא); light רק ב-tokens.css/app.css | [[ds.md]] |
| DS-020 | Contrast fix = background math, לא opacity/text-shadow — דרוש ratio מחדש ב-theme הרנדר בפועל | [[ds.md]] |

---

## Mobile (וראן, דנה, רועי)

| קוד | תקציר | קובץ |
|-----|--------|------|
| MB-001 | stall-escalation = וראן מפעיל (לא IC), 48h ללא commit = alert | [[mb.md]] |
| MB-002 | Navigation + state management = מחליטים לפני dispatch, לא אחרי | [[mb.md]] |
| MB-003 | "האפליקציה באנגלית" ≠ i18n הושלם — t() + 0 Hebrew hardcoded | [[mb.md]] |
| MB-004 | CameraScreen: expo-image-manipulator חסר + capturedPrimaryButton ללא onPress | [[mb.md]] |

---

## Social Features (שירה)

| קוד | תקציר | קובץ |
|-----|--------|------|
| SF-001 | Moderation severity thresholds = product decision (איילון), לא engineering | [[sf.md]] |
| SF-002 | "קוד moderation קיים" ≠ "עובד" — curl test חובה לפני "done" | [[sf.md]] |
| SF-003 | ANTHROPIC_API_KEY חסר = fail-open — **P0 לפני production** | [[sf.md]] |
| SF-004 | אין HTTP calls בתוך async ASGI endpoints — קרא לפונקציה ישירות | [[sf.md]] |
| SF-AVATAR-01 | initials avatar = render inline span, לא onerror placeholder (gif תקין לא מפעיל onerror) | [[sf.md]] |

---

## Management (ג'ף, סטיב, איילון, מארק, וראן)

| קוד | תקציר | קובץ |
|-----|--------|------|
| MG-001 | מנהל שמגיע ריק ל-Board Sync = bottleneck מוסווה | [[mg.md]] |
| MG-002 | dispatch ישיר לIC מעל מנהל = פינוי שכבת ניהול | [[mg.md]] |
| MG-003 | ממצא בלי proposal = תרומה חלקית (בעיה + הצעה + מי מבצע) | [[mg.md]] |
| MG-004 | Scope report פותח cycle, לא סוגר — action list, לא status | [[mg.md]] |
| MG-005 | CTO audit ידני = process failure — תקן תהליך, לא רק באג | [[mg.md]] |
| MG-006 | State A (ג'ף מחליט) vs State B (ג'ף מבצע) — תעד בכל dispatch | [[mg.md]] |

---

## Product (איילון)

| קוד | תקציר | קובץ |
|-----|--------|------|
| PR-001 | Scope report = action list (סוכן | scope | status | חסם | action) | [[mg.md]] |

---

## CEO / Strategy (ג'ף)

| קוד | תקציר | קובץ |
|-----|--------|------|
| CE-001 | שאלת פתיחה קנונית: "מה ג'ף צריך להחליט? מה מואצל?" — ראשון בכל cycle | [[mg.md]] |
| CE-002 | בעיה מבנית = שלוש שכבות בו-זמנית, לא תיקון סדרתי | [[mg.md]] |

---

## Intelligence / מודיעין (Scout)

| קוד | תקציר | קובץ |
|-----|--------|------|
| IN-001 | DEDUP FIRST — `intel_db.py known "<topic>"` לפני כל WebSearch; ידוע → קרא doc | [[in.md]] |
| IN-002 | תקרת fetch ≤6 לריצה — עומק על מקור אחד > סריקה רדודה | [[in.md]] |
| IN-003 | API רשמי/affiliate/RSS בלבד — אין scraping מאחורי login / עקיפת robots | [[in.md]] |
| IN-004 | כל תובנה נסגרת — priority=impact*confidence-effort → בוצע או הוסלם, לא תלויה | [[in.md]] |
| IN-005 | אסקלציה = רק אסטרטגי/בלתי-הפיך; כל השאר Scout מבצע לבד | [[in.md]] |
| IN-006 | מקור → Loop stage; מודיעין שלא מקדם לולאה = polish נמוך | [[in.md]] |
