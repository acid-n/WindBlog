import factory
import pytest
from blog.models import Post, Tag
from blog.serializers import PostSerializer, TagSerializer


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
def test_post_serializer_valid():
    tag = TagFactory()
    post = PostFactory()
    post.tags.add(tag)
    serializer = PostSerializer(post)
    data = serializer.data
    assert data["id"] == post.id
    assert data["title"] == post.title
    assert data["tags"][0]["id"] == tag.id


@pytest.mark.django_db
def test_tag_serializer_valid():
    tag = TagFactory()
    serializer = TagSerializer(tag)
    data = serializer.data
    assert data["id"] == tag.id
    assert data["name"] == tag.name
