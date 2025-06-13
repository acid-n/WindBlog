"""
Тесты для представлений AnalyticsEventViewSet.

Этот модуль содержит тесты для проверки функциональности API аналитики блога.
"""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from blog.models import AnalyticsEvent


@pytest.mark.django_db
class TestAnalyticsEventViewSet:
    """Тесты для API аналитики блога."""

    def setup_method(self):
        """Подготовка тестовых данных."""
        self.client = APIClient()
        
        # URL для API аналитики
        self.create_url = reverse("analytics-list")
        
        # Данные для создания события аналитики
        self.valid_event_data = {
            "path": "/blog/test-post",
            "ip": "192.168.1.1",
            "user_agent": "Mozilla/5.0 Test Browser",
            "referrer": "https://google.com"
        }
        
        # Данные с отсутствующим обязательным полем path
        self.invalid_event_data = {
            "ip": "192.168.1.1",
            "user_agent": "Mozilla/5.0 Test Browser"
        }
        
        # Данные только с обязательным полем path
        self.minimal_event_data = {
            "path": "/minimal-path"
        }

    def test_create_event_success(self):
        """Тест успешного создания события аналитики."""
        response = self.client.post(self.create_url, self.valid_event_data, format="json")
        
        # Проверяем успешный ответ
        assert response.status_code == status.HTTP_201_CREATED
        
        # Проверяем, что событие создано с правильными данными
        assert response.data["path"] == self.valid_event_data["path"]
        assert response.data["ip"] == self.valid_event_data["ip"]
        assert response.data["user_agent"] == self.valid_event_data["user_agent"]
        assert response.data["referrer"] == self.valid_event_data["referrer"]
        
        # Проверяем, что событие сохранено в БД
        assert AnalyticsEvent.objects.filter(path=self.valid_event_data["path"]).exists()
    
    def test_create_event_missing_required_field(self):
        """Тест создания события с отсутствующим обязательным полем."""
        response = self.client.post(self.create_url, self.invalid_event_data, format="json")
        
        # Проверяем ответ с ошибкой валидации
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Проверяем, что ошибка связана с отсутствием path
        assert "path" in response.data
    
    def test_create_event_minimal_data(self):
        """Тест создания события только с обязательными полями."""
        response = self.client.post(self.create_url, self.minimal_event_data, format="json")
        
        # Проверяем успешный ответ
        assert response.status_code == status.HTTP_201_CREATED
        
        # Проверяем, что событие создано с минимальными данными
        assert response.data["path"] == self.minimal_event_data["path"]
        
        # Проверяем, что необязательные поля имеют значения по умолчанию
        assert response.data["ip"] is None or response.data["ip"] == ""
        assert response.data["user_agent"] is None or response.data["user_agent"] == ""
        assert response.data["referrer"] is None or response.data["referrer"] == ""
        
        # Проверяем, что событие сохранено в БД
        assert AnalyticsEvent.objects.filter(path=self.minimal_event_data["path"]).exists()
    
    def test_list_not_allowed(self):
        """Тест запрета на получение списка событий."""
        response = self.client.get(self.create_url)
        
        # Проверяем, что метод не разрешен (AnalyticsEventViewSet - только CreateModelMixin)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
