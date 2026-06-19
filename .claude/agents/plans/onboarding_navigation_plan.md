# Onboarding Navigation Integration Plan

**תאריך:** 2026-06-19
**מחליט:** וראן (Mobile Lead)
**מבצע:** רועי (feat/react-navigation-install worktree → mobile/App.js ב-main)
**מסמך הורה:** agents/plans/react_navigation_plan.md, agents/plans/onboarding_spec.md

---

## Architecture

```
Stack.Navigator (root, headerShown: false):
├── "Onboarding"  → OnboardingScreen       [if onboarding_complete !== 'true']
└── "Main"        → MainTabNavigator        [default / after onboarding]
      ├── Feed         → FeedScreen
      ├── Camera       → CameraScreen
      ├── Wardrobe     → WardrobeScreen
      ├── Marketplace  → MarketplaceScreen  (Cycle 2 P1 — stub)
      └── Profile      → ProfileScreen
```

**ההחלטה:** Stack.Navigator עוטף את Tab.Navigator. Onboarding מופיע כ-Stack.Screen נפרד — לא כ-Tab. ברגע שהמשתמש מסיים onboarding, ה-AsyncStorage key מסמן 'true' וה-Stack מציג ישירות את MainTabs. אין back gesture ל-Onboarding לאחר מכן.

---

## App.js logic (pseudo-code מלא)

```js
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { AppProvider } from './contexts/AppContext';

import OnboardingScreen from './screens/OnboardingScreen';
import FeedScreen from './screens/FeedScreen';
import CameraScreen from './screens/CameraScreen';
import WardrobeScreen from './screens/WardrobeScreen';
import MarketplaceScreen from './screens/MarketplaceScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0e0c0f',
          borderTopColor: '#1e1a22',
          paddingBottom: 4,
        },
        tabBarActiveTintColor: '#e8526a',
        tabBarInactiveTintColor: '#8a8498',
      }}
    >
      <Tab.Screen name="Feed" component={FeedScreen} options={{ tabBarLabel: 'Feed' }} />
      <Tab.Screen name="Camera" component={CameraScreen} options={{ tabBarLabel: 'Scan' }} />
      <Tab.Screen name="Wardrobe" component={WardrobeScreen} options={{ tabBarLabel: 'Closet' }} />
      <Tab.Screen name="Marketplace" component={MarketplaceScreen} options={{ tabBarLabel: 'Shop' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('onboarding_complete').then((val) => {
      setShowOnboarding(val !== 'true');
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0e0c0f', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#e8526a" />
      </View>
    );
  }

  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {showOnboarding ? (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          ) : null}
          <Stack.Screen name="Main" component={MainTabNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </AppProvider>
  );
}
```

**הערה:** `StatusBar` הועבר מחוץ ל-`NavigationContainer` כדי שיפעל גם במסך ה-splash.

---

## Dependencies

| חבילה | קיים? | מיקום |
|-------|-------|--------|
| `@react-navigation/native` | כן | mobile/package.json |
| `@react-navigation/stack` | כן | mobile/package.json (^7.10.5) |
| `@react-navigation/bottom-tabs` | כן | mobile/package.json |
| `@react-native-async-storage/async-storage` | **לאמת** | נמצא ב-import של OnboardingScreen — לא ב-package.json הראשי. רועי: `npx expo install @react-native-async-storage/async-storage` אם חסר. |
| `react-native-screens` | כן | mobile/package.json |
| `react-native-safe-area-context` | כן | mobile/package.json |

---

## העברת קבצים מ-dana-onboarding

| מקור | יעד |
|------|-----|
| `/Users/tamargrosz/dana-onboarding/mobile/screens/OnboardingScreen.js` | `mobile/screens/OnboardingScreen.js` |
| namespace `onboarding` מ-`dana-onboarding/mobile/i18n/en.json` | merge ל-`mobile/i18n/en.json` |
| namespace `onboarding` מ-`dana-onboarding/mobile/i18n/he.json` | merge ל-`mobile/i18n/he.json` |

