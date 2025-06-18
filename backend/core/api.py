from config.models import SiteSettings
from rest_framework import viewsets
from rest_framework.response import Response

from .serializers import SiteSettingsSerializer


class SiteSettingsViewSet(viewsets.ViewSet):
    """Read-only endpoint для настроек сайта."""

    def list(self, request):
        settings = SiteSettings.objects.first()
        serializer = SiteSettingsSerializer(settings)
        return Response(serializer.data)
