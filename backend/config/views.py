from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SiteSettings
from .serializers import SiteSettingsSerializer


class SiteSettingsView(APIView):
    def get(self, request):
        settings = SiteSettings.objects.first()
        serializer = SiteSettingsSerializer(settings)
        return Response(serializer.data)
