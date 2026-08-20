# Free deployment: Render + Supabase

Production currently uses:

- Render Web Service for Django API
- Render Static Site for React
- Supabase PostgreSQL
- Supabase Edge Functions + pg_cron/pg_net for hourly crawling
- Telegram Bot API for notifications

Cloudflare Pages remains an optional frontend target, but `pages.dev` may be blocked by some networks. The documented primary frontend is Render.

## 1. Supabase database

Create a Supabase project and copy the Session Pooler connection string from **Project Settings → Database → Connect**. Store it as `DATABASE_URL`; never commit it.

Apply Django migrations:

```bash
cd backend
python manage.py migrate
```

Link the Supabase CLI and apply scheduler migrations:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push --linked --include-all
```

The migration schedules `divar-car-finder-hourly` at minute 17 of every hour. `pg_net` uses a 60-second timeout so a sleeping Render service has time to wake up.

## 2. Django API on Render

Create a Web Service from the GitHub repository:

- Runtime: Docker
- Root directory: `backend`
- Dockerfile: `./Dockerfile`
- Plan: Free
- Health check: `/api/health/`

Set:

```env
DEBUG=false
SECRET_KEY=<random-secret>
DATABASE_URL=<supabase-session-pooler-url>
ALLOWED_HOSTS=.onrender.com
CORS_ALLOWED_ORIGINS=https://YOUR-FRONTEND.onrender.com
REDIS_URL=
CELERY_TASK_ALWAYS_EAGER=true
TELEGRAM_BOT_TOKEN=<secret>
TELEGRAM_BOT_USERNAME=<username-without-at-sign>
CRON_SECRET=<random-shared-secret>
```

The container entrypoint applies migrations and collects static files before starting Gunicorn.

## 3. React frontend on Render

Create a Static Site from the same repository:

- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment: `VITE_API_URL=https://YOUR-API.onrender.com/api`

The application uses hash routing, so direct links work without a static-site rewrite rule. Add the final frontend origin to `CORS_ALLOWED_ORIGINS` and redeploy the API.

## 4. Supabase Edge Function scheduler

Deploy the function:

```bash
supabase functions deploy trigger-crawl --project-ref YOUR_PROJECT_REF
```

Set function secrets:

```bash
supabase secrets set \
  BACKEND_URL=https://YOUR-API.onrender.com \
  CRON_SECRET=<same-value-as-render> \
  SCHEDULE_SECRET=<separate-random-secret> \
  --project-ref YOUR_PROJECT_REF
```

The database Vault values used by the scheduler are:

- `edge_function_url`
- `supabase_publishable_key`
- `crawl_schedule_secret` matching `SCHEDULE_SECRET`

The Edge Function requires `x-schedule-secret`, then calls `/api/internal/crawl-due/` with `x-cron-secret`. Do not expose either secret in frontend variables.

## 5. Telegram webhook

Configure after the API is live:

```text
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://YOUR-API.onrender.com/api/telegram/webhook/
```

Do not paste the complete tokenized URL into source code, issues, screenshots or logs. If a token is exposed, revoke it in BotFather and update Render immediately.

## 6. Verification

Check the API:

```bash
curl https://YOUR-API.onrender.com/api/health/
```

Then verify:

1. Login to the React dashboard.
2. Connect Telegram and press Start in the bot.
3. Create a broad test search.
4. Run it from «جستجوهای من».
5. Check «تاریخچه بررسی‌ها» for scanned/matched counts.
6. Confirm the listing appears in «آگهی‌های پیدا شده».
7. Enable «ارسال عکس‌ها به‌صورت آلبوم» and confirm the Telegram media group.

## Troubleshooting

### Search scans listings but finds zero matches

- Inspect stored numeric bounds; blank values must be `null`, not zero.
- Imported cars may use Gregorian years; the parser converts them to Jalali.
- Review `CrawlRun.error_message` and matching scores.

### Telegram text arrives but images do not

- Ensure `send_images` is enabled for that search.
- The backend uploads image bytes with multipart `sendMediaGroup`; review `telegram_album_failed` logs.
- Telegram albums contain at most 10 images.

### Scheduler times out

- Confirm the latest Supabase migration sets `timeout_milliseconds := 60000`.
- Confirm `BACKEND_URL`, `CRON_SECRET`, `SCHEDULE_SECRET` and Vault values agree.
- A cold Render Free service can take about a minute to start.

### Frontend/API URL does not open

- Confirm both Render deploys are `live`.
- Check DNS filtering on the client network.
- Verify `VITE_API_URL`, `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`.
