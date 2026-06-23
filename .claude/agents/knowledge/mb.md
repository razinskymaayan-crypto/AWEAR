# knowledge/mb.md — Mobile (React Native)
> **קרא גם:** [[OW.md]] (OW-001..OW-006 — Org-Wide Iron Rules, single source of truth)

## ○ MOBILE — וראן, דנה, רועי

### MB-001 | stall-escalation = וראן מפעיל, לא IC
**מקור:** varan_retrospective (2026-06-19)
**לקח:** וראן ידע על כלל הstall. לא הפעיל אותו. ה-IC (דנה/רועי) לא אמורים לדווח על עצמם שהם תקועים — זה role של מנהל המובייל.
**מנגנון (וראן):** 48 שעות בלי commit מIC — וראן מפעיל stall-escalation. לא שואל. לא מחכה.

### MB-002 | navigation stack + state management — לפני IC, לא אחרי
**מקור:** varan_retrospective (2026-06-19)
**לקח:** דנה ורועי עבדו ב-parallel בלי שהוחלט: navigation stack, state management, AsyncStorage schema. קונפליקטים אפשריים ב-merge שלא נמנעו מראש.
**מנגנון (וראן):** לפני כל dispatch ל-IC — agents/plans/ מכיל החלטת navigation + state. ללא שניהם — dispatch לא יוצא.

### MB-003 | "האפליקציה באנגלית" ≠ i18n הושלם
**מקור:** roei_retrospective (2026-06-19)
**לקח:** LOCALE='en' שונה. אבל: אין t() helper שקורא אותו בweb. 614 מחרוזות עברית hardcoded בindex.html. "האפליקציה באנגלית" היא הצהרה שקרית עד ש: t() helper מחובר + grep מחזיר 0 Hebrew strings hardcoded.
**מנגנון (רועי):** לא להכריז i18n web כ"done" ללא שני הקריטריונים. בcycle הבא: FeedScreen.js (3 cards, getItemLayout, 24h).

### MB-004 | CameraScreen — gaps קריטיים לcycle הבא
**מקור:** dana_retrospective (2026-06-19)
**לקח:** CameraScreen קיים. שני gaps קריטיים: (1) expo-image-manipulator חסר ב-package.json → אין compression, (2) capturedPrimaryButton ללא onPress → navigate לא קיים.
**מנגנון (דנה):** cycle הבא — compressForUpload(uri) + onPress → target 400KB, commit אחד.

---

