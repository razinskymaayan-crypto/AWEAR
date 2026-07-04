> ⚠️ הפניות במסמך זה ל-DESIGN_STANDARDS התיישנו — המקור העדכני: docs/VISUAL_VISION.md. תוכנית אב: .claude/master/MASTER_PLAN.md.

# Onboarding Screen Spec

**גרסה:** 1.0
**owner:** דנה (mobile IC)
**Cycle:** 2 — build stub. StyleQuiz לוגיקה = Cycle 3.
**תאריך:** 2026-06-19
**מחבר:** איילון | Product Director

---

## החלטות מרכזיות

| שאלה | החלטה | נימוק |
|------|--------|-------|
| כמה screens | 3 | R-001: Pinterest/TikTok ≤5 screens. 3 = value demonstration בלי friction. |
| CTA סופי | "Create Account" → RegisterScreen | auth endpoints קיימים (סאם, commit 0d8da55). flow ללא רשום = skip בלבד, לא flow מלא. |
| StyleQuiz בCycle 2? | stub בלבד — לוגיקת בחירה = Cycle 3 | Cycle 2 כבר מלא (P0: Navigation + Tab Bar + Skeleton). quiz דורש schema + preferences API. |
| Output | AsyncStorage `onboarding_complete: 'true'` | סטנדרט RN. בוחר בלי dependency חיצוני. |

---

## Flow

```
App launch (first time)
  └→ OnboardingScreen (slide 0: Welcome)
       └→ CTA / swipe next → slide 1: StyleQuiz (stub)
            └→ CTA / swipe next → slide 2: Ready
                 ├→ "Create Account" → RegisterScreen
                 └→ "Skip" → FeedScreen (AsyncStorage נכתב גם בskip)

App launch (חוזר)
  └→ AsyncStorage.getItem('onboarding_complete') === 'true'
       └→ skip onboarding → FeedScreen ישירות
```

**הערת ארכיטקטורה:** `OnboardingScreen` לא נמצא ב-Tab.Navigator. הוא מסך Stack שמוצג לפני שה-Tab Bar בכלל עולה. בCycle 2 — App.js בודק AsyncStorage ב-splash/init ומחליט: Onboarding Stack או Tab Navigator. תיאום עם רועי חובה לפני implementation (MB-002).

---

## כל מסך — Content

### Screen 0: Welcome

| אלמנט | תוכן | i18n key |
|-------|------|---------|
| Headline | "הארון שלך, הסגנון שלך" | `onboarding.welcome.title` |
| Body | "גלי לוקים, שתפי סטייל, קני ומכרי בקלות" | `onboarding.welcome.body` |
| Visual | hero image — outfit flat-lay (Unsplash, ממאגר R-005) | — |
| CTA primary | "המשיכי" | `onboarding.cta.next` |

### Screen 1: StyleQuiz (stub — Cycle 3)

| אלמנט | תוכן | i18n key |
|-------|------|---------|
| Headline | "מה הסגנון שלך?" | `onboarding.styleQuiz.title` |
| Body | "בחרי 3 סגנונות כדי שנתאים לך לוקים" | `onboarding.styleQuiz.body` |
| Visual | placeholder View עגולה × 3 (grid) — אין בחירה אמיתית Cycle 2 | — |
| CTA primary | "המשיכי" | `onboarding.cta.next` |

**Cycle 2 behavior:** לא נשמר אף preference. הכפתור רק מנווט. לוגיקה של בחירה + שמירה = Cycle 3.

### Screen 2: Ready

| אלמנט | תוכן | i18n key |
|-------|------|---------|
| Headline | "מוכנה להתחיל?" | `onboarding.ready.title` |
| Body | "הצטרפי לקהילת הסטייל הגדולה בישראל" | `onboarding.ready.body` |
| Visual | אוסף תמונות mini looklist (3 תמונות ממאגר R-005) | — |
| CTA primary | "יצירת חשבון" | `onboarding.cta.createAccount` |
| CTA secondary | "המשך ללא חשבון" | `onboarding.cta.skip` |

---

## Navigation dots

- 3 נקודות, אחת active (filled, `var(--accent)` = `#e8526a`)
- inactive: `var(--muted)` = `#8a8498`
- מיקום: מעל ה-CTA, מתחת לתוכן
- לא interactive (לא tab ישיר לדוט)

---

## State

### AsyncStorage schema

```js
key: 'onboarding_complete'
value: 'true'           // string, לא boolean (AsyncStorage API)
```

**מתי נכתב:**
- לחיצה על "יצירת חשבון" → נכתב לפני navigate לRegisterScreen
- לחיצה על "המשך ללא חשבון" → נכתב לפני navigate לFeedScreen

**מתי נקרא:**
- App.js ב-useEffect בהפעלה ראשונה
- אם `=== 'true'` → skip כל onboarding → navigate לFeedScreen

