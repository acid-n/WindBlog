import pytest
from django.db import connection
from django.urls import reverse
from rest_framework.test import APIClient

from .test_models import PostFactory


@pytest.mark.django_db
def test_post_list_pagination():
    PostFactory.create_batch(15)
    client = APIClient()
    url = reverse("blog_api:post-list")
    resp = client.get(url)
    assert resp.status_code == 200
    assert len(resp.data["results"]) == 10


@pytest.mark.django_db
def test_post_search_filter():
    if connection.vendor != "postgresql":
        pytest.skip("search not supported")
    PostFactory(title="Unique", slug="unique")
    PostFactory.create_batch(3)
    client = APIClient()
    url = reverse("blog_api:post-list")
    resp = client.get(url, {"search": "Unique"})
    assert resp.status_code == 200
    assert len(resp.data["results"]) == 1
