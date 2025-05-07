from rest_framework import serializers
import logging
from django.db.models import Avg

from .models import AnalyticsEvent, ContactMessage, Post, Rating, ShortLink, Tag

logger = logging.getLogger(__name__)


class TagSerializer(serializers.ModelSerializer):
    """Сериализатор для тегов."""

    posts_count = serializers.IntegerField(source="posts.count", read_only=True)

    class Meta:
        model = Tag
        fields = ["id", "name", "slug", "posts_count"]


class ShortLinkSerializer(serializers.ModelSerializer):
    """Сериализатор для коротких ссылок."""

    class Meta:
        model = ShortLink
        fields = ["id", "post", "code"]


class PostSerializer(serializers.ModelSerializer):
    """Сериализатор для постов блога."""

    tags = TagSerializer(many=True, read_only=True)
    shortlink = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()

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
            "shortlink",
            "average_rating",
            "sitemap_include",
            "sitemap_priority",
            "sitemap_changefreq",
        ]
    
    def get_shortlink(self, obj: Post):
        """Получить данные короткой ссылки поста, если она существует."""
        try:
            short_link_instance = ShortLink.objects.filter(post=obj).first()

            if short_link_instance and short_link_instance.code:
                request = self.context.get('request')
                host = request.get_host() if request else None
                protocol = 'https' if request and request.is_secure() else 'http'
                base_url = f"{protocol}://{host}" if request and host else ""
                
                relative_url = f"/s/{short_link_instance.code}/"
                
                return {
                    "code": short_link_instance.code,
                    "url": relative_url,
                    "full_url": f"{base_url}{relative_url}" if base_url else None
                }
            return None
        except Exception as e:
            logger.error(f"Ошибка при получении короткой ссылки для поста {obj.id}: {str(e)}")
            return None
    
    def get_average_rating(self, obj: Post):
        """Получить среднюю оценку поста."""
        avg_data = obj.ratings.aggregate(avg_score=Avg('score'))
        avg_score = avg_data.get('avg_score')
        return round(avg_score, 1) if avg_score is not None else None


class RatingSerializer(serializers.ModelSerializer):
    """Сериализатор для рейтинга поста."""

    class Meta:
        model = Rating
        fields = ["id", "post", "score", "user_hash", "created_at"]


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


# Сериализаторы для API Архива
class YearArchiveSerializer(serializers.Serializer):
    """Сериализатор для годовой сводки архива."""
    year = serializers.IntegerField()
    posts_count = serializers.IntegerField()


class MonthArchiveSerializer(serializers.Serializer):
    """Сериализатор для месячной сводки архива."""
    month = serializers.IntegerField()
    posts_count = serializers.IntegerField()


class DayArchiveSerializer(serializers.Serializer):
    """Сериализатор для дневной сводки архива."""
    day = serializers.IntegerField()
    posts_count = serializers.IntegerField()
