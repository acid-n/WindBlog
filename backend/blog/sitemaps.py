from django.conf import settings  # Импортируем settings
from django.contrib.sitemaps import Sitemap
from seo.models import GlobalSEOSettings  # Импортируем глобальные настройки

from .models import Post


class PostSitemap(Sitemap):
    """Карта сайта для опубликованных постов блога."""

    # Получаем настройки по умолчанию
    # Используем try-except на случай, если миграция еще не создала объект
    try:
        settings_instance = GlobalSEOSettings.objects.first()
        default_changefreq = (
            settings_instance.default_sitemap_changefreq
            if settings_instance
            else "weekly"
        )
        default_priority = (
            settings_instance.default_sitemap_priority if settings_instance else 0.8
        )  # Повысим приоритет для постов
    except Exception:
        settings_instance = None
        default_changefreq = "weekly"
        default_priority = 0.8

    # Устанавливаем значения по умолчанию, если в объекте не заданы свои
    changefreq = default_changefreq
    priority = default_priority
    protocol = "https" if not settings.DEBUG else "http"  # Протокол для URL

    def items(self):
        """Возвращает queryset объектов для карты сайта."""
        return Post.objects.filter(is_published=True, sitemap_include=True).order_by(
            "-first_published_at"
        )

    def lastmod(self, obj):
        """Возвращает дату последнего изменения объекта."""
        return obj.updated_at  # Используем updated_at для точности

    def location(self, obj):
        """Возвращает URL объекта. Используем URL фронтенда."""
        base_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
        base_url = base_url.rstrip("/")
        relative_url = obj.get_absolute_url()
        return f"{base_url}{relative_url}"

    def get_protocol(self, request=None):
        """Возвращает протокол (http или https)."""
        # Предпочитаем HTTPS для production
        return "https" if not settings.DEBUG else "http"