---

## תיקון i18n — פער שזוהה

**בעיה:** `OnboardingScreen.js` של דנה קורא ל-`t('onboarding.skip')`, `t('onboarding.next')`, `t('onboarding.start')`.
ה-`en.json` / `he.json` מגדירים `onboarding.ctaNext` ו-`onboarding.ctaFinal` — לא `next`/`start`/`skip`.

**תיקון נדרש (רועי):** הוסף 3 keys חסרים בשני הקבצים:

```json
"onboarding": {
  "skip": "Skip",
  "next": "Continue",
  "start": "Start scanning",
  ...
}
```

```json
"onboarding": {
  "skip": "דלגי",
  "next": "המשך",
  "start": "התחילי לסרוק",
  ...
}
```

---

## תיקון navigate בOnboardingScreen

**בעיה:** `navigation.navigate('Feed')` ב-`handleFinish()` — בStack.Navigator המשתמש ב-conditional screens, ה-navigate צריך להגיע ל-`'Main'` (כי `Feed` הוא Screen בתוך Tab.Navigator בתוך `'Main'`).

**תיקון נדרש (רועי):** שנה שורה 26 ב-`OnboardingScreen.js`:
```js
// לפני:
navigation.navigate('Feed');

// אחרי:
navigation.navigate('Main');
```

לאחר ה-navigate, המשתמש יגיע אוטומטית ל-tab ברירת המחדל (Feed).

---

## הוראות מימוש לרועי — סדר פעולות

1. **ודא `@react-native-async-storage/async-storage`** — `grep async-storage mobile/package.json`. אם חסר: `npx expo install @react-native-async-storage/async-storage`.
2. **העבר קבצים:** `OnboardingScreen.js` + i18n namespace `onboarding` (en + he).
3. **תקן i18n keys:** הוסף `skip` / `next` / `start` לשני הקבצים (פירוט למעלה).
4. **תקן navigate:** `navigation.navigate('Main')` במקום `'Feed'` ב-`OnboardingScreen.js`.
5. **עדכן App.js:** החלף את הגרסה הקיימת (Tab.Navigator בלבד) בגרסה עם Stack.Navigator כ-root (pseudo-code למעלה).
6. **grep לאימות DoD:**
   - `grep -r "onboarding.skip\|onboarding.next\|onboarding.start" mobile/i18n/` = 2 הופעות (en + he)
   - `grep "navigate('Feed')" mobile/screens/OnboardingScreen.js` = 0
   - `grep "MainTabNavigator\|Stack.Navigator" mobile/App.js` = 2+ הופעות

---

## DoD

- [ ] `mobile/App.js` כולל `Stack.Navigator` כ-root ו-`Tab.Navigator` בתוך `MainTabNavigator`
- [ ] `AsyncStorage.getItem('onboarding_complete')` ב-`useEffect` — conditional first screen
- [ ] `OnboardingScreen.js` ב-`mobile/screens/`
- [ ] i18n: namespace `onboarding` ב-`en.json` + `he.json` עם 3 keys חסרים מתוקנים
- [ ] `navigation.navigate('Main')` (לא `'Feed'`) ב-`OnboardingScreen.handleFinish`
- [ ] `@react-native-async-storage/async-storage` ב-`mobile/package.json`
- [ ] 0 hardcoded strings — כל טקסט דרך `t()`
- [ ] grep Hebrew ב-`OnboardingScreen.js` = 0

---

## מה שאינו בscope של הפלן הזה

- OnboardingScreen SVG icons (Cycle 3)
- StyleQuiz לוגיקה אמיתית (Cycle 3)
- Token migration של hardcoded colors ב-OnboardingScreen (Cycle 3)
- CameraPermissionScreen ב-Stack (tracked ב-react_navigation_plan.md כ-blocker לפרוד)
- auth flow מ-RegisterScreen (Cycle 3)
