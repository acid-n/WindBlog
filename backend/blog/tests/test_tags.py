import factory
import pytest
from blog.models import Tag
from django.urls import reverse
from rest_framework.test import APIClient


class TagFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Tag

    name = factory.Sequence(lambda n: f"tag{n}")
    slug = factory.Sequence(lambda n: f"tag{n}")


@pytest.mark.django_db
class TestTagAPI:
    def setup_method(self):
        self.client = APIClient()
        self.tag = TagFactory()

    def test_tag_list(self):
        url = reverse("tag-list")
        response = self.client.get(url)
        assert response.status_code == 200
        assert any(t["id"] == self.tag.id for t in response.data)

    def test_tag_detail(self):
        url = reverse("tag-detail", args=[self.tag.id])
        response = self.client.get(url)
        assert response.status_code == 200
        assert response.data["id"] == self.tag.id
