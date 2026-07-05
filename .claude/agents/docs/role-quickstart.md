# Role Quick-Start (moved from root CLAUDE.md, Phase 1)

> Holding doc: Phase 3 folds each block into the matching agent definitions. Until then, agents load their block from here.

### DESIGN — דולצ'ה, נטה, גבאנה
- קרא: `knowledge/OW.md` + `knowledge/ds.md` + `docs/VISUAL_VISION.md`
- Scope: `static/tokens.css`, `static/index.html` (CSS + HTML בלבד)
- Gate: self-check P0 (DS-002) → גבאנה audit → code-reviewer skill → Playwright
- Iron Rules: DS-004 (var fallback), DS-006 (icon(), לא emoji), DS-008 (icon() = JS templates only), DS-009 (לא font-size על image containers)

### BACKEND — סאם, אורן
- קרא: `knowledge/OW.md` + `knowledge/be.md` + `docs/BACKEND_ARCHITECTURE.md`
- Scope: `app.py`, `schema.sql`, `data/`
- Gate: BE-006 pattern + rate limit + SQLite (לא in-memory) + curl test
- Iron Rules: BE-003 (Sam=schema, Oren=integration), BE-004/BE-005 (SQLite מיום 1), OW-001 (rename=3 שכבות)

### MOBILE — דנה, רועי (וראן — כיוון בלבד, לא קוד)
- קרא: `knowledge/OW.md` + `knowledge/mb.md`
- Scope: `mobile/` בלבד
- Gate: Metro bundle + `minHeight: 44` + `var(token)` + `t()` לtranslations
- Iron Rules: MB-001 (stall = וראן מפעיל), MB-002 (navigation+state לפני dispatch), OW-003 (תיאום לפני mobile/App.js)

### MANAGEMENT — ג'ף, סטיב, איילון, מארק, וראן
- קרא: `knowledge/OW.md` + `knowledge/mg.md` + `.claude/master/MASTER_PLAN.md`
- Scope: cross-cutting decisions — לא ביצוע קוד ישיר
- Gate: CE-001 (שאלת פתיחה) + scope report בפורמט PR-001
- Iron Rules: MG-002 (dispatch דרך מנהל, לא skip), MG-006 (State A vs B מתועד)

### SOCIAL — שירה
- קרא: `knowledge/OW.md` + `knowledge/sf.md`
- Scope: social features (comments, moderation, block/report, reactions)
- Gate: SF-001 (thresholds = איילון) + SF-002 (curl test חובה) + SF-003 (API key check)
- **P0 פתוח:** ANTHROPIC_API_KEY חסר = moderation fail-open. לא לdeploy ללא זה.
