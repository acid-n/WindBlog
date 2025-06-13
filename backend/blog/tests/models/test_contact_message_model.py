"""
Тесты для модели ContactMessage.

Проверяют корректность работы модели сообщений обратной связи.
"""

import pytest
from django.utils import timezone

from blog.models import ContactMessage


@pytest.mark.django_db
class TestContactMessageModel:
    """Тесты для модели сообщений обратной связи."""

    def test_create_contact_message(self):
        """Тест создания сообщения обратной связи с основными полями."""
        message = ContactMessage.objects.create(
            name="Иван Иванов",
            email="ivan@example.com",
            message="Тестовое сообщение обратной связи",
            subject="Тестовая тема"
        )
        
        assert message.id is not None
        assert message.name == "Иван Иванов"
        assert message.email == "ivan@example.com"
        assert message.message == "Тестовое сообщение обратной связи"
        assert message.subject == "Тестовая тема"
        assert message.is_processed is False  # по умолчанию
        
        # Проверка автоматически заполняемых полей
        assert message.created_at is not None
        assert message.updated_at is not None
        
    def test_create_message_without_subject(self):
        """Тест создания сообщения без указания темы."""
        message = ContactMessage.objects.create(
            name="Петр Петров",
            email="petr@example.com",
            message="Сообщение без темы"
        )
        
        assert message.id is not None
        assert message.subject == ""  # пустая строка по умолчанию
        
    def test_mark_as_processed(self):
        """Тест отметки сообщения как обработанного."""
        message = ContactMessage.objects.create(
            name="Сергей Сергеев",
            email="sergey@example.com",
            message="Сообщение для обработки"
        )
        
        # Изначально сообщение не обработано
        assert message.is_processed is False
        
        # Отмечаем как обработанное
        message.is_processed = True
        message.save()
        
        # Перезагружаем объект из БД
        message.refresh_from_db()
        
        # Проверяем, что статус обработки изменился
        assert message.is_processed is True
        
    def test_contact_message_timestamp(self):
        """Тест временных меток создания и обновления."""
        # Запоминаем текущее время до создания сообщения
        before_create = timezone.now()
        
        message = ContactMessage.objects.create(
            name="Анна Анна",
            email="anna@example.com",
            message="Сообщение для проверки временных меток"
        )
        
        # Проверяем, что временная метка создания установлена корректно
        assert message.created_at >= before_create
        assert message.updated_at >= before_create
        
        # Запоминаем время перед обновлением
        before_update = timezone.now()
        
        # Обновляем сообщение
        message.subject = "Обновленная тема"
        message.save()
        
        # Перезагружаем объект из БД
        message.refresh_from_db()
        
        # Проверяем, что временная метка обновления изменилась, а создания - нет
        assert message.updated_at >= before_update
        assert message.created_at < before_update  # метка создания не должна меняться
