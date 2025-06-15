import factory
import pytest
from blog.models import Post, ShortLink, Tag
from django.urls import reverse
from django.utils import timezone
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
    first_published_at = factory.LazyFunction(timezone.now)
    is_published = True


@pytest.mark.django_db
def test_shortlink_redirect_view():
    post = PostFactory()
    shortlink = ShortLink.objects.create(post=post, code="abc12345")
    client = APIClient()
    url = reverse("blog_api:shortlink-redirect", args=[shortlink.code])
    response = client.get(url)
    assert response.status_code == 302
    assert response["Location"].endswith(post.get_absolute_url())


@pytest.mark.django_db
def test_shortlink_redirect_not_found():
    client = APIClient()
    url = reverse("blog_api:shortlink-redirect", args=["missing"])
    response = client.get(url)
    assert response.status_code == 404


@pytest.mark.django_db
def test_post_get_by_id_view():
    post = PostFactory()
    client = APIClient()
    url = reverse("blog_api:post-get-by-id", args=[post.id])
    response = client.get(url)
    assert response.status_code == 200
    assert response.data["id"] == post.id


@pytest.mark.django_db
def test_post_get_by_id_not_found():
    client = APIClient()
    url = reverse("blog_api:post-get-by-id", args=[9999])
    response = client.get(url)
    assert response.status_code == 404


@pytest.mark.django_db
def test_post_get_by_id_invalid():
    client = APIClient()
    url = reverse("blog_api:post-get-by-id", args=["abc"])
    response = client.get(url)
    assert response.status_code == 400
