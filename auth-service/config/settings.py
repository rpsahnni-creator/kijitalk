"""
KijiTalk auth service settings.

Built from the python_auth-main Django + SimpleJWT template. This service owns
login credentials only; the Node API (backend/) keeps every learner profile and
trusts the short-lived access tokens issued here (shared HS256 secret).
"""

import sys
from datetime import timedelta
from pathlib import Path
from urllib.parse import unquote, urlparse

from decouple import Csv, config

BASE_DIR = Path(__file__).resolve().parent.parent

RUNNING_TESTS = len(sys.argv) > 1 and sys.argv[1] == "test"

SECRET_KEY = config("SECRET_KEY")
DEBUG = config("DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv())

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "apps.accounts.apps.AccountsConfig",
]

AUTH_USER_MODEL = "accounts.User"

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# ── Database ────────────────────────────────────────────────────────────────
# Same Postgres database as the Node API, but every Django table lives in its
# own schema (default "auth") so Prisma — which only manages "public" — never
# sees them as drift. Legacy accounts are read from public.users on first login.
def _database_from_url(url: str) -> dict:
    parsed = urlparse(url)
    return {
        "NAME": unquote(parsed.path.lstrip("/")),
        "USER": unquote(parsed.username or ""),
        "PASSWORD": unquote(parsed.password or ""),
        "HOST": parsed.hostname or "localhost",
        "PORT": str(parsed.port or 5432),
    }


DATABASE_URL = config("DATABASE_URL", default="")
_db = (
    _database_from_url(DATABASE_URL)
    if DATABASE_URL
    else {
        "NAME": config("DB_NAME", default="kijitalk"),
        "USER": config("DB_USER", default="postgres"),
        "PASSWORD": config("DB_PASSWORD", default=""),
        "HOST": config("DB_HOST", default="localhost"),
        "PORT": config("DB_PORT", default="5432"),
    }
)

AUTH_DB_SCHEMA = config("AUTH_DB_SCHEMA", default="auth")
LEGACY_USER_TABLE = config("LEGACY_USER_TABLE", default="public.users")

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        **_db,
        # Tests run in a throwaway database, so they use the default schema.
        "OPTIONS": {} if RUNNING_TESTS else {"options": f"-c search_path={AUTH_DB_SCHEMA}"},
    }
}


# ── Passwords ───────────────────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Password reset links stay valid for 1 hour.
PASSWORD_RESET_TIMEOUT = 60 * 60
EMAIL_VERIFICATION_MAX_AGE = 60 * 60 * 24 * 3


LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ── Email ───────────────────────────────────────────────────────────────────
# The template used a non-existent "MAILERS" setting, so mail never went out.
# Defaults to printing emails in the server log; set EMAIL_BACKEND to
# django.core.mail.backends.smtp.EmailBackend plus EMAIL_HOST* for real mail.
EMAIL_BACKEND = config("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = config("EMAIL_HOST", default="localhost")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="KijiTalk <no-reply@kijitalk.local>")

FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:3100").rstrip("/")
GOOGLE_CLIENT_ID = config("GOOGLE_CLIENT_ID", default="")


# ── CORS (the web app calls this service directly, with cookies) ───────────
CORS_ALLOWED_ORIGINS = config("CORS_ALLOWED_ORIGINS", default="http://localhost:3100,http://localhost:8081", cast=Csv())
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = ["accept", "authorization", "content-type", "x-kt-client"]


# ── REST framework ──────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework_simplejwt.authentication.JWTAuthentication",),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "EXCEPTION_HANDLER": "apps.accounts.exceptions.api_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": ("rest_framework.throttling.ScopedRateThrottle",),
    "DEFAULT_THROTTLE_RATES": {
        "auth": config("THROTTLE_AUTH", default="20/min"),
        "email": config("THROTTLE_EMAIL", default="5/hour"),
    },
}


# ── JWT ─────────────────────────────────────────────────────────────────────
# Access tokens are short-lived and kept in memory by the apps. The refresh
# token lives in an httpOnly cookie (web) or secure storage (mobile), rotates on
# every use, and the previous one is blacklisted.
AUTH_JWT_SECRET = config("AUTH_JWT_SECRET")
JWT_ISSUER = config("AUTH_JWT_ISSUER", default="kijitalk-auth")
JWT_AUDIENCE = config("AUTH_JWT_AUDIENCE", default="kijitalk-api")

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=config("ACCESS_TOKEN_MINUTES", default=15, cast=int)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=config("REFRESH_TOKEN_DAYS", default=30, cast=int)),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": AUTH_JWT_SECRET,
    "ISSUER": JWT_ISSUER,
    "AUDIENCE": JWT_AUDIENCE,
}

REFRESH_COOKIE_NAME = "kt_refresh"
REFRESH_COOKIE_PATH = "/api/auth/"
REFRESH_COOKIE_SECURE = config("REFRESH_COOKIE_SECURE", default=not DEBUG, cast=bool)
REFRESH_COOKIE_SAMESITE = config("REFRESH_COOKIE_SAMESITE", default="Lax")


# ── Production hardening ────────────────────────────────────────────────────
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": config("LOG_LEVEL", default="INFO")},
}
