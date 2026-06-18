# P0 Alert: ANTHROPIC_API_KEY Missing

**גילוי:** שירה, Cycle 1, Phase 4
**השפעה:** /api/moderate fail-open — כל comment עובר, כולל harmful content
**פתרון:** הכנס ANTHROPIC_API_KEY לenv לפני deploy
**action item:** Steve/Jeff — set secret in production env
