# خودروبان — Divar Car Finder

خودروبان یک داشبورد فارسی RTL برای ساخت جستجوهای خودرو، پایش دوره‌ای آگهی‌های دیوار، تطبیق سمت سرور و ارسال اعلان تلگرام است.

## نسخه آنلاین

- داشبورد: <https://divar-car-finder-web.onrender.com>
- API: <https://divar-car-finder-api.onrender.com/api/>
- Health check: <https://divar-car-finder-api.onrender.com/api/health/>
- مخزن: <https://github.com/moradiho-ship-it/divar-car-finder>

سرویس‌های رایگان Render ممکن است پس از مدتی عدم استفاده sleep شوند؛ اولین درخواست می‌تواند حدود یک دقیقه طول بکشد.

## قابلیت‌ها

- ساخت چند جستجوی مستقل با برند، مدل، تیپ، سال، قیمت، کارکرد، شهر، محله، رنگ، گیربکس، وضعیت بدنه و واژه‌های لازم/حذف‌کننده
- فهرست‌های قابل جستجو و تکمیل خودکار بر اساس taxonomy خودروهای دیوار
- حذف کامل فیلترهای عددی خالی؛ مقدار خالی هرگز به صفر تبدیل نمی‌شود
- پشتیبانی از سال شمسی و تبدیل سال میلادی خودروهای وارداتی به سال شمسی
- استخراج قیمت، سال، کارکرد، شهر، توضیحات کامل، وضعیت شاسی، وضعیت بدنه و تصاویر صفحه جزئیات
- جلوگیری از ثبت آگهی، تطبیق و اعلان تکراری
- اتصال حساب تلگرام با deep-link یک‌بارمصرف
- اعلان متنی همراه مشخصات و لینک مستقیم آگهی
- ارسال اختیاری حداکثر ۱۰ تصویر به‌صورت Telegram Media Group
- نمایش تصاویر آگهی در carousel با thumbnail و کنترل قبلی/بعدی
- انتخاب تکی، انتخاب همه و حذف گروهی آگهی‌های پیدا‌شده
- نمایش خطاهای validation برگشتی API زیر فیلد و داخل فرم
- تاریخچه اجرای crawler و آمار روزانه داشبورد

## معماری production

```text
Browser
  └─ React static site (Render)
       └─ Django REST API (Render Free)
            ├─ Supabase PostgreSQL
            ├─ Divar listing/detail pages
            └─ Telegram Bot API

Supabase pg_cron (at the start of every hour in Tehran; minute 30 UTC)
  └─ Supabase Edge Function: trigger-crawl
       └─ protected Django crawl-due endpoint
```

- `backend/`: Django 4.2، Django REST Framework، JWT و PostgreSQL
- `frontend/`: React، Vite، TypeScript، Tailwind، TanStack Query، React Hook Form و Zod
- `backend/crawler/`: provider interface، URL builder، parser، detail enrichment و matching engine
- `backend/notifications/`: اتصال و ارسال Telegram، album upload و delivery status
- `supabase/functions/trigger-crawl/`: پل محافظت‌شده بین pg_cron و Render

اجرای production روی Render رایگان synchronous است و به worker دائمی یا Redis نیاز ندارد. ساختار Celery برای استقرارهای دارای worker/Redis نیز حفظ شده است.

## ساختار پروژه

```text
backend/
  accounts/       users and current-user API
  searches/       search profiles and validation
  listings/       listings, matches and safe bulk deletion
  crawler/        Divar provider, parser, matching and crawl runs
  notifications/  Telegram connection and delivery
  dashboard/      summary, health and scheduled crawl endpoint
frontend/
  src/components/ reusable autocomplete and UI components
  src/data/       vehicle taxonomy candidates
  src/pages/      dashboard, searches, listings and Telegram pages
supabase/
  functions/trigger-crawl/
  migrations/     pg_cron/pg_net scheduling
```

## راه‌اندازی محلی

نیازمندی‌ها: Python 3.10+، Node.js 20+ و در حالت asynchronous، Redis 7.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python backend/manage.py migrate
python backend/manage.py createsuperuser
python backend/manage.py runserver
```

در ترمینال دیگر:

```bash
cd frontend
npm install
npm run dev
```

- UI: `http://localhost:5173`
- API: `http://localhost:8000/api/`
- Admin: `http://localhost:8000/admin/`
- Health: `http://localhost:8000/api/health/`

برای اجرای asynchronous محلی:

```bash
cd backend
celery -A config worker -l info
celery -A config beat -l info
```

## متغیرهای محیطی

مقادیر نمونه در `backend/.env.example`، `backend/.env.production.example` و `frontend/.env.example` قرار دارند.

متغیرهای ضروری backend:

- `SECRET_KEY`
- `DATABASE_URL`
- `ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME` بدون `@`
- `CRON_SECRET` برای endpoint زمان‌بندی

