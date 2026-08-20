import os
from datetime import timedelta
from pathlib import Path
import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
SECRET_KEY = os.getenv("SECRET_KEY", "unsafe-development-only-key")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
ALLOWED_HOSTS = [x for x in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if x]
INSTALLED_APPS = [
    "django.contrib.admin", "django.contrib.auth", "django.contrib.contenttypes",
    "django.contrib.sessions", "django.contrib.messages", "django.contrib.staticfiles",
    "corsheaders", "rest_framework", "django_filters", "accounts", "searches",
    "listings", "crawler", "notifications", "dashboard",
]
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware", "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware", "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware", "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware", "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
ROOT_URLCONF = "config.urls"
TEMPLATES = [{"BACKEND": "django.template.backends.django.DjangoTemplates", "DIRS": [], "APP_DIRS": True,
              "OPTIONS": {"context_processors": ["django.template.context_processors.debug", "django.template.context_processors.request",
              "django.contrib.auth.context_processors.auth", "django.contrib.messages.context_processors.messages"]}}]
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"
DATABASES = {"default": dj_database_url.config(default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}", conn_max_age=600, ssl_require=False)}
AUTH_USER_MODEL = "accounts.User"
AUTH_PASSWORD_VALIDATORS = [{"NAME": f"django.contrib.auth.password_validation.{name}"} for name in
    ["UserAttributeSimilarityValidator", "MinimumLengthValidator", "CommonPasswordValidator", "NumericPasswordValidator"]]
LANGUAGE_CODE, TIME_ZONE, USE_I18N, USE_TZ = "fa-ir", "Asia/Tehran", True, True
STATIC_URL, STATIC_ROOT = "static/", BASE_DIR / "staticfiles"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
CORS_ALLOWED_ORIGINS = list(dict.fromkeys([
    *[x for x in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",") if x],
    "https://divar-car-finder.pages.dev",
    "https://divar-car-finder-web.onrender.com",
]))
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework_simplejwt.authentication.JWTAuthentication",),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination", "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": ("django_filters.rest_framework.DjangoFilterBackend", "rest_framework.filters.OrderingFilter"),
    "DEFAULT_THROTTLE_CLASSES": ("rest_framework.throttling.UserRateThrottle",), "DEFAULT_THROTTLE_RATES": {"user": "1000/day", "crawl": "10/hour"},
}
SIMPLE_JWT = {"ACCESS_TOKEN_LIFETIME": timedelta(minutes=30), "REFRESH_TOKEN_LIFETIME": timedelta(days=7), "ROTATE_REFRESH_TOKENS": True}
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CELERY_BROKER_URL = CELERY_RESULT_BACKEND = REDIS_URL or "memory://"
CELERY_TASK_ALWAYS_EAGER = os.getenv("CELERY_TASK_ALWAYS_EAGER", "false").lower() == "true"
CELERY_TASK_EAGER_PROPAGATES = True
CELERY_BEAT_SCHEDULE = {"enqueue-due-searches": {"task": "crawler.tasks.enqueue_due_searches", "schedule": 60.0}}
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_BOT_USERNAME = os.getenv("TELEGRAM_BOT_USERNAME", "")
CRON_SECRET = os.getenv("CRON_SECRET", "")
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = CSRF_COOKIE_SECURE = not DEBUG
LOGGING = {"version": 1, "disable_existing_loggers": False, "formatters": {"json": {"format": '{{"time":"{asctime}","level":"{levelname}","event":"{message}"}}', "style": "{"}}, "handlers": {"console": {"class": "logging.StreamHandler", "formatter": "json"}}, "root": {"handlers": ["console"], "level": "INFO"}, "loggers": {"httpx": {"handlers": ["console"], "level": "WARNING", "propagate": False}, "httpcore": {"handlers": ["console"], "level": "WARNING", "propagate": False}}}
