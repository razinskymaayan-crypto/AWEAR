const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// mobile/theme/tokens.js reads ../../awear-tokens.json so app code and web
// stay pinned to the one design-token source instead of mobile forking its
// own copy. Metro only watches/resolves inside projectRoot by default, so
// the repo root has to be added explicitly for that import to bundle.
config.watchFolders = [repoRoot];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];

module.exports = config;
