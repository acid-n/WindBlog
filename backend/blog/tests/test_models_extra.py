import pytest
import factory

from blog.models import Post, ShortLink, Tag


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
    body = {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "hello"}]}]}


@pytest.mark.django_db
def test_extract_text_and_save_fields():
    post = PostFactory(is_published=True)
    post.save()
    assert post.body_text_for_search == "hello"
    assert post.first_published_at is not None


@pytest.mark.django_db
def test_shortlink_unique_code_generation():
    post = PostFactory()
    s1 = ShortLink.objects.create(post=post)
    s2 = ShortLink.objects.create(post=post)
    assert len(s1.code) == 8
    assert len(s2.code) == 8
    assert s1.code != s2.code
