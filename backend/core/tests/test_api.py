import pytest
from core.models import SiteSettings
from django.urls import reverse
from rest_framework.test import APIClient

from .factories import SiteSettingsFactory


@pytest.mark.django_db
def test_site_settings_endpoint():
    SiteSettingsFactory()
    client = APIClient()
    url = reverse("site-settings-list")
    response = client.get(url)
    assert response.status_code == 200
    assert response.data["title"] == "Blog"
    assert response.data["tagline"] == "Tagline"
    assert SiteSettings.objects.count() == 1
