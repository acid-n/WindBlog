"""
Настройки Django для тестовой среды.
Наследуется от основных настроек, но перенаправляет Redis на локальное кэширование
и отключает rate limiting для ускорения и стабильности тестов.
"""

from .settings import *

# Переопределяем настройки кэширования для тестов
# Используем локальный кэш вместо Redis для ускорения тестов
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "unique-snowflake-test",
        "TIMEOUT": 300,
    }
}

# Используем локальный кэш для сессий в тестах
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"

# Отключаем rate limiting для тестов
RATELIMIT_ENABLE = False

# Отключаем prometheus-метрики в тестах
INSTALLED_APPS = [app for app in INSTALLED_APPS if app != "django_prometheus"]
MIDDLEWARE = [
    middleware for middleware in MIDDLEWARE 
    if "django_prometheus" not in middleware
]

# Настройки логирования для тестов (уменьшаем вербозность)
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'level': 'ERROR',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'ERROR',
    },
}

# Настройки безопасности для тестов можно оставить включёнными,
# чтобы тесты охватывали и этот функционал

# Явные настройки базы данных для тестирования
# Для локальных тестов используем SQLite, а для Docker - PostgreSQL
if os.environ.get("DB_ENGINE") == "sqlite":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": os.path.join(BASE_DIR, "db.sqlite3.test"),
            "TEST": {
                "NAME": os.path.join(BASE_DIR, "db.sqlite3.test"),
            },
        }
    }
else:
    # Используем PostgreSQL для Docker или если не указан DB_ENGINE
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("POSTGRES_DB", "test_db"),
            "USER": os.environ.get("POSTGRES_USER", "test_user"),
            "PASSWORD": os.environ.get("POSTGRES_PASSWORD", "test_password"),
            "HOST": os.environ.get("POSTGRES_HOST", "test_db"),
            "PORT": os.environ.get("POSTGRES_PORT", "5432"),
            "TEST": {
                "NAME": os.environ.get("POSTGRES_DB", "test_db"),
            },
        }
    }
