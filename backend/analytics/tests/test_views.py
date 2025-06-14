import pytest
from django.urls import reverse
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_create_event():
    client = APIClient()
    url = reverse("blog_api:analytics-list")
    data = {"path": "/t", "ip": "127.0.0.1", "user_agent": "UA"}
    response = client.post(url, data, format="json")
    assert response.status_code == 201
