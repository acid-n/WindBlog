import os
from pathlib import Path

from . import settings as base_settings

# Подгружаем все базовые настройки
globals().update(vars(base_settings))

DATABASES = {
    "default": {
        "ENGINE": os.getenv("TEST_DB_ENGINE", "django.db.backends.sqlite3"),
        "NAME": os.getenv("TEST_DB_NAME", base_settings.BASE_DIR / "test_db.sqlite3"),
        "USER": os.getenv("POSTGRES_USER", "musson_user"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD", "musson_pass"),
        "HOST": os.getenv("POSTGRES_HOST", "localhost"),
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
    }
}

if (
    DATABASES["default"]["ENGINE"] == "django.db.backends.sqlite3"
    and isinstance(DATABASES["default"]["NAME"], Path)
):
    DATABASES["default"]["NAME"] = str(DATABASES["default"]["NAME"])
