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

## Next real task (not done in this skeleton)

The smallest real slice of Dana's documented scope, in order of what
should come next:

1. **Single onboarding screen: camera permission request.**
   One screen, no navigation stack yet, that:
   - Requests camera permission via `expo-camera`'s permission API.
   - Shows the iOS `NSCameraUsageDescription` — copy must come from an
     i18n file, not hardcoded, per the global-first rule.
   - Handles the three permission states (granted / denied / undetermined)
     with real UI for each — not just a happy path.
   - Uses a color/spacing token from `awear-tokens.json` (via Style
     Dictionary output) instead of any hardcoded value, to start the
     pattern of consuming Netta's tokens correctly from day one.

   This is deliberately one screen, one permission flow, no camera preview
   or capture yet, and no onboarding flow around it. It is the next unit
   that is small enough to ship in a day and real enough to be worth
   shipping — the actual camera capture + compression pipeline is the
   task after this one.
