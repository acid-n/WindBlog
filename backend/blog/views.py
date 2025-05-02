from rest_framework import mixins, permissions, viewsets

from .models import AnalyticsEvent, ContactMessage, Post, Rating, ShortLink, Tag
from .serializers import (
    AnalyticsEventSerializer,
    ContactMessageSerializer,
    PostSerializer,
    RatingSerializer,
    ShortLinkSerializer,
    TagSerializer,
)


class PostViewSet(viewsets.ModelViewSet):
    """API для постов блога."""

    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]


class TagViewSet(viewsets.ModelViewSet):
    """API для тегов."""

    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.AllowAny]


class RatingViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """API для создания рейтинга поста."""

    queryset = Rating.objects.all()
    serializer_class = RatingSerializer
    permission_classes = [permissions.AllowAny]


class ShortLinkViewSet(viewsets.ReadOnlyModelViewSet):
    """API для коротких ссылок."""

    queryset = ShortLink.objects.all()
    serializer_class = ShortLinkSerializer
    permission_classes = [permissions.AllowAny]


class AnalyticsEventViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """API для событий аналитики (только создание)."""

    queryset = AnalyticsEvent.objects.all()
    serializer_class = AnalyticsEventSerializer
    permission_classes = [permissions.AllowAny]


class ContactMessageViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """API для сообщений обратной связи (только создание)."""

    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]
