from rest_framework import mixins, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

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
    lookup_field = "slug"


class TagViewSet(viewsets.ModelViewSet):
    """API для тегов."""

    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"

    @action(detail=True, methods=["get"], url_path="posts")
    def posts(self, request, slug=None):
        """Получить все опубликованные посты по тегу (slug)."""
        tag = self.get_object()
        posts = tag.posts.filter(is_published=True).order_by("-first_published_at")
        serializer = PostSerializer(posts, many=True, context={"request": request})
        return Response(serializer.data)


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
