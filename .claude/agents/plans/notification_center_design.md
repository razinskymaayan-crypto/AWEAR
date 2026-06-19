# Notification Center — Visual Design Brief

**כיוון:** מארק | **תאריך:** 2026-06-19 | **ביצוע:** דולצ'ה | **QA:** גבאנה

---

## מה זה

Panel/screen שמציג likes, comments, follows שהמשתמש קיבל.
Backend קיים: `shira — feat/notifications-endpoint` (commit b742435) — GET /api/notifications/{user_id}, POST /api/notifications/{user_id}/read-all, unread count, unread_only param.

---

## Entry point — Bell icon בheader

```css
.notif-bell-btn {
  position: relative;
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  background: var(--surface, #1e1a22);
  border-radius: var(--r-md, 12px);
  border: none; cursor: pointer;
}
.notif-badge {
  position: absolute; top: 6px; right: 6px;
  min-width: 16px; height: 16px;
  background: var(--accent, #e8526a); color: var(--fg, #fbfbfd);
  font-size: var(--t-micro, 11px); font-weight: 700;
  border-radius: 8px; padding: 0 4px;
  display: flex; align-items: center; justify-content: center;
}
```

הערה לדולצ'ה: כפתור Bell נמצא ב-static HTML header — icon() לא עובד ב-static HTML. השתמשי ב-inline SVG ישיר (DS-008). icon('bell',20) רק אם הכפתור נוצר ב-JS template literal.

---

## Notification item anatomy

```
[avatar/icon 40px] [content flex-1] [time muted t-micro] [unread dot 8px accent]
```

```css
.notif-item {
  display: flex; align-items: flex-start;
  gap: var(--space-3, 12px);
  padding: var(--space-3, 12px) var(--space-4, 16px);
  background: var(--card, #1a1625);
  border-bottom: 1px solid var(--line, #2e2836);
  transition: background var(--motion-fast, 150ms);
}
.notif-item.unread { background: color-mix(in srgb, var(--accent, #e8526a) 6%, var(--card, #1a1625)); }
.notif-avatar { width:40px; height:40px; border-radius:999px; object-fit:cover; }
.notif-icon { width:40px; height:40px; border-radius:var(--r-md,12px); background:var(--surface, #1e1a22); display:flex; align-items:center; justify-content:center; }
.notif-text { flex:1; font-size:var(--t-body,14px); color:var(--fg, #fbfbfd); line-height:1.4; }
.notif-text strong { font-weight:700; }
.notif-time { font-size:var(--t-micro,11px); color:var(--muted, #8a8498); white-space:nowrap; }
.notif-unread-dot { width:8px; height:8px; border-radius:4px; background:var(--accent, #e8526a); align-self:center; }
```

כל var() עם fallback — DS-004 חובה.

---

## Types

| type | icon | copy pattern |
|------|------|--------------|
| like | icon('heart',16) — var(--accent, #e8526a) | **[שם]** אהב/ה את הלוק שלך |
| comment | icon('messageCircle',16) — var(--fg, #fbfbfd) | **[שם]** הגיב/ה: "[טקסט]..." |
| follow | icon('userPlus',16) — var(--accent2, #c4714a) | **[שם]** התחיל/ה לעקוב |

icon() משמש ב-.notif-icon container (JS template literal) — לא inline ב-HTML סטטי (DS-008).

---

## Empty state

per empty_states_design.md — Notifications row:

- icon: `icon('bell', 48)`, color: `var(--muted)`
- title: "אין עדכונים" — `var(--t-h2)`, `var(--fg)`, font-weight:700
- body: "כאן יופיעו likes ותגובות" — `var(--t-body)`, `var(--muted)`, max-width:240px
- CTA: אין

CSS: `.empty-state` per empty_states_design.md — אין סטייה מהpattern הקיים.

---

## Panel vs screen

### Web
- Bottom-sheet panel מה-bell icon
- max-height: 60vh; width: 320px
- backdrop-filter: blur(12px)
- z-index: var(--z-modal, 200)
- animation: slide-up var(--motion-fast, 150ms)

### Mobile (React Native)
- מסך נפרד: NotificationsScreen
- כניסה: bell icon ב-header של FeedScreen
- ניווט: Stack navigator (לפי MB-002 — תיאום רועי+וראן לפני dispatch)

---

## Interaction

- Tap על notif-item: מנווט ל-post/profile הרלוונטי + marks as read
- Swipe-to-dismiss (מובייל): הסרת notif מה-list — swipe בלבד, אין כפתור X
- "סמן הכל כנקרא": link text בראש הlist — POST /api/notifications/{user_id}/read-all
- unread dot נעלם אחרי read (optimistic update)

---

## אסור בהחלט

- אין emoji ב-type icons — icon() בלבד (DS-006)
- אין כפתור "X" על כל notification — action destructive, רק swipe-to-dismiss
- "אין עדכונים" — אך ורק per empty_states_design.md, לא copy improvised
- אין hardcoded hex (DS-001, DS-005)
- אין font-size hardcoded (OW-005, typography migration הושלם)
- אין emoji ב-copy strings (DS-010)

---

## הוראות לדולצ'ה

לפני כתיבה:
1. בדקי שכל icon בשימוש קיים ב-`ICONS` object: heart, messageCircle, userPlus, bell (DS-007)
2. Bell ב-static HTML header → inline SVG, לא icon() (DS-008)
3. כל var() עם fallback (DS-004)
4. כל copy דרך i18n key — אין hardcoded strings (MB-003)

Self-check לפני review request לגבאנה (DS-002):
- grep emoji = 0
- grep hardcoded hex = 0
- grep hardcoded font-size = 0
- .notif-bell-btn width/height = 44px (touch target)
- notif-item: DS-004 fallback על כל var()

---

## הוראות לגבאנה (QA checklist)

**P0:**
- [ ] אין emoji ב-icons (DS-006)
- [ ] אין כפתור X על notification
- [ ] empty state = בדיוק per empty_states_design.md (icon bell/48, "אין עדכונים", "כאן יופיעו likes ותגובות")
- [ ] Bell icon: ב-static HTML = inline SVG; ב-JS template = icon() (DS-008)
- [ ] כל var() עם fallback (DS-004)
- [ ] אין hardcoded hex חדשים (DS-001)

**P1:**
- [ ] .notif-bell-btn: width:44px, height:44px (touch target ≥44px — R-004)
- [ ] .notif-avatar: 40px, border-radius:999px
- [ ] unread dot: 8px accent, נעלם אחרי read
- [ ] "סמן הכל כנקרא" קיים וחיבור POST /api/notifications/{user_id}/read-all עובד
- [ ] Panel web: backdrop-blur + z-index var(--z-modal)
- [ ] שאלת העל: "יעלה ב-Instagram story?" (DESIGN_STANDARDS.md)
