from rest_framework import serializers

from config.models import SiteSettings

class SiteSettingsSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source="site_title")
    tagline = serializers.CharField(source="site_description")

    class Meta:
        model = SiteSettings
        fields = ("title", "tagline")
