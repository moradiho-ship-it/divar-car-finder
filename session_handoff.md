# Session handoff — Carfinding

Updated: 2026-09-19 (Asia/Tehran)

## Current release

- Branch: `main`; deployed commit: `de177cf2fa0186e7ce93d8ffd47135132d502820`.
- Render workspace: `My Workspace` (`tea-danehorbc2fs73e52ab0`).
- API: https://carfinding-api-free-hm.onrender.com (`srv-danejtegekts738nmt30`).
- Frontend: https://carfinding-web-free-hm.onrender.com (`srv-danek1qjnfac738cks1g`).
- Both Render deployments are `live` at `de177cf` and have auto-deploy enabled for `main`.
- The API health endpoint `/api/health/` returned HTTP 200, database `ok`, and release `de177cf2fa01`. The frontend returned HTTP 200; its built assets match the Render build log. A CORS request from the new frontend origin was allowed by the new API.
- Both services use the existing Supabase PostgreSQL database. Django migrations through `searches.0003_searchprofile_multi_models_trims` are applied.

## Telegram and crawling

- The Telegram bot webhook points to `https://carfinding-api-free-hm.onrender.com/api/telegram/webhook/`. `getWebhookInfo` confirmed that URL, zero pending updates, and no last error at deployment time.
- The Supabase Edge Function `trigger-crawl` has `BACKEND_URL` and `CRON_SECRET` set for the new API. A test invocation through the existing pg_cron path returned HTTP 200 and `{"status":"ok","profiles_crawled":1}`. The hourly Supabase job remains active at minute 30 UTC.
- The `carfinding-beat` and `carfinding-worker` containers on `mobin-vps` were stopped to prevent duplicate crawling and failed Telegram calls. The old backend and frontend containers remain running, so `carfinding.ir` still serves the Mobin deployment. Use the new Render frontend for the new deployment.
- The Mobin network cannot reach Telegram. This was confirmed by failed requests to Telegram's API from the VPS; the new Render/Supabase path replaces it.
- Code in `de177cf` retries up to five recent unsent matches per search during a crawl once the user's Telegram connection is verified. The retry window is seven days; notifications already sent are skipped, and failed notifications stop after three attempts. Crawls stuck in `running` for more than 15 minutes are marked failed so a new run can start.

## Outstanding user action

- The one recently found listing is match `71` / listing `71` for search profile `7` (user `2`). That user has **no verified Telegram connection**, so no notification record or message could be created.
- The user must open https://carfinding-web-free-hm.onrender.com/#/telegram, connect the bot, and press **Start**. Then run the matching search from the searches page for immediate retry, or wait for the next scheduled crawl. The matching record remains in the shared database.
- Actual delivery of that listing has **not** been verified because the Telegram connection is not yet verified. Do not claim it was sent until a `Notification.status == "sent"` record exists.
- If the new `onrender.com` site is inaccessible from the user's network, the Telegram connection can be initiated from `carfinding.ir/#/telegram` because both backends use the same database and bot. Automatic crawling and replay will still run on Render.

## Implementation and checks

- `5c265e9`: imported the full Divar car catalog from `category.md` and fixed the search form focus issue.
- `e6c25f7`: added multi-select models and trims, database migration, and matching/crawler support.
- `de177cf`: added notification replay, stale crawl recovery, and the release identifier in the API health response.
- Backend tests: `DATABASE_URL=sqlite:////tmp/carfinding-telegram-test.sqlite3 ../.venv/bin/python -m pytest -q` from `backend/` → 19 passed. `makemigrations --check --dry-run` found no changes.
- Previous frontend build and tests passed; the new Render static site build also completed successfully at `de177cf`.

## Operational notes

- The older Render services named `divar-car-finder-api` and `divar-car-finder-web` are in a different, inaccessible Render workspace. Do not confuse their URLs with the new deployment.
- `DEPLOY_FREE.md` describes the Render + Supabase architecture but still refers to the older Render service names.
- Render CLI is authenticated in the current workspace. Check releases with `render deploys list srv-danejtegekts738nmt30 --output json` and `render deploys list srv-danek1qjnfac738cks1g --output json`.
- Never commit `backend/.env`, bot tokens, database credentials, cron secrets, or tokenized Telegram API URLs. The temporary local cron-secret file used during cutover was removed.
