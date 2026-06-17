# AWEAR mobile (skeleton)

This is a skeleton only. It exists to prove the Expo / React Native toolchain
runs end to end inside this repo — nothing more.

There was previously no React Native project anywhere in AWEAR, despite
Dana's role spec (camera, onboarding, profile, auth) assuming one existed.
That gap is very likely why no mobile code had shipped in 2+ weeks. This
folder closes that gap with the smallest possible real, runnable unit.

## What's here

- A bare `create-expo-app` (blank template) project.
- `App.js` renders a single screen with the text "AWEAR" and a status bar.
  That's it — no camera, no onboarding, no navigation, no real features.

## What's deliberately NOT here

- Camera permission flow
- Onboarding screens (style quiz, wardrobe intro, permission requests)
- Profile screen
- Auth screens
- Navigation (React Navigation), AsyncStorage, i18n setup
- Design tokens wiring (awear-tokens.json at repo root is not yet consumed
  here — do that as part of the first real screen, not before)

All of the above is in scope for Dana eventually, but per the stall
escalation rule, the first task in any new cycle must be small enough to
ship in a day, not a sprint.

## How to run it

From the `mobile/` directory:

```bash
npm install
npx expo start --web
```

This starts the Metro/Expo dev server and serves a web build on
`http://localhost:8081` (or another port if busy). Use `--web` for the
fastest headless verification (no simulator/device needed). `npm run ios`
/ `npm run android` work the same way once a simulator or device is
available.

### Environment note

This machine did not have Node.js, npm, Homebrew, nvm, volta, fnm, mise,
or asdf on PATH or in any standard install location. Node v20.18.1
(darwin-arm64) was fetched directly from nodejs.org as a prebuilt tarball
and used from a local, non-system path — no sudo, no package manager
needed. If you hit `command not found: node` on a fresh machine, that's
the same blocker; grab the official prebuilt tarball for your platform
from https://nodejs.org/dist/ and put its `bin/` on PATH.

Expo flagged this Node version as below its recommended minimum
(`>=20.19.4`) with a warning, but the dev server, Metro bundler, and web
build all ran successfully — the warning is not a blocker (211 modules
bundled in ~1.4s, served with HTTP 200, "AWEAR" string confirmed present
in the compiled bundle).

## Camera permission onboarding screen (done)

`App.js` now renders `screens/CameraPermissionScreen.js`: a single screen,
no navigation stack, that:

- Requests camera permission via `expo-camera`'s `useCameraPermissions()`
  hook (`getCameraPermissionsAsync`/`requestCameraPermissionsAsync` under
  the hood).
- Handles all three permission states with real UI, not just the happy
  path: undetermined (explain + ask), denied-but-can-ask-again (explain
  again + ask), denied-and-can't-ask-again (points at system settings via
  `Linking.openSettings()`), and granted (confirmation state). There's also
  a brief loading state for the one tick before `expo-camera` reports the
  current status.
- Sources every piece of UI copy from `i18n/en.json` via the `t()` helper
  in `i18n/index.js` — nothing is hardcoded inline in the screen. The iOS
  `NSCameraUsageDescription` shown by the OS permission dialog is sourced
  from the same JSON (see `app.config.js`, which replaced the static
  `app.json` so that string could be computed instead of duplicated).
- Pulls color/spacing/typography from the repo's single token source,
  `/awear-tokens.json`, via `theme/tokens.js` (no hardcoded hex/px values
  in the screen's `StyleSheet`). Note: `static/tokens.css` claims a Style
  Dictionary build generates it, but no such build/config exists anywhere
  in this repo — `theme/tokens.js` reads the JSON directly instead of
  pretending a pipeline exists. Building real Style Dictionary tooling is
  future scope, not part of this task.
- Has no camera preview and no capture pipeline — deliberately out of
  scope here, same as originally planned. That's the next task.

`metro.config.js` was added (didn't exist before) so Metro can resolve
`theme/tokens.js`'s import of `../../awear-tokens.json`, which lives
outside the default `mobile/` project root.

### Verified

- `npx expo start --web`: Metro bundled the app (240 modules, ~620ms),
  served the HTML shell and JS bundle over HTTP with status 200, and a
  second request triggered a clean 1-module incremental rebuild with no
  errors in the dev server log.
- Confirmed (by grepping the compiled bundle, not just trusting "it
  bundled") that the screen's actual i18n copy (e.g. "Allow camera
  access"), the `useCameraPermissions` hook, the `CameraPermissionScreen`
  component, and a real token value pulled from `awear-tokens.json`
  (`#7b5cff`) are all present in the output — i.e. the i18n, tokens, and
  permission-hook wiring all actually resolved at bundle time, not just
  "no errors."
- Scanned all new/changed files for emoji in UI chrome — none found, per
  the repo's P0 design rule.

### NOT verified (explicitly out of coverage)

- No iOS or Android simulator/device is available in this environment, so
  the real native permission dialogs, `NSCameraUsageDescription` prompt
  text, `Linking.openSettings()` deep link, and Android's
  `android.permission.CAMERA` manifest entry have **not** been exercised
  on real hardware or a simulator — only inspected by reading
  `expo-camera`'s type definitions and confirming the web bundle compiles
  cleanly. `expo-camera`'s web implementation also differs from native
  (it proxies to `navigator.mediaDevices` under the hood), so passing on
  web is not proof the native permission flow behaves identically.
- No automated test suite exists for `mobile/` yet (none existed before
  this task either) — verification here is manual/bundle-level only.
- No visual/screenshot confirmation of the rendered screen — verification
  relied on HTTP status, bundled module counts, and grepping the compiled
  bundle for expected strings/tokens, since no headless browser binary
  (e.g. Chromium for Playwright) is installed in this environment and
  installing one was treated as out of scope for a one-screen task.

## Next real task (not done here)

Camera preview + capture pipeline (live viewfinder, shutter, basic image
handling) is the next unit after this one — still no navigation stack
needed yet.