### פרטי implementation

```js
// קריאה ב-App.js init
const checkOnboarding = async () => {
  const done = await AsyncStorage.getItem('onboarding_complete');
  if (done === 'true') {
    // navigate to Tab Navigator
  } else {
    // show Onboarding Stack
  }
};

// כתיבה ב-OnboardingScreen (Screen 2 CTA)
await AsyncStorage.setItem('onboarding_complete', 'true');
```

**הערה:** `@react-native-async-storage/async-storage` — בדוק שקיים ב-package.json לפני implementation. אם חסר: `npx expo install @react-native-async-storage/async-storage`.

---

## i18n keys — שני namespaces (en + he)

```json
// en.json — onboarding namespace
"onboarding": {
  "welcome": {
    "title": "Your Wardrobe, Your Style",
    "body": "Discover looks, share style, buy and sell with ease"
  },
  "styleQuiz": {
    "title": "What's Your Style?",
    "body": "Pick 3 styles so we can match looks for you"
  },
  "ready": {
    "title": "Ready to Start?",
    "body": "Join Israel's largest style community"
  },
  "cta": {
    "next": "Continue",
    "createAccount": "Create Account",
    "skip": "Continue Without Account"
  }
}
```

```json
// he.json — onboarding namespace
"onboarding": {
  "welcome": {
    "title": "הארון שלך, הסגנון שלך",
    "body": "גלי לוקים, שתפי סטייל, קני ומכרי בקלות"
  },
  "styleQuiz": {
    "title": "מה הסגנון שלך?",
    "body": "בחרי 3 סגנונות כדי שנתאים לך לוקים"
  },
  "ready": {
    "title": "מוכנה להתחיל?",
    "body": "הצטרפי לקהילת הסטייל הגדולה בישראל"
  },
  "cta": {
    "next": "המשיכי",
    "createAccount": "יצירת חשבון",
    "skip": "המשך ללא חשבון"
  }
}
```

**סה"כ keys:** 10 (5 per locale × 2 locales × 2 files). כולם דרך `t()`.

---

## Design — כללים לפי DESIGN_STANDARDS

| כלל | אכיפה |
|-----|-------|
| אפס emoji ב-UI chrome (R-004, DS-006) | icon placeholders = View עגולה. SVG = Cycle 3. |
| Colors — tokens בלבד | background: `var(--bg)`, accent: `var(--accent)`, dots: `var(--muted)` |
| Typography — `var(--t-*)` | headline: `var(--t-h1)`, body: `var(--t-body)`, CTA: `var(--t-lead)` |
| Hit targets ≥44px | CTA buttons: minHeight 48px |
| רשת 8pt | padding: 24px (גדול), 16px (רגיל), 8px (קטן) |

---

## Definition of Done

| קריטריון | בודק |
|---------|------|
| 3 screens + navigation dots + FlatList horizontal pager | Metro bundle EXIT 0 |
| AsyncStorage.setItem ב-CTA האחרון (שני הכפתורים) | console.log + manual test |
| AsyncStorage.getItem ב-App.js init — skip אם `=== 'true'` | הפעל app פעמיים: פעם 1 → onboarding, פעם 2 → FeedScreen |
| 0 hardcoded text — כל שורה דרך `t()` | `grep -r "hardcoded_string" mobile/screens/OnboardingScreen.js` = 0 (visual check) |
| 0 emoji ב-UI chrome | grep emoji ב-OnboardingScreen.js = 0 |
| כל copy קיים בen.json + he.json | 10 keys, 0 fallbacks |
| OnboardingScreen לא ב-Tab.Navigator | App.js review עם וראן |
| `@react-native-async-storage/async-storage` ב-package.json | grep = exists |

---

## חסמים ידועים

| חסם | אחראי | action |
|-----|-------|--------|
| OnboardingScreen לא ב-Tab — דורש Stack navigator מעל Tabs | רועי + דנה | תאמו ב-App.js לפני implementation. MB-002 — ארכיטקטורה לפני dispatch. |
| RegisterScreen לא קיים (Cycle 2 auth = stubs בלבד) | סאם / דנה | CTA "Create Account" מנווט לstub ריק (Text: "Register Coming Soon"). לא בלוקר לDoD. |
| StyleQuiz ללא לוגיקה | מתועד | Cycle 3 — preferences schema + API. Cycle 2 = placeholder בלבד. |

---

## מה לא בScope הזה

- RegisterScreen UX (Cycle 3)
- forgot password / social login (Cycle 3)
- StyleQuiz preference persistence (Cycle 3)
- push notification permission request (Cycle 3 — roadmap שאלה 3, מאושרת)
- אנימציות מעבר בין slides (מעבר בסיסי Cycle 2, shared element Cycle 3)

---

*Ayalon | Product Director | AWEAR | 2026-06-19*
