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
class TestRatingAPI:
    def setup_method(self):
        self.client = APIClient()
        self.tag = TagFactory()
        self.post = PostFactory()
        self.post.tags.add(self.tag)

    def test_create_rating(self):
        url = reverse("rating-list")
        data = {"post": self.post.id, "score": 5, "user_hash": "abc123"}
        response = self.client.post(url, data)
        assert response.status_code == 201
        assert response.data["score"] == 5
        assert response.data["user_hash"] == "abc123"
