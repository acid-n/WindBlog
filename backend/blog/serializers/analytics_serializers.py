"""
Сериализаторы для работы с аналитикой блога.

Этот модуль содержит сериализаторы для модели AnalyticsEvent.
"""

from rest_framework import serializers

from ..models import AnalyticsEvent


class AnalyticsEventSerializer(serializers.ModelSerializer):
    """
    Сериализатор для событий аналитики.
    
    Предоставляет поля для хранения и обработки аналитических событий,
    таких как просмотры страниц, действия пользователей и т.д.
    """

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
