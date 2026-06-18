# agents/activity_log.md — יומן פעילות סוכנים

> פורמט: `[תאריך] | [סוכן] | [branch] | [סטטוס] | [תיאור]`

---

## 2026-06-19

| תאריך | סוכן | branch | סטטוס | תיאור |
|-------|------|--------|-------|-------|
| 2026-06-19 | sam | feat/cycle-1-backend | הושלם | Cycle 1 Phase 4: rate limiting (analyze:5/min, outfit:10/min, chat:20/min) + structured request logging middleware ב-app.py. commit: 33b0465 |
| 2026-06-19 | oren | fix/look-total-usd | הושלם חלקית | BE-002: 2/3 מקומות תוקנו — שורות 2118, 2150 (look grid + shop-look button): ₪ → $. שורה 2305 (feed buy button) דחויה: post.price (ILS) \|\| look_total_usd (USD) fallback — דורש החלטת schema מסאם לפני שינוי סימן. commit: 7244a7b |
