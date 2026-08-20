# خودروبان — Divar Car Finder

یک داشبورد فارسی RTL برای تعریف جستجوی خودرو، بررسی دوره‌ای آگهی‌های دیوار، تطبیق سمت سرور و اعلان بدون تکرار در تلگرام.

## نسخه آنلاین

- داشبورد: <https://divar-car-finder-web.onrender.com>
- API: <https://divar-car-finder-api.onrender.com/api/>
- سلامت سرویس: <https://divar-car-finder-api.onrender.com/api/health/>

API روی Render Free، رابط روی Cloudflare Pages، دیتابیس روی Supabase و اجرای
ساعتی crawler روی Supabase Edge Functions و Supabase Cron قرار دارد.

## معماری

- `backend/`: Django 4.2، DRF، JWT، PostgreSQL/Supabase، Celery و Redis
- `frontend/`: React، Vite، TypeScript، Tailwind، TanStack Query، React Hook Form و Zod
- `crawler/`: قرارداد مستقل `ListingProvider`، سازنده URL، کلاینت/پارسر دیوار، نرمال‌ساز، موتور تطبیق و workflow تراکنشی
- `notifications/`: اتصال امن تلگرام با توکن یک‌بارمصرف ۱۵ دقیقه‌ای و ارسال پیام

احراز هویت با کاربر Django و JWT انجام می‌شود. این انتخاب برای استقرار مستقل، Django Admin و workerها ساده‌تر است. تمام QuerySetهای API بر اساس کاربر فعلی محدود شده‌اند. کلاینت هرگز کلید خصوصی Supabase یا توکن ربات را دریافت نمی‌کند.

سیاست حذف تکرار سه‌لایه است: `(provider, external_id)` برای آگهی، `(search_profile, listing)` برای تطابق، و `(user, listing, channel)` برای اعلان. بنابراین یک آگهی می‌تواند با چند جستجو منطبق باشد اما برای یک کاربر فقط یک پیام تلگرام می‌سازد.

## راه‌اندازی مستقیم

نیازمندی‌ها: Python 3.10+، Node 20+ و Redis 7.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

در ترمینال‌های جدا:

```bash
cd backend && source .venv/bin/activate && celery -A config worker -l info
cd backend && source .venv/bin/activate && celery -A config beat -l info
cd frontend && npm install && npm run dev
```

رابط در `http://localhost:5173`، API در `http://localhost:8000/api/`، سلامت در `GET /api/health/` و ادمین در `/admin/` است.

## Supabase

در Supabase یک پروژه PostgreSQL موجود است. `DATABASE_URL` را فقط در `backend/.env` قرار دهید. برای اتصال‌های IPv4 یا محیط‌های serverless می‌توان از Connection Pooler ارائه‌شده در تنظیمات Supabase استفاده کرد. سپس `python manage.py migrate` را اجرا کنید. migrationها هیچ جدول موجودی را حذف نمی‌کنند.

## تلگرام

1. در BotFather یک ربات بسازید و `TELEGRAM_BOT_TOKEN` و نام بدون `@` را در محیط backend قرار دهید.
2. webhook را به `https://YOUR_BACKEND/api/telegram/webhook/` تنظیم کنید:
   `https://api.telegram.org/bot<TOKEN>/setWebhook?url=<URL>`
3. کاربر در صفحه اتصال تلگرام deep-link می‌گیرد. مقدار `/start` به شکل hash در دیتابیس نگهداری می‌شود، ۱۵ دقیقه اعتبار دارد و پس از مصرف پاک می‌شود.

## زمان‌بندی و اجرای دستی

Celery Beat هر دقیقه پروفایل‌های موعدرسیده را پیدا می‌کند؛ فاصله هر پروفایل پیش‌فرض ۶۰ دقیقه است. Redis lock مانع اجرای هم‌زمان یک پروفایل می‌شود. جایگزین سبک cron:

```bash
cd backend && python manage.py crawl_due
```

اجرای دستی از داشبورد یا `POST /api/searches/:id/run/` job را در صف می‌گذارد و rate-limit دارد.

## تست و build

```bash
cd backend && pytest
cd frontend && npm test
cd frontend && npm run build
```

## Docker

ابتدا `backend/.env` را بسازید و سپس:

```bash
docker compose up --build
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

پایگاه داده Supabase بیرون compose باقی می‌ماند. برای توسعه بدون Supabase، اگر `DATABASE_URL` خالی باشد SQLite استفاده می‌شود.

## متغیرهای محیطی و امنیت

نمونه کامل در فایل‌های `.env.example` است. `SECRET_KEY`، `DATABASE_URL`، `SUPABASE_SECRET_KEY` و `TELEGRAM_BOT_TOKEN` باید در secret manager میزبان ذخیره شوند. در production مقدار `DEBUG=false`، میزبان‌ها و CORS دقیق، HTTPS و webhook secret/reverse-proxy محدودشده توصیه می‌شود. کلیدهای `VITE_` عمومی هستند.

## نگهداری parser دیوار

درخواست زنده فقط در `crawler/divar.py` قرار دارد و CAPTCHA یا محدودیت فنی را دور نمی‌زند. اگر ساختار تغییر کرد، fixture HTML/JSON پاک‌سازی‌شده بسازید، ابتدا تست `DivarParser` را اصلاح کنید و بعد selector یا walker را تغییر دهید. خطای یک پاسخ در `CrawlRun.error_message` ثبت می‌شود و worker از کار نمی‌افتد. قبل از استقرار، شرایط استفاده، robots و نرخ مجاز دیوار را بررسی کنید.

## استقرار

backend، worker و beat را از یک image روی Railway/Render/Fly/VPS اجرا کنید؛ Redis مدیریت‌شده و Supabase PostgreSQL را متصل کنید. frontend مستقل روی CDN یا image nginx قابل استقرار است. migration را به‌عنوان release command اجرا کنید. برای observability لاگ‌ها JSON-like و دارای شناسه run/profile/listing هستند؛ secretها log نمی‌شوند.

در استقرار رایگان، Supabase Cron در دقیقه ۱۷ هر ساعت Edge Function به نام
`trigger-crawl` را اجرا می‌کند. این تابع endpoint محافظت‌شده Render را صدا می‌زند؛
`crawl_due --sync` و lock دیتابیس نیز جایگزین worker دائمی و Redis هستند.
