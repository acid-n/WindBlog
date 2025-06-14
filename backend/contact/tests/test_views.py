import pytest
from django.urls import reverse
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_create_contact():
    client = APIClient()
    url = reverse("blog_api:contact-list")
    data = {"name": "u", "email": "u@test.com", "message": "hi"}
    response = client.post(url, data, format="json")
    assert response.status_code == 201
