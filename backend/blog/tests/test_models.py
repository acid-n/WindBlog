import factory
import pytest
from django.core.exceptions import ValidationError
from blog.models import (
    Tag,
    Post,
    ShortLink,
    Rating,
    AnalyticsEvent,
    ContactMessage,
)


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
    first_published_at = factory.Faker('date_time')
    is_published = True


@pytest.mark.django_db
def test_create_shortlink_signal():
    post = PostFactory()
    assert ShortLink.objects.filter(post=post).exists()


@pytest.mark.django_db
def test_rating_validation():
    post = PostFactory()
    rating = Rating(post=post, score=6, user_hash='u')
    with pytest.raises(ValidationError):
        rating.full_clean()


@pytest.mark.django_db
def test_contact_message_creation():
    msg = ContactMessage.objects.create(name='n', email='e@test.com', message='hi')
    assert msg.pk is not None


@pytest.mark.django_db
def test_analytics_event_creation():
    event = AnalyticsEvent.objects.create(path='/p', ip='127.0.0.1', user_agent='UA')
    assert event.pk is not None
