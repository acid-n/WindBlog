import factory
import pytest
from blog.models import Post, Tag
from django.urls import reverse
from rest_framework.test import APIClient


class TagFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Tag

    name = factory.Sequence(lambda n: f"tag{n}")
    slug = factory.Sequence(lambda n: f"tag{n}")


class PostFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Post

    title = factory.Sequence(lambda n: f"Post {n}")
    slug = factory.Sequence(lambda n: f"post-{n}")
    description = "desc"
    body = {}
    first_published_at = "2024-01-01T00:00:00Z"
    is_published = True


@pytest.mark.django_db
class TestPostAPI:
    def setup_method(self):
        self.client = APIClient()
        self.tag = TagFactory()
        self.post = PostFactory()
        self.post.tags.add(self.tag)

    def test_post_list(self):
        url = reverse("post-list")
        response = self.client.get(url)
        assert response.status_code == 200
        assert isinstance(response.data, dict)
        assert "results" in response.data
        assert isinstance(response.data["results"], list)
        assert any(p["id"] == self.post.id for p in response.data["results"])

    def test_post_detail(self):
        url = reverse("post-detail", args=[self.post.slug])
        response = self.client.get(url)
        assert response.status_code == 200
        assert response.data["id"] == self.post.id
