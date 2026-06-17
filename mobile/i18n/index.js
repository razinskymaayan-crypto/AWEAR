import en from './en.json';

// Minimal i18n lookup. AWEAR is English-default per the global-first pivot
// (see BUSINESS_PLAN.md / agents/*); this intentionally does not add
// locale switching, device-locale detection, or RTL handling yet — that is
// tracked as future scope (see mobile/README.md). Its only job right now
// is to make sure no screen copy is hardcoded inline, so adding locales
// later is a data change, not a rewrite.
const STRINGS = { en };
const DEFAULT_LOCALE = 'en';

/**
 * Look up a dot-path string, e.g. t('cameraPermission.title').
 * Falls back to the key itself if missing, so a typo is visible instead
 * of silently rendering nothing.
 */
export function t(keyPath, locale = DEFAULT_LOCALE) {
  const table = STRINGS[locale] || STRINGS[DEFAULT_LOCALE];
  const value = keyPath
    .split('.')
    .reduce((node, key) => (node && typeof node === 'object' ? node[key] : undefined), table);
  return typeof value === 'string' ? value : keyPath;
}

export default { t };
