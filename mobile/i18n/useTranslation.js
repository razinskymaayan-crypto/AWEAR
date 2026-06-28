import { t } from './index';

// Hook shim. Some screens use `const { t } = useTranslation()` while others
// import `t` directly from './index'. Both resolve to the same lookup, so this
// keeps a single source of truth without rewriting either calling style.
export function useTranslation() {
  return { t };
}

export default useTranslation;
