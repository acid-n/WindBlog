import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from config.models import SiteSettings


@pytest.mark.django_db
def test_site_settings_endpoint():
    SiteSettings.objects.create(site_title="Blog", site_description="Tagline")
    client = APIClient()
    url = reverse("site-settings-list")
    response = client.get(url)
    assert response.status_code == 200
    assert response.data["title"] == "Blog"
    assert response.data["tagline"] == "Tagline"
