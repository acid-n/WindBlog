"""
Тесты для представлений ContactMessageViewSet.

Этот модуль содержит тесты для проверки функциональности API форм обратной связи.
"""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from blog.models import ContactMessage


@pytest.mark.django_db
class TestContactMessageViewSet:
    """Тесты для API сообщений обратной связи."""

    def setup_method(self):
        """Подготовка тестовых данных."""
        self.client = APIClient()
        
        # URL для API сообщений обратной связи
        self.create_url = reverse("contact-list")
        
        # Валидные данные для создания сообщения
        self.valid_message_data = {
            "name": "Тестовый Пользователь",
            "email": "test@example.com",
            "subject": "Тестовая тема",
            "message": "Это тестовое сообщение для проверки API обратной связи.",
            "phone": "+7 (999) 123-45-67"
        }
        
        # Данные с отсутствующим обязательным полем
        self.invalid_message_data = {
            "name": "Тестовый Пользователь",
            # Отсутствует email (обязательное поле)
            "subject": "Тестовая тема",
            "message": "Это тестовое сообщение с неполными данными."
        }
        
        # Данные с пустым сообщением
        self.empty_message_data = {
            "name": "Тестовый Пользователь",
            "email": "test@example.com",
            "subject": "Тестовая тема",
            "message": "",  # Пустое сообщение
            "phone": "+7 (999) 123-45-67"
        }

    def test_create_message_success(self):
        """Тест успешного создания сообщения обратной связи."""
        response = self.client.post(self.create_url, self.valid_message_data, format="json")
        
        # Проверяем успешный ответ
        assert response.status_code == status.HTTP_201_CREATED
        
        # Проверяем, что сообщение создано с правильными данными
        assert response.data["name"] == self.valid_message_data["name"]
        assert response.data["email"] == self.valid_message_data["email"]
        assert response.data["subject"] == self.valid_message_data["subject"]
        assert response.data["message"] == self.valid_message_data["message"]
        assert response.data["phone"] == self.valid_message_data["phone"]
        
        # Проверяем, что сообщение сохранено в БД
        assert ContactMessage.objects.filter(email=self.valid_message_data["email"]).exists()
        
        # Проверяем, что по умолчанию сообщение не отмечено как обработанное
        message = ContactMessage.objects.get(email=self.valid_message_data["email"])
        assert not message.is_processed
    
    def test_create_message_missing_required_field(self):
        """Тест создания сообщения с отсутствующим обязательным полем."""
        response = self.client.post(self.create_url, self.invalid_message_data, format="json")
        
        # Проверяем ответ с ошибкой валидации
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Проверяем, что ошибка связана с отсутствием email
        assert "email" in response.data.get("error", "").lower()
    
    def test_create_message_empty_message(self):
        """Тест создания сообщения с пустым текстом."""
        response = self.client.post(self.create_url, self.empty_message_data, format="json")
        
        # Проверяем ответ с ошибкой валидации
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Проверяем, что ошибка связана с пустым сообщением
        assert "message" in response.data.get("error", "").lower()
    
    def test_create_message_with_ip_address(self):
        """Тест создания сообщения с IP-адресом из заголовка X-Forwarded-For."""
        # Добавляем заголовок X-Forwarded-For
        self.client.defaults["HTTP_X_FORWARDED_FOR"] = "192.168.1.1"
        
        response = self.client.post(self.create_url, self.valid_message_data, format="json")
        
        # Проверяем успешный ответ
        assert response.status_code == status.HTTP_201_CREATED
        
        # Проверяем, что IP-адрес был сохранен
        message = ContactMessage.objects.get(email=self.valid_message_data["email"])
        assert message.ip_address == "192.168.1.1"
        
    def test_get_method_not_allowed(self):
        """Тест запрета на получение списка сообщений."""
        response = self.client.get(self.create_url)
        
        # Проверяем, что метод не разрешен (ContactMessageViewSet - только CreateModelMixin)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
