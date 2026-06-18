import { CameraView } from 'expo-camera';
import { useRef, useState, useCallback } from 'react';
import {
  Animated,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { t } from '../i18n';
import { color, radius, spacing, typography } from '../theme/tokens';

// Flash modes cycle in this order when the user taps the flash toggle.
const FLASH_CYCLE = ['off', 'auto', 'on'];

// CameraScreen — live preview + capture pipeline.
//
// Layout layers (bottom to top):
//   1. CameraView fills the screen (no crop, device-native aspect ratio)
//   2. Controls overlay: X button top-left, flash toggle top-right, capture
//      button bottom-center — all outside the camera rect so taps register.
//   3. Scanning overlay: semi-transparent sheet + spinner text, animated fade,
//      shown from the moment the shutter fires until we hand off to the result.
//   4. Captured-preview: full-screen Image + action buttons, replaces the live
//      view so the user can retake or proceed.
//
// Navigation contract:
//   - Requires a `navigation` prop (React Navigation stack).
//   - `navigation.goBack()` on X press or Retake.
//   - `navigation.navigate('CapturedPreview', { uri })` would be the next step;
//     for now we show the preview inline since CapturedPreview is not built yet.
export default function CameraScreen({ navigation }) {
  const cameraRef = useRef(null);
  const { width, height } = useWindowDimensions();

  // Flash state: 'off' | 'auto' | 'on'
  const [flashMode, setFlashMode] = useState('off');

  // Whether the camera is ready to accept takePictureAsync calls.
  const [cameraReady, setCameraReady] = useState(false);

  // Scanning overlay is shown between shutter press and image load.
  const [scanning, setScanning] = useState(false);
  const scanningOpacity = useRef(new Animated.Value(0)).current;

  // Captured URI — non-null means we are in the result view.
  const [capturedUri, setCapturedUri] = useState(null);

  // --- helpers ---

  const cycleFlash = useCallback(() => {
    setFlashMode((prev) => {
      const nextIndex = (FLASH_CYCLE.indexOf(prev) + 1) % FLASH_CYCLE.length;
      return FLASH_CYCLE[nextIndex];
    });
  }, []);

  const flashLabel = useCallback(() => {
    switch (flashMode) {
      case 'on':
        return t('camera.flashOn');
      case 'auto':
        return t('camera.flashAuto');
      default:
        return t('camera.flashOff');
    }
  }, [flashMode]);

  const showScanningOverlay = useCallback(() => {
    setScanning(true);
    Animated.timing(scanningOpacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [scanningOpacity]);

  const hideScanningOverlay = useCallback(() => {
    Animated.timing(scanningOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setScanning(false));
  }, [scanningOpacity]);

  const handleCapture = useCallback(async () => {
    if (!cameraReady || !cameraRef.current) return;

    showScanningOverlay();
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });
      // Hand off to inline result view.
      // When a CapturedPreviewScreen is built this becomes:
      //   navigation.navigate('CapturedPreview', { uri: photo.uri });
      setCapturedUri(photo.uri);
    } catch (_err) {
      // Capture failed — dismiss overlay and stay on live preview.
      // Error surfacing (toast / alert) is future scope.
    } finally {
      hideScanningOverlay();
    }
  }, [cameraReady, showScanningOverlay, hideScanningOverlay]);

  const handleClose = useCallback(() => {
    if (navigation) {
      navigation.goBack();
    }
  }, [navigation]);

  const handleRetake = useCallback(() => {
    setCapturedUri(null);
  }, []);

  // --- captured-preview view ---

  if (capturedUri) {
    return (
      <View style={styles.fullScreen}>
        <Image
          source={{ uri: capturedUri }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          accessibilityLabel={t('camera.capturedPreviewTitle')}
        />
        <SafeAreaView style={styles.capturedSafeArea}>
          <View style={styles.capturedActions}>
            <TouchableOpacity
              style={styles.capturedSecondaryButton}
              onPress={handleRetake}
              accessibilityRole="button"
              accessibilityLabel={t('camera.capturedPreviewRetake')}
            >
              <Text style={styles.capturedSecondaryText}>
                {t('camera.capturedPreviewRetake')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.capturedPrimaryButton}
              accessibilityRole="button"
              accessibilityLabel={t('camera.capturedPreviewUse')}
              // onPress will call navigation.navigate to result screen (future scope)
            >
              <Text style={styles.capturedPrimaryText}>
                {t('camera.capturedPreviewUse')}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // --- live camera view ---

  return (
    <View style={styles.fullScreen}>
      {/* Live camera preview — fills the entire screen */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        flash={flashMode}
        onCameraReady={() => setCameraReady(true)}
        onMountError={() => setCameraReady(false)}
      />

      {/* Scanning overlay — fades in on capture */}
      {scanning && (
        <Animated.View style={[styles.scanningOverlay, { opacity: scanningOpacity }]}>
          <Text style={styles.scanningText}>{t('camera.scanning')}</Text>
        </Animated.View>
      )}

      {/* Controls overlay — SafeAreaView keeps buttons away from notch/home bar */}
      <SafeAreaView style={styles.controlsSafeArea} pointerEvents="box-none">
        {/* Top row: close (left) + flash toggle (right) */}
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel={t('camera.closeButton')}
          >
            <Text style={styles.iconButtonText}>{'✕'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={cycleFlash}
            accessibilityRole="button"
            accessibilityLabel={flashLabel()}
          >
            <Text style={styles.iconButtonText}>{flashIconChar(flashMode)}</Text>
            <Text style={styles.iconButtonCaption}>{flashLabel()}</Text>
          </TouchableOpacity>
        </View>

        {/* Spacer — pushes capture button to the bottom */}
        <View style={styles.spacer} />

        {/* Bottom row: capture button centered */}
        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={[styles.captureButton, !cameraReady && styles.captureButtonDisabled]}
            onPress={handleCapture}
            disabled={!cameraReady || scanning}
            accessibilityRole="button"
            accessibilityLabel={t('camera.captureButton')}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

// Returns a simple text character to represent the current flash state.
// Using text chars avoids an icon library dependency for this iteration.
function flashIconChar(mode) {
  switch (mode) {
    case 'on':
      return '⚡'; // lightning bolt
    case 'auto':
      return 'A⚡'; // A + lightning
    default:
      return '⚡̸'; // lightning with slash (combining long solidus)
  }
}

const CAPTURE_SIZE = 72;
const CAPTURE_INNER = 56;
const ICON_BUTTON_SIZE = 44;

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: color.bg,
  },

  // --- scanning overlay ---
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: color.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningText: {
    color: color.fg,
    fontSize: typography.heading2.size,
    fontWeight: String(typography.heading2.weight),
    lineHeight: typography.heading2.size * typography.heading2.leading,
  },

  // --- controls overlay ---
  controlsSafeArea: {
    flex: 1,
    // No background — transparent overlay on top of CameraView
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[16],
    paddingTop: spacing[16],
  },
  iconButton: {
    width: ICON_BUTTON_SIZE,
    height: ICON_BUTTON_SIZE,
    borderRadius: radius.pill,
    backgroundColor: color.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: {
    color: color.fg,
    fontSize: typography.heading3.size,
    fontWeight: String(typography.heading3.weight),
    lineHeight: typography.heading3.size,
  },
  iconButtonCaption: {
    color: color.fg,
    fontSize: typography.micro.size,
    fontWeight: String(typography.micro.weight),
    position: 'absolute',
    bottom: -spacing[16],
    textAlign: 'center',
    width: 64,
    left: -10,
  },
  spacer: {
    flex: 1,
  },
  bottomRow: {
    alignItems: 'center',
    paddingBottom: spacing[40],
  },

  // --- capture button ---
  captureButton: {
    width: CAPTURE_SIZE,
    height: CAPTURE_SIZE,
    borderRadius: radius.pill,
    borderWidth: 3,
    borderColor: color.fg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  captureButtonDisabled: {
    opacity: 0.4,
  },
  captureButtonInner: {
    width: CAPTURE_INNER,
    height: CAPTURE_INNER,
    borderRadius: radius.pill,
    backgroundColor: color.fg,
  },

  // --- captured preview ---
  capturedSafeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  capturedActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[24],
    paddingBottom: spacing[40],
    gap: spacing[16],
  },
  capturedSecondaryButton: {
    flex: 1,
    paddingVertical: spacing[14],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.fg,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  capturedSecondaryText: {
    color: color.fg,
    fontSize: typography['body-bold'].size,
    fontWeight: String(typography['body-bold'].weight),
  },
  capturedPrimaryButton: {
    flex: 1,
    paddingVertical: spacing[14],
    borderRadius: radius.md,
    backgroundColor: color.accent2,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  capturedPrimaryText: {
    color: color.fg,
    fontSize: typography['body-bold'].size,
    fontWeight: String(typography['body-bold'].weight),
  },
});
