"""Настройки для тестов с использованием SQLite."""

from . import settings as base_settings

# Импортируем базовый путь, чтобы flake8 не ругался на неопределённую переменную
BASE_DIR = base_settings.BASE_DIR

# Копируем все базовые настройки из основного модуля
for name in dir(base_settings):
    if name.isupper():
        globals()[name] = getattr(base_settings, name)

# Используем отдельную SQLite-базу
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "test.sqlite3",
    }
}

del base_settings
