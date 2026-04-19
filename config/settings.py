"""
Django settings for bias project.
"""

from pathlib import Path
import os
from urllib.parse import urlparse
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables. Explicit env files are primarily used by
# installation/upgrade commands that need to re-run Django in a subprocess.
load_dotenv(os.getenv('BIAS_ENV_FILE') or BASE_DIR / '.env')


def env_flag(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {'1', 'true', 'yes', 'on'}


def env_csv(name: str, default: str = "") -> list[str]:
    value = os.getenv(name, default)
    return [item.strip() for item in value.split(",") if item.strip()]


def append_unique(items: list[str], value: str | None) -> list[str]:
    if value and value not in items:
        items.append(value)
    return items


def default_url_scheme(host: str) -> str:
    normalized = (host or "").strip().lower()
    if normalized in {"localhost", "127.0.0.1"}:
        return "http"
    return os.getenv("SITE_SCHEME", "https").strip().lower() or "https"


def get_url_origin(url: str) -> str | None:
    if not url:
        return None

    parsed = urlparse(url.strip())
    if not parsed.scheme or not parsed.netloc:
        return None

    return f"{parsed.scheme}://{parsed.netloc}"


def get_url_host(url: str) -> str | None:
    if not url:
        return None

    parsed = urlparse(url.strip())
    return parsed.hostname


def normalize_origin_from_host(value: str) -> str | None:
    raw = (value or "").strip()
    if not raw:
        return None

    if "://" in raw:
        return get_url_origin(raw)

    host = raw.split("/", 1)[0].strip()
    if not host:
        return None

    return f"{default_url_scheme(host)}://{host}"


def normalize_host(value: str) -> str | None:
    raw = (value or "").strip()
    if not raw:
        return None

    if "://" in raw:
        return get_url_host(raw)

    return raw.split("/", 1)[0].split(":", 1)[0].strip() or None


def resolve_site_domains() -> tuple[list[str], list[str]]:
    hosts: list[str] = []
    origins: list[str] = []

    for value in env_csv("SITE_DOMAINS"):
        append_unique(hosts, normalize_host(value))
        append_unique(origins, normalize_origin_from_host(value))

    return hosts, origins

# Build paths inside the project like this: BASE_DIR / 'subdir'.

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-change-this-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'True') == 'True'

site_hosts, site_origins = resolve_site_domains()
default_frontend_url = 'http://localhost:5173' if DEBUG else 'http://localhost:8080'
FRONTEND_URL = (os.getenv('FRONTEND_URL') or (site_origins[0] if site_origins else default_frontend_url)).strip()

ALLOWED_HOSTS = env_csv('ALLOWED_HOSTS', 'localhost,127.0.0.1')
for host in site_hosts:
    append_unique(ALLOWED_HOSTS, host)
ALLOWED_HOSTS = append_unique(ALLOWED_HOSTS, get_url_host(FRONTEND_URL))

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party apps
    'ninja',
    'ninja_extra',
    'ninja_jwt',
    'corsheaders',
    'django_extensions',
    'channels',

    # Local apps
    'apps.core',
    'apps.users',
    'apps.discussions',
    'apps.posts',
    'apps.notifications',
    'apps.tags',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'apps.core.middleware.QueryLoggingMiddleware',
    'apps.core.middleware.MaintenanceModeMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# Database
DB_MODE = os.getenv('DB_MODE', 'sqlite' if DEBUG else 'postgres').strip().lower()

if DB_MODE in {'sqlite', 'sqlite3'}:
    sqlite_name = os.getenv('SQLITE_NAME', 'db.sqlite3')
    sqlite_path = Path(sqlite_name)
    if not sqlite_path.is_absolute():
        sqlite_path = BASE_DIR / sqlite_path
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': sqlite_path,
            'OPTIONS': {
                'timeout': 10,
            },
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': os.getenv('DB_ENGINE', 'django.db.backends.postgresql'),
            'NAME': os.getenv('DB_NAME', 'bias'),
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DB_PASSWORD', 'postgres'),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '5432'),
        }
    }

# Custom User Model
AUTH_USER_MODEL = 'users.User'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static'] if (BASE_DIR / 'static').exists() else []

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS Settings
CORS_ALLOWED_ORIGINS = env_csv(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3000,http://localhost:5173'
)
for origin in site_origins:
    append_unique(CORS_ALLOWED_ORIGINS, origin)
CORS_ALLOWED_ORIGINS = append_unique(CORS_ALLOWED_ORIGINS, get_url_origin(FRONTEND_URL))
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = env_csv('CSRF_TRUSTED_ORIGINS')
for origin in site_origins:
    append_unique(CSRF_TRUSTED_ORIGINS, origin)
CSRF_TRUSTED_ORIGINS = append_unique(CSRF_TRUSTED_ORIGINS, get_url_origin(FRONTEND_URL))

# Redis Configuration
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = os.getenv('REDIS_PORT', '6379')
REDIS_DB = os.getenv('REDIS_DB', '0')
USE_REDIS = env_flag('USE_REDIS', not DEBUG)

# Cache Configuration
CACHES = (
    {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': f'redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}',
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            }
        }
    }
    if USE_REDIS else
    {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'bias-dev-cache',
        }
    }
)

# Celery Configuration
CELERY_BROKER_URL = os.getenv(
    'CELERY_BROKER_URL',
    f'redis://{REDIS_HOST}:{REDIS_PORT}/1' if USE_REDIS else 'memory://'
)
CELERY_RESULT_BACKEND = os.getenv(
    'CELERY_RESULT_BACKEND',
    f'redis://{REDIS_HOST}:{REDIS_PORT}/2' if USE_REDIS else 'cache+memory://'
)
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Channels Configuration
CHANNEL_LAYERS = (
    {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {
                'hosts': [(REDIS_HOST, int(REDIS_PORT))],
            },
        },
    }
    if USE_REDIS else
    {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        },
    }
)

# Email Configuration
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@bias.local')

# JWT Settings
NINJA_JWT = {
    'ACCESS_TOKEN_LIFETIME': int(os.getenv('JWT_ACCESS_TOKEN_LIFETIME', '3600')),
    'REFRESH_TOKEN_LIFETIME': int(os.getenv('JWT_REFRESH_TOKEN_LIFETIME', '86400')),
    'ALGORITHM': os.getenv('JWT_ALGORITHM', 'HS256'),
    'SIGNING_KEY': os.getenv('JWT_SECRET_KEY', SECRET_KEY),
}

# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Create logs directory
os.makedirs(BASE_DIR / 'logs', exist_ok=True)

# Debug Toolbar (only in DEBUG mode)
ENABLE_DEBUG_TOOLBAR = DEBUG and os.getenv('ENABLE_DEBUG_TOOLBAR', 'False') == 'True'

if ENABLE_DEBUG_TOOLBAR:
    INSTALLED_APPS += ['debug_toolbar']
    MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')
    INTERNAL_IPS = ['127.0.0.1', 'localhost']
