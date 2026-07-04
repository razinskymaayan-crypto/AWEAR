# Plans INDEX — AWEAR
> **Last refreshed: 2026-07-05** (אימות מלא מול git log + activity_log + הקוד עצמו)
> רשימת כל הplans עם status. עדכן כאן כשplan מסתיים או נדחה.
> **לפני כתיבת plan חדש — בדוק שהנושא לא מכוסה כבר.**
> **כלל טריות (2026-07-05):** plan במצב Active שלא נגעו בו >7 ימים = חשוד כ-stale. לפני שמסתמכים עליו — אמת מול activity_log ומול הקוד; אם הוא כבר לא רלוונטי, עדכן את ה-Status שלו כאן (Stale/Done/Dropped). Status קפוא ≠ Status נכון.
>
> **הערות רוחב (2026-07-05):**
> - כל קבצי ה-plans לא נגעו מאז 2026-06-19. אין אף plan שהוא באמת "Active" היום.
> - docs/DESIGN_STANDARDS.md / COLOR_SYSTEM.md / ICON_SYSTEM.md / docs/MASTER_PLAN.md **נמחקו** — המקור העדכני: `docs/VISUAL_VISION.md` + `.claude/master/MASTER_PLAN.md`. plans שמפנים אליהם קיבלו banner אזהרה בראש הקובץ.
> - **RN/mobile רדום** (MASTER_PLAN החלטה A1: Capacitor wrap, RN נדחה post-investment) — כל plans המובייל = Parked-Dormant אלא אם בוצעו בפועל.

