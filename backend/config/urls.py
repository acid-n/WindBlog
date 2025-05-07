"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import HttpResponseRedirect
from django.shortcuts import redirect
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.sitemaps.views import sitemap
from blog.sitemaps import PostSitemap
from seo.sitemaps import StaticViewSitemap
from seo.views import robots_txt_view
import logging

from .views import SiteSettingsView
from blog.models import ShortLink

logger = logging.getLogger(__name__)

# Словарь sitemaps
# sitemaps = {
#     'posts': PostSitemap,
#     'static': StaticViewSitemap,
# }

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("blog.urls")),
    path(
        "api/schema/",
        SpectacularAPIView.as_view(),
        name="schema",
    ),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/token/",
        TokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),
    path(
        "api/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),
    path("api/v1/auth/", include("users.urls")),
    path("api/v1/contact/", include("contact.urls")),
    path("api/v1/site-settings", SiteSettingsView.as_view(), name="site-settings"),
    path("robots.txt", robots_txt_view, name="robots_txt"),
    # path(
    #     "sitemap.xml",
    #     sitemap,
    #     {"sitemaps": sitemaps},
    #     name="django.contrib.sitemaps.views.sitemap",
    # ), # Комментируем, так как Next.js будет генерировать sitemap
]

def shortlink_redirect(request, code: str):
    """Редирект с короткой ссылки на пост."""
    frontend_base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    logger.info(f"Попытка редиректа по короткой ссылке с кодом: {code}")

    try:
        shortlink = ShortLink.objects.select_related('post').filter(code=code).first()

        if shortlink and shortlink.post and shortlink.post.is_published:
            post_path = shortlink.post.get_absolute_url()
            redirect_url = f"{frontend_base_url}{post_path}"
            logger.info(f"Редирект по ShortLink коду {code} на: {redirect_url}")
            return redirect(redirect_url)
        else:
            logger.warning(f"ShortLink с кодом '{code}' не найден или связанный пост не опубликован.")
            return redirect(frontend_base_url)
            
    except Exception as e:
        logger.error(f"Ошибка при редиректе по короткой ссылке '{code}': {str(e)}")
        return redirect(frontend_base_url)

# Добавляем редирект с короткой ссылки
urlpatterns += [
    path("s/<str:code>/", shortlink_redirect, name="shortlink_redirect"),
]

# Статические и медиа-файлы
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
