# React Navigation — Cycle 2 P0 Plan

## מה צריך להיות מוכן לפני הinstall

**מארק מספק:**
- [ ] 5 אייקונים לtab bar: Camera, Feed, Wardrobe, Marketplace, Profile (icon() calls מdoc/ICON_SYSTEM.md)
- [ ] active/inactive color tokens (כבר קיים: --accent + --fg-muted)

**רועי מבצע (install):**
```bash
npx expo install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context
```

**App.js לאחר install:**
```js
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CameraScreen from './screens/CameraScreen';
import FeedScreen from './screens/FeedScreen';
import WardrobeScreen from './screens/WardrobeScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: '#0e0c0f' } }}>
          <Tab.Screen name="Feed" component={FeedScreen} />
          <Tab.Screen name="Camera" component={CameraScreen} />
          <Tab.Screen name="Wardrobe" component={WardrobeScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}
```

## Tab Bar Icons (Mark — approved, 2026-06-19)

בחירה מתוך ICONS object הקיים בלבד. אין icons חדשים.

- Feed: `icon('image', 22)` — photo/grid icon. מייצג "צפה בפוסטים/תמונות" בלי לבלבל עם navigation grid
- Camera: `icon('camera', 22)` — ברור
- Wardrobe: `icon('hanger', 22)` — ברור
- Marketplace: `icon('bag', 22)` — shopping bag, ישיר ומוכר (TikTok Shop, Instagram Shopping)
- Profile: `icon('user', 22)` — ברור

כל icon בגודל 22px, active color: `var(--accent)` (#e8526a), inactive: `var(--muted)` (#8a8498).

הערה: `var(--fg-muted)` לא קיים ב-tokens.css — המשתנה הנכון הוא `var(--muted)`. וראן — תקן את ה-plan המקורי בהתאם.

## blocker לprod
- [ ] ANTHROPIC_API_KEY set (סטיב)
- [ ] AppNavigator.js → replace shim (רועי, Cycle 2 P0)
