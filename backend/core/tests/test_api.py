import pytest
from core.models import SiteSettings
from django.urls import reverse
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_site_settings_endpoint():
    settings = SiteSettings.load()
    settings.title = "Blog"
    settings.tagline = "Tagline"
    settings.save()
    client = APIClient()
    url = reverse("site-settings-list")
    response = client.get(url)
    assert response.status_code == 200
    assert response.data["title"] == "Blog"
    assert response.data["tagline"] == "Tagline"
