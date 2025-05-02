import pytest
from django.urls import reverse
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestAnalyticsAPI:
    def setup_method(self):
        self.client = APIClient()

    def test_create_analytics_event(self):
        url = reverse("analytics-list")
        data = {
            "path": "/test/",
            "ip": "127.0.0.1",
            "user_agent": "pytest",
            "referrer": "",
        }
        response = self.client.post(url, data)
        assert response.status_code == 201
        assert response.data["path"] == "/test/"
        assert response.data["ip"] == "127.0.0.1"
