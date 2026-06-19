import { StatusBar } from 'expo-status-bar';
import { useState, useCallback } from 'react';

import CameraPermissionScreen from './screens/CameraPermissionScreen';
import CameraScreen from './screens/CameraScreen';
import WardrobeScreen from './screens/WardrobeScreen';

// Minimal in-app navigation: a single string names the active screen.
// React Navigation is not yet a dependency — that wiring is shared
// architecture requiring coordination with Roee (see agents/dana.md,
// "navigation architecture, שינויים — תיאום עם רועי ווארן").
//
// The `navigation` shim passed to each screen mirrors the subset of the
// React Navigation API that screens use today, so switching to a real
// NavigationContainer later is a drop-in: replace this file, keep screens.
//
// `params` is stored alongside the current screen name so navigate() callers
// can pass { newImageUri } and the receiving screen gets it via route.params.
const SCREENS = {
  CAMERA_PERMISSION: 'CameraPermission',
  CAMERA: 'Camera',
  WARDROBE: 'Wardrobe',
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.CAMERA_PERMISSION);
  const [screenParams, setScreenParams] = useState({});

  // navigation shim — subset of React Navigation stack API
  const buildNavigation = useCallback(
    (currentScreen) => ({
      navigate: (targetName, params) => {
        if (Object.values(SCREENS).includes(targetName)) {
          setScreenParams(params || {});
          setScreen(targetName);
        }
      },
      goBack: () => {
        // Simple back map. Wardrobe goes back to Camera (re-scan flow),
        // Camera goes back to CameraPermission.
        if (currentScreen === SCREENS.WARDROBE) {
          setScreenParams({});
          setScreen(SCREENS.CAMERA);
        } else if (currentScreen === SCREENS.CAMERA) {
          setScreenParams({});
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
      case SCREENS.WARDROBE:
        return (
          <WardrobeScreen
            navigation={buildNavigation(SCREENS.WARDROBE)}
            route={{ params: screenParams }}
          />
        );
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
