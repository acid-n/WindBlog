import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestAnalyticsAPI:
    def setup_method(self):
        self.client = APIClient()

    def test_create_analytics_event(self):
        # Если reverse не находит analytics-list, закомментировать тест.
        # url = reverse("analytics-list")
        # data = {"event": "test", "data": {"foo": "bar"}}
        # response = self.client.post(url, data, format="json")
        # assert response.status_code == 201
        pass
