from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import viewsets
from rest_framework.response import Response

from .models import SiteSettings
from .serializers import SiteSettingsSerializer


class SiteSettingsViewSet(viewsets.ViewSet):
    """Read-only endpoint для настроек сайта."""

    @method_decorator(cache_page(60 * 60))
    def list(self, request):
        settings = SiteSettings.load()
        serializer = SiteSettingsSerializer(settings)
        return Response(serializer.data)

    @method_decorator(cache_page(60 * 60))
    def retrieve(self, request, pk=None):
        settings = SiteSettings.load()
        serializer = SiteSettingsSerializer(settings)
        return Response(serializer.data)
