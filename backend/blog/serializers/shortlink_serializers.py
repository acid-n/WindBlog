"""
Сериализаторы для работы с короткими ссылками блога.

Этот модуль содержит сериализаторы для модели ShortLink.
"""

from rest_framework import serializers

from ..models import ShortLink


class ShortLinkSerializer(serializers.ModelSerializer):
    """
    Сериализатор для коротких ссылок.
    
    Предоставляет базовые поля модели ShortLink.
    """

    class Meta:
        model = ShortLink
        fields = ["id", "post", "code"]
