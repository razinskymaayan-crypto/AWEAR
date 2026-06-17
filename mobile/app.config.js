// Was app.json (static). Converted to dynamic config so the iOS camera
// usage description shown by the OS permission dialog can be sourced from
// the same i18n strings the in-app screen uses, instead of living as a
// second hardcoded copy.
//
// This file is loaded by plain Node (not Metro/Babel), so it reads the
// English strings JSON directly with `require` rather than importing the
// app's ESM `i18n/index.js` helper — same source of truth, no transpiler
// assumptions. Everything else below is unchanged from the original
// app.json.
const en = require('./i18n/en.json');

module.exports = {
  expo: {
    name: 'mobile',
    slug: 'mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription: en.cameraPermission.iosUsageDescription,
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      permissions: ['android.permission.CAMERA'],
    },
    web: {
      favicon: './assets/favicon.png',
    },
  },
};
