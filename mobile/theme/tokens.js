import tokens from '../../awear-tokens.json';

// Bridges the repo's single design-token source (/awear-tokens.json) into
// React Native. There is no real Style Dictionary build anywhere in this
// repo yet (static/tokens.css's header comment claims one, but no
// style-dictionary config/script exists) — that pipeline is future scope.
// This module is the honest version of that today: it reads the same JSON
// file the web app's tokens are hand-mirrored from, so mobile and web stay
// pinned to one source instead of mobile inventing its own palette.
export const color = tokens.color;
export const spacing = tokens.spacing;
export const radius = tokens.radius;
export const typography = tokens.typography;

export default { color, spacing, radius, typography };