متغیر ضروری frontend:

- `VITE_API_URL`، برای نمونه `https://divar-car-finder-api.onrender.com/api`

هیچ database password، service-role key، bot token، chat ID یا Django secret نباید commit شود.

## اتصال تلگرام

1. ربات را در BotFather بسازید.
2. `TELEGRAM_BOT_TOKEN` و `TELEGRAM_BOT_USERNAME` را در secret manager backend قرار دهید.
3. webhook را روی آدرس زیر تنظیم کنید:

```text
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://YOUR_BACKEND/api/telegram/webhook/
```

4. کاربر در صفحه «اتصال تلگرام» روی دکمه اتصال می‌زند و ربات را Start می‌کند.

توکن اتصال کاربر hash شده، ۱۵ دقیقه معتبر و یک‌بارمصرف است. اگر گزینه «ارسال عکس‌ها به‌صورت آلبوم» فعال باشد، backend تصاویر را دانلود و به‌صورت فایل multipart برای Telegram آپلود می‌کند؛ در نتیجه محدودیت URLهای CDN دیوار مانع ارسال نمی‌شود.

## Crawling و matching

- URL شهر فارسی قبل از درخواست به slug دیوار تبدیل می‌شود؛ برای نمونه `تهران → tehran`.
- صفحه فهرست برای عنوان، قیمت، کارکرد و سال parse می‌شود.
- فقط کاندیداهای اولیه منطبق، صفحه جزئیات را برای توضیحات، وضعیت شاسی/بدنه و تصاویر دریافت می‌کنند.
- سال‌های میلادی مانند `2015` به سال شمسی متناظر تبدیل می‌شوند.
- برند می‌تواند در عنوان حذف شده باشد؛ در صورت وجود مدل دقیق، برند جستجو قابل استنتاج است.
- فیلد عددی خالی `null` است و در matching شرکت نمی‌کند.
- خطا و شمارنده‌های هر اجرا در `CrawlRun` ذخیره می‌شوند.

اجرای دستی از UI یا API:

```text
POST /api/searches/:id/run/
```

اجرای تمام جستجوهای موعدرسیده:

```bash
cd backend
python manage.py crawl_due --sync
```

## APIهای اصلی

| Method | Path | کاربرد |
|---|---|---|
| `POST` | `/api/auth/login/` | دریافت JWT |
| `POST` | `/api/auth/refresh/` | تمدید JWT |
| `GET/POST` | `/api/searches/` | فهرست/ساخت جستجو |
| `GET/PATCH/DELETE` | `/api/searches/:id/` | مشاهده/ویرایش/حذف جستجو |
| `POST` | `/api/searches/:id/run/` | اجرای فوری جستجو |
| `GET` | `/api/listings/` | آگهی‌های منطبق کاربر |
| `POST` | `/api/listings/bulk-delete/` | حذف امن ارتباط آگهی‌های انتخابی با کاربر |
| `GET` | `/api/crawl-runs/` | تاریخچه اجراها |
| `GET` | `/api/telegram/status/` | وضعیت اتصال تلگرام |
| `POST` | `/api/telegram/connect/` | ساخت deep-link اتصال |
| `DELETE` | `/api/telegram/disconnect/` | قطع اتصال تلگرام |
| `GET` | `/api/dashboard/summary/` | آمار داشبورد |
| `GET` | `/api/health/` | سلامت سرویس |

تمام queryها بر اساس کاربر احرازشده محدود می‌شوند. حذف گروهی فقط matchها و notificationهای همان کاربر را حذف می‌کند و آگهی مشترک کاربران دیگر را نگه می‌دارد.

## تست و بررسی

```bash
cd backend
DATABASE_URL=sqlite:///:memory: pytest
python manage.py check

cd ../frontend
npm run build
```

در حال حاضر frontend فایل تست خودکار ندارد؛ `npm test` تا زمان اضافه‌شدن test file با پیام `No test files found` خارج می‌شود.

## Docker

```bash
docker compose up --build
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

اگر `DATABASE_URL` تنظیم نشود، backend برای توسعه از SQLite استفاده می‌کند.

## نگهداری parser دیوار

تمام منطق وابسته به دیوار در `backend/crawler/divar.py` قرار دارد. crawler CAPTCHA یا محدودیت فنی را دور نمی‌زند. هنگام تغییر HTML دیوار:

1. یک fixture پاک‌سازی‌شده HTML/JSON بسازید.
2. تست parser را به‌روزرسانی کنید.
3. selector یا walker را اصلاح کنید.
4. extraction زنده، `CrawlRun` و اعلان Telegram را بررسی کنید.

پیش از استفاده production، شرایط استفاده، robots.txt و محدودیت نرخ دیوار را بررسی کنید.

## استقرار

راهنمای کامل استقرار رایگان در [DEPLOY_FREE.md](DEPLOY_FREE.md) قرار دارد.
