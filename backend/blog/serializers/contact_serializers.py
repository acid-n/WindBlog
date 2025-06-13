"""
Сериализаторы для работы с сообщениями обратной связи.

Этот модуль содержит сериализаторы для модели ContactMessage.
"""

from rest_framework import serializers

from ..models import ContactMessage


class ContactMessageSerializer(serializers.ModelSerializer):
    """
    Сериализатор для сообщений обратной связи.
    
    Предоставляет поля для создания и отображения сообщений,
    отправленных через форму обратной связи.
    """

    class Meta:
        model = ContactMessage
        fields = [
            "id", 
            "name", 
            "email", 
            "message", 
            "created_at", 
            "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
