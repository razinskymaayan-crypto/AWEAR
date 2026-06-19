/**
 * AWEAR Design Tokens — React Native
 * Mirror of static/tokens.css — Mediterranean Modern palette
 * Source of truth: awear-tokens.json (keep in sync manually until Cycle 4 automation)
 *
 * Values are RN-ready (numeric for dimensions, string for colors).
 * Note: mobile/theme/tokens.js imports awear-tokens.json directly (string values with "px").
 * This file provides flat numeric constants for direct use in StyleSheet.create().
 *
 * Sync notes:
 *   --muted:   #8a8498  (tokens.css canonical — spec draft had #8b8b9a)
 *   --warning: #e8a84a  (tokens.css canonical — warm amber, not #f59e0b)
 *   --fg:      #f0ecf5  (tokens.css canonical primary text)
 *   --text:    #fbfbfd  (backward-compat alias — used in fg field below per spec)
 *   --line:    #2e2836  (tokens.css canonical opaque border — not rgba overlay)
 */

export const colors = {
  bg:             '#0e0c0f',
  surface:        '#161318',
  card:           '#1e1a22',
  cardHover:      '#262030',
  fg:             '#fbfbfd',   // --text alias (35 usages, backward compat) — migrate to #f0ecf5 (--fg) in Cycle 4
  muted:          '#8a8498',
  accent:         '#e8526a',
  accent2:        '#c4855a',
  accent3:        '#7a6af0',
  line:           '#2e2836',
  overlay:        'rgba(14,12,15,0.80)',
  success:        '#52c97a',
  successSurface: 'rgba(82,201,122,0.12)',
  warning:        '#e8a84a',
  danger:         '#e05252',
};

export const typography = {
  display: 32,
  h1:      24,
  h2:      18,
  h3:      15,
  title:   20,
  lead:    17,
  body:    14,
  small:   13,
  caption: 12,
  micro:   11,
};

export const fontWeight = {
  regular:  '500',
  semibold: '600',
  bold:     '700',
  heavy:    '800',
  black:    '900',
};

export const spacing = {
  s1:  4,
  s2:  8,
  s3:  12,
  s4:  16,
  s5:  20,
  s6:  24,
  s7:  28,
  s8:  32,
  s10: 40,
  s12: 48,
  s16: 64,
};

export const radii = {
  xs:   6,
  sm:   10,
  md:   14,
  lg:   20,
  xl:   28,
  pill: 999,
};

export const shadows = {
  sm: {
    shadowColor:   '#0e0c0f',
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.28,
    shadowRadius:  4,
    elevation:     2,
  },
  md: {
    shadowColor:   '#0e0c0f',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.36,
    shadowRadius:  16,
    elevation:     4,
  },
  lg: {
    shadowColor:   '#0e0c0f',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius:  32,
    elevation:     8,
  },
  accent: {
    shadowColor:   '#e8526a',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius:  20,
    elevation:     6,
  },
  glow: {
    shadowColor:   '#e8526a',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius:  20,
    elevation:     6,
  },
};

export const motion = {
  fast:   150,
  normal: 250,
  slow:   400,
  spring: 350,
};

export const zIndex = {
  base:   1,
  card:   10,
  sticky: 100,
  modal:  200,
  toast:  300,
  sheet:  400,
};
