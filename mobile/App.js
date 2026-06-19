import { StatusBar } from 'expo-status-bar';
import { useState, useCallback } from 'react';

import CameraPermissionScreen from './screens/CameraPermissionScreen';
import CameraScreen from './screens/CameraScreen';

// Minimal in-app navigation: a single string names the active screen.
// React Navigation is not yet a dependency — that wiring is shared
// architecture requiring coordination with Roee (see agents/dana.md,
// "navigation architecture, שינויים — תיאום עם רועי ווארן").
//
// The `navigation` shim passed to each screen mirrors the subset of the
// React Navigation API that screens use today, so switching to a real
// NavigationContainer later is a drop-in: replace this file, keep screens.
const SCREENS = {
  CAMERA_PERMISSION: 'CameraPermission',
  CAMERA: 'Camera',
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.CAMERA_PERMISSION);

  // navigation shim — subset of React Navigation stack API
  const buildNavigation = useCallback(
    (currentScreen) => ({
      navigate: (targetName) => {
        if (Object.values(SCREENS).includes(targetName)) {
          setScreen(targetName);
        }
      },
      goBack: () => {
        // Simple rule: Camera goes back to CameraPermission.
        // Extend this map when more screens are added.
        if (currentScreen === SCREENS.CAMERA) {
          setScreen(SCREENS.CAMERA_PERMISSION);
        }
      },
    }),
    [],
  );

  const renderScreen = () => {
    switch (screen) {
      case SCREENS.CAMERA:
        return <CameraScreen navigation={buildNavigation(SCREENS.CAMERA)} />;
      case SCREENS.CAMERA_PERMISSION:
      default:
        return (
          <CameraPermissionScreen
            navigation={buildNavigation(SCREENS.CAMERA_PERMISSION)}
            onPermissionGranted={() => setScreen(SCREENS.CAMERA)}
          />
        );
    }
  };

  return (
    <>
      {renderScreen()}
      <StatusBar style="light" />
    </>
  );
}
