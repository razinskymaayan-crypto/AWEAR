# Activity Log — מעקב בורד על תפקוד סוכנים
## מתחיל מ-17.06.2026 (לא רטרואקטיבי — מהשלב הזה ואילך, לפי הנחיית כרמל)

---

## מטרה

לכל פעולה שמתבצעת בחברה — מי ביצע (סוכן/מחלקה), מה המשימה, מה הסטטוס, ומה ההוכחה הניתנת לאימות (agentId, commit hash, קובץ פלט). לא תיאור נרטיבי — שורה אחת שהדירקטוריון יכול לעקוב אחריה ולבדוק.

**כלל:** כל delegation אמיתי (Agent tool, לא ג'ף מבצע ומייחס) נכנס לכאן בזמן אמת, לא בדיעבד.

---

## 🟢 עובדים כרגע (live status — לפי הנחיית כרמל 18.06.2026)

| סוכן | משימה | agentId | משוגר ב- |
|------|--------|---------|----------|
| — אין משימות פעילות כרגע — | | | |

*שורה נכנסת לכאן **בדיוק** ברגע השיגור, ויוצאת ברגע שהתוצאה חוזרת (עוברת לטבלה הראשית למטה עם סטטוס סופי). אם משהו מופיע כאן הרבה זמן בלי לזוז — זה התקע, ולא משהו שצריך לשאול את כרמל אם לבדוק.*

---

## טבלה

| תאריך | סוכן | מחלקה | משימה | סטטוס | הוכחה |
|-------|------|--------|--------|--------|--------|
| 2026-06-17 | שירה | Social Features (תחת איילון) | מימוש Claude-based comment moderation — `/api/moderate` + wiring ל-`addComment` | **הושלם ומוזג ל-main** — ג'ף בדק diff, אימת חי (curl + regression 17 מסכים), מיזג | agentId `a5454c1d4ed9274bc`, commit מקורי `de309a6`, מוזג כ-`b3f682c` על `main` |
| 2026-06-17 | נטה | Design System (תחת מארק) | הערכת migration לפלטת `tokens.css` (`--bg`/`--card`/`--line`/`--muted`) | **הושלם — המלצת NO-GO**, לא דרוש מיזוג (לא שינתה קבצים חיים) | agentId `a22dab301e0627d97`, מסמך המלצה: `agents/netta_tokens_recommendation_2026-06-17.md`, צילומי מסך ב-`/tmp/netta_tokens_screens/` |
| 2026-06-17 | נטה (המשך) | Design System (תחת מארק) | יישום ה"תיקון האמיתי" שנטה עצמה זיהתה: עדכון `tokens.css`/`awear-tokens.json` כך שיתאימו לערכים החיים/תקניים מ-`DESIGN_STANDARDS.md` (לא `index.html`) | **הושלם** — `--bg`/`--card`/`--line`/`--muted` תוקנו ב-2 הקבצים, `index.html` לא נגע, אומת ויזואלית (Playwright pixel-diff: זהה לחלוטין) | commit ראה git log |
| 2026-06-18 | דנה | RN Eng (תחת וראן) | משימה ראשונה זעירה במתכוון (כלל stall-escalation): הקמת RN project skeleton שרץ בפועל על סימולטור/web | **הושלם ומוזג ל-main** — ג'ף בדק diffstat (skeleton תקני של Expo init, package-lock + assets), מיזג ב-`--no-ff`, worktree/branch נוקו | agentId `aac02f0ec1dd6c3be`, commit מקורי `161466f`, מוזג ל-`main` |
| 2026-06-18 | רועי | RN Eng + i18n (תחת וראן) | תוכנית מסך-מסך ל-wiring של 614 המחרוזות ב-web — **תכנון בלבד, לא ביצוע** | **הושלם** — מצא בפועל 552 שורות / 8,429 תווים עברית ב-JS render + 418 בHTML סטטי; גילה ש-`static/i18n/en.json`/`he.json` כבר קיימים אך **לא מחוברים בכלל** (0 שימושים); תוכנית מסך-אחר-מסך לפי traffic, אומתה מתודולוגית מול Iron Rule #9 | agentId `a7e847ded843156c9`, מסמך: `agents/roei_i18n_plan_2026-06-18.md` |
| 2026-06-18 | שירה | Social Features (תחת איילון) | סגירת 2 hard rules שדיווחה כ-out-of-scope במשימה הקודמת: rate limiting (3 תגובות/דקה) + report button | **הושלם ומוזג ל-main** — ג'ף בדק diff (67 שורות, index.html בלבד), אומת חי ע"י הסוכן ב-Playwright (4 תגובות מהירות→4ית נחסמה, report button→admin log+toast), commit כבר על main | agentId `afdf0a54fa31a7f3f`, commit `9b67c80` (ישירות על main — ⚠ לא עבר worktree isolation, פער תהליך מתועד) |
| 2026-06-18 | אורן | Integration (תחת סטיב) | תוכנית currency layer (price_estimate_ils → multi-currency) — **תכנון בלבד, לא ביצוע** | **הושלם** — מצא ~70 מקורות ₪ ב-index.html + בעיית לוגיקה אמיתית (סף CPW בש"ח, לא רק תצוגה) + סתירה קיימת בקוד (`price_estimate_ils` בפועל ב-USD לפי הפרומפט בעצמו); תוכנית `{amount,currency}` + שאלות פתוחות לאיילון/בורד | agentId `aa6463489570de462`, מסמך: `agents/oren_currency_plan_2026-06-18.md` |

| 2026-06-18 | איילון | Product Direction | הכרעת מוצר ב-6 שאלות פתוחות מתוכניות אורן/רועי (currency canonical, FX vendor, resale %, סדר i18n, chat copy review, admin scope) | **הושלם** | agentId `a8b56b3ce0c27c179`, מסמך: `agents/ayalon_product_decisions_2026-06-18.md` |
| 2026-06-18 | דנה | RN Eng (תחת וראן) | מסך הרשאת מצלמה (onboarding) — לפי ה-roadmap העצמי שלה | **הושלם ומוזג ל-main** — אומת ע"י בנדל Metro web + grep על תוכן הבנדל (אין Chromium בסביבה ל-screenshot); iOS/Android אמיתי **לא נבדק**, מתועד ב-README | agentId `ab104b63d0ffb8998`, commit `134f65f` |
| 2026-06-18 | דולצ'ה+גבאנה | Design (תחת מארק) | Phase 2 המשך — מיפוי אימוג'י מושגי/אבסטרקטי (quiz, onboarding, trending) לאייקוני SVG | **הושלם ומוזג ל-main** — Playwright before/after לכל מסך, 0 pageerror, ספוט-צ'ק נוסף שלי על main לאחר מיזוג: 0 errors | agentId `a19d5c96a5c5b43a4`, commit `0afd932` |

| 2026-06-18 | דולצ'ה+גבאנה+נטה | Design (תחת מארק) | Phase 3: עיצוב מחדש עריכתי ל-onboarding+home לפי הנחיית הבורד ("הרגשה זולה") | **הושלם ומוזג ל-main** — peer review אמיתי (נטה תפסה drift בטוקנים/grid, גבאנה אישרה תאימות ל-DESIGN_STANDARDS + דגלה 2 אימוג'י קיימים מראש כ-follow-up), Playwright before/after, 0 pageerror | agentId `a10cfa3434df18038`, commit `d5578b3`, מוזג כ-`81...` (ראו git log) |
| 2026-06-18 | רועי | RN Eng + i18n (תחת וראן) | מימוש בפועל של מתג שפה עברית/אנגלית (nav+onboarding+home), Phase 0 מתוכניתו | **הושלם ומוזג ל-main** — דרש פתרון ידני של 8 קונפליקטים מול עבודת דולצ'ה (ענף ישן, לא rebase) — ג'ף פתר תוך שמירה על שני הצדדים (עיצוב עריכתי + i18n), הוסיף תרגומי kicker חדשים, אומת Playwright (he↔en, RTL/LTR flip, persistence) | agentId `a5302031ae5bd95e3`, commit `00889ca` |

**⚠ ממצא תהליכי (לא שגיאת קוד, שגיאת ג'ף):** דיספאצ' כושל קודם (agentId `adb7654256bcba82f`) הותיר draft חצי-גמור ולא-מחויב (uncommitted) ישירות ב-checkout הראשי, ככל הנראה כי ה-prompt נתן path מוחלט (`/Users/tamargrosz/AWEAR/static/index.html`) שמתעלם מבידוד ה-worktree. נמצא לפני המיזוג, נשמר ב-stash, נבדק (זוהה כ-draft מוקדם יותר וגרוע יותר של אותו רעיון, מוחלף לחלוטין ע"י הגרסה הסופית), נמחק. **לתיקון קדימה:** prompts לסוכנים שכותבים קוד לא יכללו path מוחלט לריפו הראשי כהנחיה לעריכה — רק כקונטקסט לקריאה.

---

## איך זה עובד בפועל

1. ג'ף מזהה משימה שצריכה ביצוע אמיתי (לא רק החלטה).
2. ג'ף שולח אותה ל-Agent tool, עם framing מפורש של התפקיד הרלוונטי (לדוגמה "את שירה, Social Features Engineer") וקונטקסט מלא — כי הסוכן לא רואה את השיחה הזו.
3. שורה נכנסת לטבלה הזו **כשהמשימה משוגרת**, לא רק כשהיא חוזרת — כדי שאם סוכן נתקע, זה נראה.
4. כשהתוצאה חוזרת — ג'ף מעדכן את הסטטוס (הושלם / נתקע / נדחה) ומוסיף את ההוכחה.
5. עבודה בworktree עוברת review ואינטגרציה מפורשת של ג'ף לפני merge ל-main — זה לא אוטומטי, וזה עצמו מתועד.