| קובץ | קטגוריה | Owner | Cycle | Status | תאריך | תיאור |
|------|---------|-------|-------|--------|--------|--------|
| [lucky-percolating-wind.md](lucky-percolating-wind.md) | Strategy | רזי | 0 | Reference | 2026-06-19 | North star מקורי של רזי — בסיס ל-`.claude/master/MASTER_PLAN.md` |
| [ayalon_product_decisions_2026-06-18.md](ayalon_product_decisions_2026-06-18.md) | Product | איילון | 1 | Done | 2026-06-18 | החלטות מטבע (USD), i18n rollout, resale %, commission |
| [oren_currency_plan_2026-06-18.md](oren_currency_plan_2026-06-18.md) | Backend | אורן | 1 | Done | 2026-06-18 | תוכנית מעבר multi-currency → USD. בוצע. |
| [netta_tokens_recommendation_2026-06-17.md](netta_tokens_recommendation_2026-06-17.md) | Design | נטה | 1 | Done (NO-GO) | 2026-06-17 | המלצת NO-GO על palette migration — בפועל palette אושרה ב-06-19 (mark: Mediterranean Modern APPROVED) |
| [hex_audit_cycle1.md](hex_audit_cycle1.md) | Quality | נטה | 1 | Done | 2026-06-19 | Baseline audit של hardcoded hex — 97 מקומות |
| [visual_redesign_brief.md](visual_redesign_brief.md) | Design | מארק | 1 | Done | 2026-06-19 | Brief לredesign Cycle 2 — בוצע |
| [mobile_architecture_cycle1.md](mobile_architecture_cycle1.md) | Mobile | וראן | 1 | Reference (mobile-dormant) | 2026-06-19 | ארכיטקטורת mobile — רלוונטי רק אם RN יחזור post-investment |
| [mobile_merge_checklist.md](mobile_merge_checklist.md) | Mobile | וראן | 1 | Done | 2026-06-19 | Checklist למיזוג branches דנה/רועי — בוצע (dana, 3 merges 06-19) |
| [roei_i18n_plan_2026-06-18.md](roei_i18n_plan_2026-06-18.md) | Web/i18n | רועי | 2 | Done | 2026-06-18 | i18n web בוצע: index.html כולו English (`lang="en"`, 0 שורות עברית מול 552 baseline), `static/i18n/en.json`+`he.json` קיימים, `t()` בשימוש |
| [react_navigation_plan.md](react_navigation_plan.md) | Mobile | וראן | 2 | Done (mobile-dormant) | 2026-06-19 | בוצע 06-19 (roei feat/react-navigation-install): React Navigation + Tab.Navigator ב-App.js. RN רדום מאז |
| [mobile_cycle2_backlog.md](mobile_cycle2_backlog.md) | Mobile | וראן | 2 | Parked (mobile-dormant) | 2026-06-19 | בוצע חלקית (MarketplaceScreen + camera compression 06-19); השאר קפוא — RN נדחה post-investment |
| [marketplace_mobile_spec.md](marketplace_mobile_spec.md) | Mobile | רועי | 2 | Done (mobile-dormant) | 2026-06-19 | בוצע 06-19 (roei feat/marketplace-screen): MarketplaceScreen.js grid 2-col |
| [onboarding_navigation_plan.md](onboarding_navigation_plan.md) | Mobile | וראן | 2 | Parked (mobile-dormant) | 2026-06-19 | **לא בוצע** — App.js מכיל רק Tab.Navigator, אין Stack wrap. RN רדום |
| [onboarding_spec.md](onboarding_spec.md) | Mobile | דנה | 2 | Done (mobile-dormant) | 2026-06-19 | בוצע 06-19 (dana feat/onboarding-screen): 3 שלבים + AsyncStorage + i18n, DoD עבר |
| [cycle_2_product_roadmap.md](cycle_2_product_roadmap.md) | Product | איילון | 2 | Superseded | 2026-06-19 | Cycle 2 נסגר (steve מיזג 15 branches 06-19). הוחלף ע"י `.claude/master/MASTER_PLAN.md` |
| [critique_cycle_2_criteria.md](critique_cycle_2_criteria.md) | Quality | גבאנה | 2 | Stale | 2026-06-19 | Criteria sheet ל-Cycle 2 שנסגר. audits של גבאנה ממשיכים ad-hoc (06-27/06-28) בלי המסמך |
| [marketplace_spec.md](marketplace_spec.md) | Product | איילון | 2 | Superseded | 2026-06-19 | ה-marketplace נבנה ועבר את ה-spec: deep upgrade + split Shop/Community (valentino 06-22), Community נבנה מחדש (06-28) |
| [moderation_thresholds_proposal.md](moderation_thresholds_proposal.md) | Backend | שירה | 2 | Pending-Approval (stale) | 2026-06-19 | ממתין sign-off איילון **מאז 06-19, 16 יום** — אין עדות אישור בlogs. P0 ה-API-key עדיין פתוח |
| [typography_migration_log.md](typography_migration_log.md) | Quality | נטה | 2 | Done | 2026-06-19 | בוצע במלואו 06-19 (netta feat/typography-migration): 239+157 הופעות font-size → var(--t-*) |
| [spacing_audit.md](spacing_audit.md) | Quality | נטה | 2 | Stale | 2026-06-19 | Baseline audit בלבד (366 מקומות) — אין עדות בlogs שmigration בוצע. לא נגעו מאז 06-19 |
| [tBody_alignment_question.md](tBody_alignment_question.md) | Design | מארק | 2 | Done (decided) | 2026-06-19 | הוכרע 06-19 (mark, Design Approvals): --t-body=14px, שמות tokens אפשרות A (ללא rename) |
| [empty_states_design.md](empty_states_design.md) | Design | מארק/דולצ'ה | 2 | Reference | 2026-06-19 | מדריך empty states — שימש specs אחרים (notification_center) ו-empty states שנשלחו ב-marketplace |
| [post_card_design.md](post_card_design.md) | Design | מארק/דולצ'ה | 2 | Superseded | 2026-06-19 | Feed/post עוצבו מחדש אחרת: Instagram-style redesign (06-23) + editorial passes (dolce 06-29) |
| [shopping_feed_redesign.md](shopping_feed_redesign.md) | Design | מארק/דולצ'ה | 2 | Superseded | 2026-06-19 | הוחלף ביישום בפועל: Instagram-inspired feed (06-23), shoppable feed L2 (06-26), editorial pass (06-29) |
| [wardrobe_screen_design.md](wardrobe_screen_design.md) | Design | מארק/דולצ'ה | 2 | Done (mobile-dormant) | 2026-06-19 | בוצע 06-19 (dana feat/wardrobe-screen, commit 9e78b90): WardrobeScreen מלא לפי הspec |
| [style_chips_spec.md](style_chips_spec.md) | Product | איילון | 2 | Done | 2026-06-19 | בוצע 06-23: Style filter chips — multi-select OR + localStorage persistence |
| [skeleton_loading_spec.md](skeleton_loading_spec.md) | Product | איילון | 2 | Done | 2026-06-19 | **בוצע בפועל 06-19** (dolce feat/skeleton-loading, כולל audit-fix) — הסטטוס "Deferred" הקודם היה שגוי |
| [notification_center_design.md](notification_center_design.md) | Design | מארק | 3 | Parked (partial) | 2026-06-19 | Brief נכתב; bell UI + notifications endpoint נשלחו 06-19 (oren/shira). מרכז מלא לא נבנה — קפוא |
| [profile_screen_design.md](profile_screen_design.md) | Design | מארק | 3 | Parked (mobile-dormant) | 2026-06-19 | Spec ל-ProfileScreen.js (RN) — לא יושם, RN רדום. הprofile בweb עוצב בנפרד (06-23, 06-29) |

---

## סטטוס מהיר (נכון ל-2026-07-05)

| Status | כמות | משמעות |
|--------|------|---------|
| **Done** | 15 | הושלם — עם עדות בactivity_log או בקוד |
| **Superseded** | 4 | היישום/תוכנית-אב עברו את המסמך — לא להסתמך עליו |
| **Reference** | 3 | מסמך עומד שנשאר כארכיון חי |
| **Parked** | 4 | קפוא — 3 בגלל RN dormant, 1 בוצע חלקית (notification center) |
| **Stale** | 2 | `critique_cycle_2_criteria` (Cycle נסגר), `spacing_audit` (migration לא בוצע) |
| **Pending-Approval (stale)** | 1 | `moderation_thresholds_proposal.md` — **ממתין איילון מאז 06-19** |

> **אין plans במצב Active.** 16 הרשומות שסומנו "Active" נבדקו אחת-אחת: 7 בוצעו (Done), 4 הוחלפו (Superseded), 2 קפואות (Parked), 2 Stale, 1 Reference — אף אחת לא בעבודה שוטפת. גם `tBody_alignment_question` (Pending-Decision) הוכרע ב-06-19. העבודה השוטפת מתועדת ב-`.claude/master/MASTER_PLAN.md` וב-activity_log.
