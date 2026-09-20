# Session handoff — Carfinding

Updated: 2026-09-20 (Asia/Tehran)

## Current release

- Branch: `main`; Render API deployed commit: `098825fd3fa5e1e5c19ade8a2f26f7974dbf33f6`.
- Render workspace: `My Workspace` (`tea-danehorbc2fs73e52ab0`).
- API: https://carfinding-api-free-hm.onrender.com (`srv-danejtegekts738nmt30`).
- Primary frontend: https://carfinding.ir (Mobin VPS, React container and Caddy).
- Render frontend fallback: https://carfinding-web-free-hm.onrender.com (`srv-danek1qjnfac738cks1g`), still at `de177cf`.
- `https://carfinding.ir/api/health/` returned HTTP 200, database `ok`, and Render release `098825fd3fa5`. The Mobin frontend returned HTTP 200. Admin GET and an invalid admin POST with a valid CSRF token also worked through the proxy.
- On 2026-09-20, the Mobin-to-Render API proxy produced intermittent 502s. The API now goes through the deployed Supabase `render-proxy` Edge Function; ten consecutive invalid-login requests through `carfinding.ir` returned the expected HTTP 401, and the JWT header reached Django.
- Both services use the existing Supabase PostgreSQL database. Django migrations through `searches.0003_searchprofile_multi_models_trims` are applied.

## Telegram and crawling

- The Telegram bot webhook points to `https://carfinding-api-free-hm.onrender.com/api/telegram/webhook/`. `getWebhookInfo` confirmed that URL, zero pending updates, and no last error at deployment time.
- The Supabase Edge Function `trigger-crawl` has `BACKEND_URL` and `CRON_SECRET` set for the new API. A test invocation through the existing pg_cron path returned HTTP 200 and `{"status":"ok","profiles_crawled":1}`. The hourly Supabase job remains active at minute 30 UTC.
- The `carfinding-beat`, `carfinding-worker`, `carfinding-backend`, and `carfinding-redis` containers on `mobin-vps` are stopped. Only the frontend container and Caddy serve `carfinding.ir`; API requests go through Supabase to Render, while admin and static backend requests use Render ingress IPs.
- The Mobin network cannot reach Telegram. This was confirmed by failed requests to Telegram's API from the VPS; the new Render/Supabase path replaces it.
- Code in `de177cf` retries up to five recent unsent matches per search during a crawl once the user's Telegram connection is verified. The retry window is seven days; notifications already sent are skipped, and failed notifications stop after three attempts. Crawls stuck in `running` for more than 15 minutes are marked failed so a new run can start.

## Outstanding user action

- The one recently found listing is match `71` / listing `71` for search profile `7` (user `2`). That user has **no verified Telegram connection**, so no notification record or message could be created.
- The user can open https://carfinding.ir/#/telegram, connect the bot, and press **Start**. Then run the matching search from the searches page for immediate retry, or wait for the next scheduled crawl. The matching record remains in the shared database.
- Actual delivery of that listing has **not** been verified because the Telegram connection is not yet verified. Do not claim it was sent until a `Notification.status == "sent"` record exists.
- The Telegram deep link itself may still require a VPN or the Telegram app's proxy on the user's network; the site and API no longer require direct access to Render from the user's browser.

## Implementation and checks

- `5c265e9`: imported the full Divar car catalog from `category.md` and fixed the search form focus issue.
- `e6c25f7`: added multi-select models and trims, database migration, and matching/crawler support.
- `de177cf`: added notification replay, stale crawl recovery, and the release identifier in the API health response.
- `098825f`: added the Mobin Caddy proxy, frontend-only Compose configuration, and Django admin CSRF origins. The Mobin frontend was rebuilt with `VITE_API_URL=/api`.
- On 2026-09-20, `carfinding.ir` frontend and API, `www.carfinding.ir/api/health/`, and Mobin-local HTTPS requests all returned HTTP 200 after the local backend was stopped.
- Backend tests: `DATABASE_URL=sqlite:////tmp/carfinding-telegram-test.sqlite3 ../.venv/bin/python -m pytest -q` from `backend/` → 19 passed. `makemigrations --check --dry-run` found no changes.
- Previous frontend build and tests passed; the new Render static site build also completed successfully at `de177cf`.

## Operational notes

- The older Render services named `divar-car-finder-api` and `divar-car-finder-web` are in a different, inaccessible Render workspace. Do not confuse their URLs with the new deployment.
- `DEPLOY_FREE.md` describes the Render + Supabase architecture but still refers to the older Render service names.
- The Mobin DNS resolver returns `10.10.34.36` for the Render hostname. Direct Mobin-to-Render requests through public IPs were also unreliable, so only admin and static backend paths use those IPs. See `deploy/mobin/README.md` for the Supabase relay and its shared secret file.
- Render CLI is authenticated in the current workspace. Check releases with `render deploys list srv-danejtegekts738nmt30 --output json` and `render deploys list srv-danek1qjnfac738cks1g --output json`.
- Never commit `backend/.env`, bot tokens, database credentials, cron secrets, or tokenized Telegram API URLs. The temporary local cron-secret file used during cutover was removed.
