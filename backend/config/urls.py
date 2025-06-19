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

import logging

from blog.models import ShortLink
from blog.views import custom_ckeditor_upload_file_view
from core.views import health
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.shortcuts import redirect
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from seo.views import robots_txt_view
from users.serializers import MyTokenObtainPairSerializer

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
        TokenObtainPairView.as_view(serializer_class=MyTokenObtainPairSerializer),
        name="token_obtain_pair",
    ),
    path(
        "api/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),
    path("api/v1/auth/", include("users.urls")),
    path("api/v1/", include("core.urls")),
    path("robots.txt", robots_txt_view, name="robots_txt"),
    path("health/", health),
    # path(
    #     "sitemap.xml",
    #     sitemap,
    #     {"sitemaps": sitemaps},
    #     name="django.contrib.sitemaps.views.sitemap",
    # ), # Комментируем, так как Next.js будет генерировать sitemap
]


def shortlink_redirect(request, code: str):
    """Редирект с короткой ссылки на пост."""
    frontend_base_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    logger.info(f"Попытка редиректа по короткой ссылке с кодом: {code}")

    try:
        shortlink = ShortLink.objects.select_related("post").filter(code=code).first()

        if shortlink and shortlink.post and shortlink.post.is_published:
            post_path = shortlink.post.get_absolute_url()
            redirect_url = f"{frontend_base_url}{post_path}"
            logger.info(f"Редирект по ShortLink коду {code} на: {redirect_url}")
            return redirect(redirect_url)
        else:
            logger.warning(
                f"ShortLink с кодом '{code}' не найден или связанный пост не опубликован."
            )
            return redirect(frontend_base_url)

    except Exception as e:
        logger.error(f"Ошибка при редиректе по короткой ссылке '{code}': {str(e)}")
        return redirect(frontend_base_url)


# Добавляем редирект с короткой ссылки
urlpatterns += [
    path("s/<str:code>/", shortlink_redirect, name="shortlink_redirect"),
]

# Updated URL for CKEditor 5 using the custom view
ckeditor_custom_urlpatterns = [
    path(
        "image_upload/",
        custom_ckeditor_upload_file_view,
        name="ck_editor_5_upload_file",
    ),
    # Если нужны другие URL из django_ckeditor_5, их нужно добавить сюда, например:
    # path('browse/', ckeditor_views.BrowseFileView.as_view(), name='ck_editor_5_browse_file'),
    # Либо можно импортировать все остальные стандартные URL, если они не конфликтуют:
    # re_path(r'^(?P<path>.+)/$', ckeditor_views.serve_static, name='ck_editor_5_static_serve') # Пример
]

urlpatterns += [
    path("ckeditor5/", include(ckeditor_custom_urlpatterns)),
]

# Статические и медиа-файлы
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
