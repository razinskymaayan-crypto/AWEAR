# AWEAR — Research Index
> לפני מחקר חדש — בדוק כאן קודם. אם הנושא נחקר — קרא את ה-doc, אל תשחזר.
> **קבצים deprecated (אל תשלח agents לקרוא אותם):** `docs/DESIGN_STANDARDS.md`, `docs/COLOR_SYSTEM.md`, `docs/ICON_SYSTEM.md` — כולם מוחלפים על ידי `docs/VISUAL_VISION.md`.

---

### R-001 | UX של רשתות חברתיות — Instagram, TikTok, Pinterest, Depop, Vinted
**תאריך:** 19.06.2026 | **מבצע:** מארק | **קובץ:** `docs/UX_RESEARCH.md`
**תמצית:**
- ניווט נוכחי (Home/חיפוש/FAB/פיד/ארון) תואם את הפרדיגמה — אין צורך לשנות סדר
- פיד לוקים: masonry 2-col (4:5 ratio) — לא grid ריבועי
- Marketplace card חסר: condition badge, size, seller handle, heart button
- 5 מיקרו-אינטראקציות P0: double-tap like, skeleton loading, swipe-to-dismiss sheets, shared element transition, filter chips horizontal scroll
- Pinterest/TikTok onboarding: ≤5 screens, value demonstration לפני sign-up

### R-002 | פסיכולוגיה של צבע לאפליקציות אופנה
**תאריך:** 19.06.2026 | **מבצע:** נטה | **קובץ:** `docs/VISUAL_VISION.md` Part B (הוחלף — לא COLOR_SYSTEM.md)
**תמצית:**
- Dark mode = תשתית ויזואלית: תמונות בולטות, תחושת premium
- Dual accent: rose #e8526a (like/buy/follow) + terracotta #c4855a (tag/category/price)
- CTA: saturation 60-70% = premium. >80% = flash sale perception
- הפלטה ב-`static/tokens.css` (source of truth)

### R-003 | מערכת Icons לAWEAR
**תאריך:** 19.06.2026 | **מבצע:** מארק | **קובץ:** `docs/VISUAL_VISION.md` Part F (הוחלף — לא ICON_SYSTEM.md)
**תמצית:**
- AWEAR יש `ICONS` object + `icon()` function — אין צורך בlibrary חיצונית
- Stroke weight: 1.5px עקבי. Hit targets: ≥44px
- icon חדש → הוסף SVG path ל-ICONS object (לא CDN)

### R-004 | כללי עיצוב AWEAR — enforcement rules
**תאריך:** 19.06.2026 | **מבצע:** ג'ף + ישיבת מנהלים | **קובץ:** `docs/VISUAL_VISION.md` Part I (הוחלף — לא DESIGN_STANDARDS.md)
**תמצית:** אפס emoji UI chrome, productImage() לכל card, typography var(--t-*), רשת 8pt, :active feedback
**benchmark:** Instagram + Pinterest + Zara — ראה DS-015

### R-005 | מאגר מוצרי אופנה + פרופילים
**תאריך:** 19.06.2026 | **קבצים:** `static/data/products.json`, `static/data/profiles.json`, `static/data/posts.json`
**תמצית:** 65 מוצרים / 20 פרופילים / 40 פוסטים — ראה `static/data/README.md`
