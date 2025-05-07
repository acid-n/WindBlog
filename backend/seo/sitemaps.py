from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from django.conf import settings

class StaticViewSitemap(Sitemap):
    """Карта сайта для основных статических страниц."""
    # Значения по умолчанию для статических страниц
    priority = 0.7
    changefreq = 'monthly'
    protocol = 'https' if not settings.DEBUG else 'http'

    def items(self):
        """
        Возвращает список имен URL-паттернов для статических страниц.
        Убедитесь, что эти имена существуют и указывают на страницы фронтенда.
        Эти имена условны, так как URL будут формироваться вручную.
        """
        return ['home', 'about', 'contact', 'tags', 'archive'] # Имена как идентификаторы

    def location(self, item):
        """Возвращает URL для статической страницы на фронтенде."""
        base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        base_url = base_url.rstrip('/')
        
        # Формируем URL в зависимости от идентификатора
        if item == 'home':
            return base_url + '/'
        elif item == 'about':
            return base_url + '/about/'
        elif item == 'contact':
            return base_url + '/contact/'
        elif item == 'tags':
            return base_url + '/tags/'
        elif item == 'archive':
            return base_url + '/archive/'
        # Добавьте другие статические страницы
        return base_url + '/' # Fallback на главную

    def get_protocol(self, request=None):
        return 'https' if not settings.DEBUG else 'http' 