# knowledge/sf.md — Social Features
> **קרא גם:** [[OW.md]] (כל קודי OW-* — Org-Wide Iron Rules, single source of truth; אל תעצור ב-006, יש עוד)

## ○ SOCIAL FEATURES — שירה

### SF-001 | severity thresholds = product decision, לא engineering
**מקור:** shira_retrospective (2026-06-19)
**לקח:** moderation קיים בקוד (commit de309a6). severity thresholds לא אושרו על ידי איילון. זה לא "פרט טכני" — זה החלטה על מה מותר ומה אסור בפלטפורמה.
**מנגנון (שירה):** moderation לא יוצא לפרודקשן ללא sign-off של איילון על thresholds.

### SF-002 | "קוד moderation קיים" ≠ "moderation עובד"
**מקור:** shira_retrospective (2026-06-19)
**לקח:** `/api/moderate` קיים. `moderateCommentAsync()` קיים. לא נבדקו חיה עם curl. זה OW-002 ברמת הsocial domain.
**מנגנון (שירה):** לפני כל "הושלם" על feature של API — curl test + תיעוד response.

### SF-003 | ANTHROPIC_API_KEY חסר = moderation fail-open — P0
**מקור:** שירה (גילוי) + סאם (אימות), Cycle 1 Phase 4, 2026-06-19
**לקח:** /api/moderate מחזיר `{"fallback":true}` על כל input כשהמפתח חסר — כל תוכן, כולל harmful, עובר ללא בדיקה. זה לא "כשל שקט" — זה "אין moderation בכלל". גילוי מאוחר כי לא הייתה בדיקת env בהפעלה.
**מנגנון:** (1) app.py — בדיקת `ANTHROPIC_API_KEY` ב-startup + log WARNING מפורש אם חסר; (2) pre-deploy checklist: env vars required; (3) Steve/Jeff — set secret בprod env לפני כל deploy.
**status 2026-06-19:** agents/logs/api_key_alert.md נוצר. action item פתוח ל-Steve/Jeff.

---


### SF-004 | אין קריאות HTTP בתוך async ASGI endpoints
**מקור:** Iron Rule (CLAUDE.md היסטורי); קובע כאן כערך קנוני אחרי שנמצא לא-מתועד (foundation Phase 4, 2026-07-05)
**לקח:** endpoint אסינכרוני שקורא ל-endpoint אחר ב-HTTP (httpx/requests אל localhost) חוסם את ה-event loop ויוצר deadlock תחת עומס. קרא לפונקציה ישירות.
**מנגנון:** code-reviewer skill בודק; jeff-merge guard.

---

## SF-AVATAR-01 — avatarFallback() needs a FAILING img, not a valid placeholder
`avatarFallback(img)` is wired via `onerror`. A valid transparent gif (e.g. a 1x1 base64 data: URI) LOADS successfully, so `onerror` never fires and the avatar stays invisible (empty column). For seeded/initials avatars where there is no real photo URL, do NOT use an onerror placeholder — render the fallback span inline directly: `<span class="...-avatar avatar-fallback">${initials}</span>` (compute initials with `name.split(/[ .@]/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase()||'?'`). Apply the sizing class + `avatar-fallback` (gradient/centering) together. One render path = all callers consistent. (Feed comments seed, 2026-06-27.)
