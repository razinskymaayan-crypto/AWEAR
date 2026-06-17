import { useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../i18n';
import { color, radius, spacing, typography } from '../theme/tokens';

// Single onboarding screen: camera permission request.
// Scope (see mobile/README.md): one screen, one permission flow.
// Deliberately no camera preview and no capture pipeline yet — that is the
// next task, not this one.
export default function CameraPermissionScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [requesting, setRequesting] = useState(false);

  // expo-camera returns null on first render while it checks the existing
  // permission state — treat that as its own (brief) loading state rather
  // than guessing granted/denied before we actually know.
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={color.accent2} />
        <Text style={styles.statusText}>{t('cameraPermission.checkingStatus')}</Text>
      </View>
    );
  }

  const handleRequest = async () => {
    setRequesting(true);
    try {
      await requestPermission();
    } finally {
      setRequesting(false);
    }
  };

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  if (permission.granted) {
    return (
      <View style={styles.container}>
        <View style={[styles.badge, styles.badgeGranted]} />
        <Text style={styles.title}>{t('cameraPermission.grantedTitle')}</Text>
        <Text style={styles.body}>{t('cameraPermission.grantedBody')}</Text>
      </View>
    );
  }

  // Denied and "asked before, can't ask again" both land here: the OS
  // permission dialog will not reappear, so the only real next step is
  // deep-linking to system settings instead of re-showing a button that
  // silently does nothing.
  if (permission.status === 'denied' && !permission.canAskAgain) {
    return (
      <View style={styles.container}>
        <View style={[styles.badge, styles.badgeDenied]} />
        <Text style={styles.title}>{t('cameraPermission.deniedTitle')}</Text>
        <Text style={styles.body}>{t('cameraPermission.deniedBody')}</Text>
        {Platform.OS !== 'web' && (
          <TouchableOpacity style={styles.primaryButton} onPress={handleOpenSettings}>
            <Text style={styles.primaryButtonText}>{t('cameraPermission.openSettingsButton')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Undetermined (first run) and denied-but-can-ask-again share the same
  // "explain, then ask" UI; only the body copy changes.
  const isRetry = permission.status === 'denied';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('cameraPermission.title')}</Text>
      <Text style={styles.body}>
        {isRetry ? t('cameraPermission.deniedRetryBody') : t('cameraPermission.body')}
      </Text>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleRequest}
        disabled={requesting}
        accessibilityRole="button"
      >
        {requesting ? (
          <ActivityIndicator color={color.fg} />
        ) : (
          <Text style={styles.primaryButtonText}>{t('cameraPermission.allowButton')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.bg,
    paddingHorizontal: spacing[32],
    gap: spacing[16],
  },
  title: {
    color: color.fg,
    fontSize: typography.heading1.size,
    fontWeight: String(typography.heading1.weight),
    lineHeight: typography.heading1.size * typography.heading1.leading,
    textAlign: 'center',
  },
  body: {
    color: color.muted,
    fontSize: typography.body.size,
    fontWeight: String(typography.body.weight),
    lineHeight: typography.body.size * typography.body.leading,
    textAlign: 'center',
    maxWidth: 320,
  },
  statusText: {
    color: color.muted,
    fontSize: typography.body.size,
    marginTop: spacing[12],
  },
  primaryButton: {
    backgroundColor: color.accent2,
    paddingVertical: spacing[14],
    paddingHorizontal: spacing[24],
    borderRadius: radius.md,
    marginTop: spacing[8],
    minWidth: 220,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: color.fg,
    fontSize: typography['body-bold'].size,
    fontWeight: String(typography['body-bold'].weight),
  },
  badge: {
    width: 12,
    height: 12,
    borderRadius: radius.pill,
    marginBottom: spacing[4],
  },
  badgeGranted: {
    backgroundColor: color.success,
  },
  badgeDenied: {
    backgroundColor: color.danger,
  },
});
