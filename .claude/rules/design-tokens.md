# Design tokens (Mediterranean Modern)

Scope: `static/**`, `mobile/**`. Source chain: `awear-tokens.json` → generates `static/tokens.css` (web) + feeds `mobile/theme/tokens.js` (RN). **To change a token, edit the json — never the css** (לשינוי token — ערוך את ה-json, לא את ה-css).

```
--bg:#0e0c0f    --surface:#161318   --card:#1e1a22   --card-hover:#262030
--fg:#f0ecf5    --muted:#8a8498     --line:#2e2836   --text:#fbfbfd (alias of --fg)
--accent:#e8526a  --accent2:#c4855a  --accent3:#7a6af0
--success:#52c97a  --warning:#e8a84a  --danger:#e05252

--t-micro:11px  --t-caption:12px  --t-small:13px  --t-body:14px  --t-h3:15px
--t-lead:17px   --t-title:20px    --t-h2:18px     --t-h1:24px    --t-display:32px

--space-1:4px  --space-2:8px  --space-3:12px  --space-4:16px  --space-6:24px
--r-xs:6px  --r-sm:10px  --r-md:14px  --r-lg:20px  --r-xl:28px  --r-pill:999px
```

> Token names `--t-sm`, `--t-md`, `--t-lg` do **not** exist — use `--t-small`, `--t-h3`, `--t-lead`.

Usage rules (enforced by guard_checks + Gabbana gate):
- Always `var(--token, exact-fallback)` — never bare hex (DS-004)
- No `font-size` on image containers (DS-009)
- No emoji in UI chrome — `icon()` in JS templates, inline SVG in static HTML (DS-006/DS-008)
