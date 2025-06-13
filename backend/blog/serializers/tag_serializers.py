"""
Сериализаторы для работы с тегами блога.

Этот модуль содержит сериализаторы для модели Tag.
"""

from rest_framework import serializers

from ..models import Tag


class TagSerializer(serializers.ModelSerializer):
    """
    Сериализатор для тегов.
    
    Включает поле posts_count для отображения количества 
    связанных с тегом опубликованных постов.
    """
    
    posts_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Tag
        fields = ["id", "name", "slug", "posts_count"]
