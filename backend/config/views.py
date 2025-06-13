from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SiteSettings
from .serializers import SiteSettingsSerializer


class SiteSettingsView(APIView):
    def get(self, request):
        # Получаем настройки сайта или создаём запись по умолчанию, если её нет
        settings = SiteSettings.objects.first()
        
        # Если настройки не найдены, создаем запись по умолчанию
        if not settings:
            settings = SiteSettings.objects.create(
                site_title="MyBlog",
                site_description="Блог о технологиях и программировании"
            )
        
        serializer = SiteSettingsSerializer(settings)
        return Response(serializer.data)
