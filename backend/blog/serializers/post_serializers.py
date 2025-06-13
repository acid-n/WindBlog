"""
Сериализаторы для работы с постами блога.

Этот модуль содержит сериализаторы для модели Post и связанных с ней моделей.
"""

import logging
from django.db.models import Avg
from rest_framework import serializers

from ..models import Post, Rating
from .fields import CustomImageField
from .tag_serializers import TagSerializer

# Получаем логгер
logger = logging.getLogger(__name__)


class RatingSerializer(serializers.ModelSerializer):
    """Сериализатор для рейтинга поста."""

    class Meta:
        model = Rating
        fields = ["id", "post", "score", "user_hash", "created_at"]


class RatingCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания/обновления рейтинга поста."""
    
    class Meta:
        model = Rating
        fields = ["post", "score", "user_hash"]
        
    def validate_score(self, value):
        """Проверка, что оценка находится в диапазоне 1-5."""
        if value < 1 or value > 5:
            raise serializers.ValidationError("Оценка должна быть от 1 до 5.")
        return value


class PostSerializer(serializers.ModelSerializer):
    """Сериализатор для постов блога."""

    tags_details = TagSerializer(source="tags", many=True, read_only=True)
    tags = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Post.tags.rel.model.objects.all(), required=False
    )
    
    shortlink = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    
    # Используем наше кастомное поле
    image = CustomImageField(
        required=False, allow_null=True, use_url=True, max_length=None
    )

    # Ограничение на максимум 5 тегов
    def validate_tags(self, value):
        """
        Валидация тегов - не более 5 на пост.
        
        Args:
            value: Список тегов
            
        Returns:
            list: Проверенный список тегов
            
        Raises:
            ValidationError: Если тегов больше 5
        """
        if len(value) > 5:
            raise serializers.ValidationError("Максимум 5 тегов на пост.")
        return value

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
            "tags_details",
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
        """
        Получить данные короткой ссылки поста, если она существует.
        
        Args:
            obj: Объект поста
            
        Returns:
            dict или None: Информация о короткой ссылке
        """
        try:
            short_link_instance = obj.shortlinks.first()

            if short_link_instance and short_link_instance.code:
                request = self.context.get("request")
                host = request.get_host() if request else None
                protocol = "https" if request and request.is_secure() else "http"
                base_url = str(protocol) + "://" + (str(host) if host else "")

                relative_url = "/s/" + str(short_link_instance.code) + "/"

                return {
                    "code": short_link_instance.code,
                    "url": relative_url,
                    "full_url": (base_url + relative_url) if base_url else None,
                }
            return None
        except Exception as e:
            logger.error(
                f"Ошибка при получении короткой ссылки для поста {obj.id}: {str(e)}"
            )
            return None

    def get_average_rating(self, obj: Post):
        """
        Получить среднюю оценку поста.
        
        Args:
            obj: Объект поста
            
        Returns:
            float или None: Средняя оценка поста, округленная до 1 знака
        """
        avg_data = obj.ratings.aggregate(avg_score=Avg("score"))
        avg_score = avg_data.get("avg_score")
        return round(avg_score, 1) if avg_score is not None else None
