# Free deployment: Supabase + Render + Cloudflare Pages

> Current live deployment uses Render for the API, Cloudflare Pages for the UI,
> and Supabase Edge Functions plus Supabase Cron for hourly crawling.

## 1. Supabase database

Copy the **Session pooler** connection string from Supabase Dashboard → Connect.
Use session mode on port 5432 for Koyeb and GitHub Actions. Keep it in secrets as
`DATABASE_URL`; never commit it.

## 2. Source repository

Push this repository to GitHub. Add these repository Actions secrets:

- `DATABASE_URL`
- `DJANGO_SECRET_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`

The workflow `.github/workflows/crawl.yml` runs due searches hourly and can also
be started manually from the Actions tab. It uses database locking and does not
need Redis.

## 3. Django API on Koyeb

Create a Web Service from the GitHub repository:

- Builder: Dockerfile
- Work directory: `backend`
- Dockerfile: `Dockerfile`
- Instance: Free
- Port: `8000`, HTTP
- Health check: `/api/health/`

Set all values from `backend/.env.production.example`. In particular:

- `ALLOWED_HOSTS=.koyeb.app`
- `CELERY_TASK_ALWAYS_EAGER=true`
- `REDIS_URL` empty
- `DATABASE_URL` set to the Supabase session-pooler URL

The container runs migrations and static collection before Gunicorn starts.

## 4. React dashboard on Cloudflare Pages

Create a Pages project from the same repository:

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment: `VITE_API_URL=https://YOUR-APP.koyeb.app/api`

Then update Koyeb `CORS_ALLOWED_ORIGINS` with the final Pages URL and redeploy.

## 5. Telegram webhook

After Koyeb has a public domain, configure:

```text
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://YOUR-APP.koyeb.app/api/telegram/webhook/
```

Do this privately; never paste the complete URL into logs or source control.
