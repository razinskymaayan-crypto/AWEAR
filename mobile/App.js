import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './contexts/AppContext';

import CameraScreen from './screens/CameraScreen';
import FeedScreen from './screens/FeedScreen';
import WardrobeScreen from './screens/WardrobeScreen';

// Tab bar colors sourced from design tokens (tokens.css).
// CSS variables cannot be consumed in RN StyleSheet — hex values are
// intentional here, not hardcoded by mistake:
//   #0e0c0f  = var(--bg)     background
//   #1e1a22  = var(--card)   border-top
//   #e8526a  = var(--accent) active tint
//   #8a8498  = var(--muted)  inactive tint
// Tab bar icons: pending mark's sign-off (react_navigation_plan.md).
// Using labels only until then — this is explicitly documented as
// the correct interim state in the plan.

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
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
          <Tab.Screen
            name="Feed"
            component={FeedScreen}
            options={{ tabBarLabel: 'Feed' }}
          />
          <Tab.Screen
            name="Camera"
            component={CameraScreen}
            options={{ tabBarLabel: 'Scan' }}
          />
          <Tab.Screen
            name="Wardrobe"
            component={WardrobeScreen}
            options={{ tabBarLabel: 'Closet' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </AppProvider>
  );
}
