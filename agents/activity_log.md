# agents/activity_log.md — יומן פעילות סוכנים

> פורמט: `[תאריך] | [סוכן] | [branch] | [סטטוס] | [תיאור]`

---

## 2026-06-19

| תאריך | סוכן | branch | סטטוס | תיאור |
| 2026-06-19 | roei | feat/feed-screen-mobile | הושלם | Cycle 1 MB-003: FeedScreen.js — FlatList 3 hardcoded cards, getItemLayout (SLOT_HEIGHT=456), removeClippedSubviews:true, initialNumToRender:8, maxToRenderPerBatch:4, windowSize:5. feed namespace en.json+he.json (3 keys). interpolate() helper לcount. App.js מחובר. grep Hebrew=0, t() fallback=0. commit: 5b2077b |
|-------|------|--------|-------|-------|
| 2026-06-19 | sam | feat/cycle-1-backend | הושלם | Cycle 1 Phase 4: rate limiting (analyze:5/min, outfit:10/min, chat:20/min) + structured request logging middleware ב-app.py. commit: 33b0465 |
| 2026-06-19 | oren | fix/look-total-usd | הושלם חלקית | BE-002: 2/3 מקומות תוקנו — שורות 2118, 2150 (look grid + shop-look button): ₪ → $. שורה 2305 (feed buy button) דחויה: post.price (ILS) \|\| look_total_usd (USD) fallback — דורש החלטת schema מסאם לפני שינוי סימן. commit: 7244a7b |
| 2026-06-19 | steve | feat/cycle-1-data-integration | approved + merged | Cycle 1: חיבור data files לUI — loadFeedData + loadProducts עם async/await תקין, fallback ל-SEED_POSTS/SHOP_SEED, schema mapping תואם renderFeed/renderShopGrid. נמזג ל-main. הערת חוב: renderShopGrid מציג ₪${it.price} אבל price=price_estimate_usd (דולר) — BE-002 חוב ידוע, cycle הבא. |
| 2026-06-19 | dana | fix/camera-compression-onpress | הושלם | Cycle 1 MB-004: expo-image-manipulator@^56.0.19 הותקן, compressForUpload(uri) נוסף (resize 1080px, JPEG 0.7, target <400KB), capturedPrimaryButton קיבל onPress עם compress→navigate('Wardrobe', { newImageUri }). commit: 00a8d05 |
| 2026-06-19 | ayalon | agents/plans | הושלם | SF-001: אישור moderation thresholds של שירה — MEDIUM = גלוי ל-poster בלבד (shadow-moderation, OR), HIGH = admin_log בלבד ללא push, reviewer = ג'ף דרך admin panel. readiness לפרודקשן תלויה ב-curl test + CI — עדיין פתוח לשירה. קובץ: agents/plans/moderation_thresholds_proposal.md |
| 2026-06-19 | ayalon | agents/plans | הושלם | Spec P1: skeleton loading לדולצ'ה — Shopping Feed ראשון, shimmer animation עם CSS tokens, הגדרת skeleton vs empty state, Playwright DoD. קובץ: agents/plans/skeleton_loading_spec.md |
| 2026-06-19 | ayalon | agents/plans | הושלם | Spec P1: style filter chips לדולצ'ה — 8 chips + הכל, OR multi-select, localStorage persistence, חיבור ל-activeFilter logic קיים, Playwright DoD. קובץ: agents/plans/style_chips_spec.md |
