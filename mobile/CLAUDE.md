# Mobile / React Native rules (auto-loaded in mobile/ context)

Supplement to root CLAUDE.md. Applies to Dana, Roei, Netta, Varan.

## Token imports — always use theme/tokens
```js
import { color, typography, spacing, radius } from '../theme/tokens';

// StyleSheet usage — exact pattern from CameraPermissionScreen.js
const styles = StyleSheet.create({
  container: { backgroundColor: color.bg },
  card:      { backgroundColor: color.card, borderRadius: radius.lg },
  title:     { color: color.fg, fontSize: typography.heading1.size,
               fontWeight: String(typography.heading1.weight) },
  subtitle:  { color: color.muted, fontSize: typography.body.size },
  btn:       { backgroundColor: color.accent, minHeight: 44, borderRadius: radius.md },
});
// RefreshControl: tintColor={color.accent}  ← JS string, not CSS var
```

## Token key reference (actual keys — source: awear-tokens.json)
```
color:      .bg .surface .card .fg .muted .line .accent .accent2 .accent3 .success .warning .danger
typography: .display .heading1 .heading2 .heading3 .body .body-bold .caption .micro
            each is { size, weight, leading } — use typography.heading1.size, not typography.heading1
spacing:    spacing[4] spacing[8] spacing[12] spacing[14] spacing[16] spacing[20] spacing[24] spacing[32]
radius:     .xs=6 .sm=10 .md=14 .lg=20 .xl=28 .pill=999
```

## i18n pattern
```js
import { t } from '../i18n';  // NOT useTranslation hook
// Usage: t('screen.key')
// Add keys to mobile/i18n/en.json AND mobile/i18n/he.json
```

## API pattern
```js
const API_BASE = 'http://localhost:8000';

useEffect(() => {
  let cancelled = false;
  const load = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/posts`);
      const data = await res.json();
      if (!cancelled) setPosts(data.items || data);
    } catch (e) { /* silent — show empty state */ }
    finally { if (!cancelled) setLoading(false); }
  };
  load();
  return () => { cancelled = true; };
}, []);
```

## Mobile DoD
```bash
grep -c "#[0-9a-fA-F]\{3,6\}" mobile/screens/MyScreen.js  # → 0
grep -c "t("              mobile/screens/MyScreen.js        # → ≥ user-visible strings count
grep -c "minHeight"       mobile/screens/MyScreen.js        # → ≥ 1 (at least primary btn)
```
