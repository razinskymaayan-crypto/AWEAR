import { StatusBar } from 'expo-status-bar';

import CameraPermissionScreen from './screens/CameraPermissionScreen';

// First real screen: camera permission onboarding (see mobile/README.md,
// "Next real task"). Deliberately one screen, no navigation stack yet —
// that wiring is future scope, not this task.
export default function App() {
  return (
    <>
      <CameraPermissionScreen />
      <StatusBar style="light" />
    </>
  );
}
