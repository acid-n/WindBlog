from config.models import SiteSettings
from rest_framework import serializers


class SiteSettingsSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source="site_title")
    tagline = serializers.CharField(source="site_description")

    class Meta:
        model = SiteSettings
        fields = ("title", "tagline")
