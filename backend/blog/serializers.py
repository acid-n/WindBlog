from rest_framework import serializers

from .models import AnalyticsEvent, ContactMessage, Post, Rating, ShortLink, Tag


class TagSerializer(serializers.ModelSerializer):
    """Сериализатор для тегов."""

    posts_count = serializers.IntegerField(source="posts.count", read_only=True)

    class Meta:
        model = Tag
        fields = ["id", "name", "slug", "posts_count"]


class PostSerializer(serializers.ModelSerializer):
    """Сериализатор для постов блога."""

    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "body",
            "image",
            "tags",
            "first_published_at",
            "is_published",
            "created_at",
            "updated_at",
        ]


class RatingSerializer(serializers.ModelSerializer):
    """Сериализатор для рейтинга поста."""

    class Meta:
        model = Rating
        fields = ["id", "post", "score", "user_hash", "created_at"]


class ShortLinkSerializer(serializers.ModelSerializer):
    """Сериализатор для коротких ссылок."""

    class Meta:
        model = ShortLink
        fields = ["id", "post", "code"]


class AnalyticsEventSerializer(serializers.ModelSerializer):
    """Сериализатор для событий аналитики."""

    class Meta:
        model = AnalyticsEvent
        fields = [
            "id",
            "path",
            "ip",
            "user_agent",
            "referrer",
            "created_at",
            "updated_at",
        ]


class ContactMessageSerializer(serializers.ModelSerializer):
    """Сериализатор для сообщений обратной связи."""

    class Meta:
        model = ContactMessage
        fields = ["id", "name", "email", "message", "created_at", "updated_at"]
