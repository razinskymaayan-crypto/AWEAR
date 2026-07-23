# Render Deployment Guide — AWEAR Backend

Live URL: **https://awear-x4o2.onrender.com**  
`capacitor.config.json` already points at this URL — mobile builds hit the live backend automatically.

## One-time setup (founder only)

### 1. Connect the repo to Render
- Go to https://dashboard.render.com → New → Blueprint
- Connect the `AWEAR` GitHub repo; Render auto-reads `render.yaml`
- Service name: `awear`; plan: Free (upgrade to Starter once traffic grows)

### 2. Set secrets in the Render dashboard
Go to the service → Environment → Add these Secret Files / Env Vars:

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | **Yes** | Claude Vision for /api/analyze (garment ID) |
| `OPENAI_API_KEY` | Optional | OpenAI Images for /api/generate-garment (clean catalog photos) |
| `PEXELS_API_KEY` | Optional | Higher-quality product images; falls back to Unsplash without it |
| `SUPABASE_URL` | Optional | Your Supabase project URL (https://xxxx.supabase.co) |
| `SUPABASE_SERVICE_KEY` | Optional | service_role key — for Storage bucket uploads of generated images |
| `SUPABASE_JWT_SECRET` | Optional | JWT secret from Supabase Settings → API → JWT Secret — for auth token verification |
| `DATABASE_URL` | Optional | `postgresql://postgres:[password]@[host]/postgres` — leave empty to run SQLite |

Without `DATABASE_URL`, the app uses SQLite at `./data/awear.db` (persisted on the attached disk).
Without Supabase Storage, generated garment images are stored at `/static/img/generated/` (local disk, lost on next deploy).

### 3. Verify the deploy
```
curl https://awear-x4o2.onrender.com/api/scan-health | python3 -m json.tool
```
Expected: `key_configured: true` (if ANTHROPIC_API_KEY is set), `database.mode: "sqlite"` or `"postgres"`.

For a live Vision scan smoke test (optional):
```
python3 scripts/scan_smoke.py
```

## Supabase Postgres (production — DECISIONS #17)

1. Create a Supabase project at https://supabase.com
2. Run `notes/schema_postgres.sql` in the Supabase SQL Editor (Schema → SQL Editor → paste → Run)
3. Copy the connection string from Settings → Database → Connection string → URI
4. Set `DATABASE_URL` on Render to that connection string
5. On next deploy, the app auto-switches from SQLite to Postgres

## Notes
- The `render.yaml` disk mounts at `./data` — keeps `awear.db` across deploys (dev/SQLite mode)
- Generated images: need either Supabase Storage (SUPABASE_URL + SUPABASE_SERVICE_KEY) or the local disk survives between deploys (it does on Render's persistent disk)
- Mobile builds use `capacitor.config.json → server.url` — already set to the live Render URL
