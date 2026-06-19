import React, { createContext, useContext, useState } from 'react';

// AppContext owns three cross-screen state slices:
//
//   locale       — 'he' | 'en' — drives t() calls in every screen.
//                  Default: 'he' (primary market). Changing this must trigger
//                  a re-render of all translated strings; screens that hold
//                  translation results in local vars must re-derive on locale
//                  change. Full RTL support (I18nManager.forceRTL) is tracked
//                  as Cycle 3 scope — varan sign-off required before ship.
//
//   capturedUri  — URI string from CameraScreen after a successful capture.
//                  Null when no capture has happened yet or after the image
//                  is consumed. Kept here (not in CameraScreen) so FeedScreen
//                  and WardrobeScreen can read it post-navigate without prop
//                  drilling through the navigation shim.
//
//   feedPosts    — Array of post objects displayed in FeedScreen.
//                  Empty by default; populated by pull-to-refresh or future
//                  API fetch. Kept in context so Wardrobe/Marketplace can
//                  cross-reference (e.g., "already posted" badge) without
//                  a second API call.
//
// This context does NOT own navigation state — that lives in App.js.
// State management architecture: Context API (decided by varan, cycle 1,
// mobile_architecture_cycle1.md). Zustand upgrade is a future milestone.

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [locale, setLocale] = useState('he');
  const [capturedUri, setCapturedUri] = useState(null);
  const [feedPosts, setFeedPosts] = useState([]);

  return (
    <AppContext.Provider
      value={{
        locale,
        setLocale,
        capturedUri,
        setCapturedUri,
        feedPosts,
        setFeedPosts,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

/**
 * useApp — hook for consuming AppContext.
 *
 * Throws if called outside AppProvider so the error surfaces at the
 * component level, not as a silent null-deref inside a conditional render.
 *
 * Usage:
 *   const { locale, feedPosts, setFeedPosts } = useApp();
 */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
