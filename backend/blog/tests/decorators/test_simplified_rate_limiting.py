"""
Упрощенные тесты для декораторов ограничения частоты запросов (rate limiting).

Фокусируется на проверке функциональности без зависимости от внешней библиотеки.
"""

import pytest
from unittest.mock import patch, MagicMock
from django.test import RequestFactory
from django.http import HttpResponse
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet

# Исправляем импорт декораторов
from blog import decorators

# Используем декораторы напрямую
api_rate_limit = decorators.api_rate_limit
api_view_rate_limit = decorators.api_view_rate_limit
api_viewset_rate_limit = decorators.api_viewset_rate_limit


@pytest.mark.django_db
class TestRateLimitDecoratorsSimplified:
    """Упрощенные тесты для декораторов ограничения частоты запросов."""

    def setup_method(self):
        """Подготовка тестового окружения."""
        self.factory = RequestFactory()

    def test_api_rate_limit_decorator_wrapping(self):
        """Проверяет, что декоратор api_rate_limit правильно оборачивает функцию."""
        
        # Простая тестовая функция
        def test_view(request):
            return HttpResponse("Success")
        
        # Применяем декоратор
        decorated_view = api_rate_limit(group='test', key='ip', rate='5/m')(test_view)
        
        # Проверяем, что функция была обернута (сохранила оригинальное имя)
        assert decorated_view.__name__ == test_view.__name__
        
        # Пробуем вызвать функцию с патчем ratelimit
        with patch('blog.decorators.ratelimit', lambda **kwargs: lambda f: f):
            request = self.factory.get('/')
            response = decorated_view(request)
            assert response.status_code == 200
            assert response.content == b"Success"

    def test_api_view_rate_limit_decorator_method_decorator(self):
        """Проверяет, что api_view_rate_limit корректно применяет method_decorator."""
        
        # Создаем тестовый класс с декорированным методом
        class TestAPIView(APIView):
            @api_view_rate_limit(group='test_api_view', key='ip', rate='5/m')
            def get(self, request):
                return Response({"message": "Success"})
        
        # Проверяем, что метод сохранил своё имя
        assert TestAPIView.get.__name__ == 'get'
        
        # Проверяем применение декоратора
        with patch('blog.decorators.ratelimit', lambda **kwargs: lambda f: f):
            view_instance = TestAPIView()
            request = self.factory.get('/')
            view_instance.request = request
            response = view_instance.get(request)
            assert response.status_code == 200
            assert response.data["message"] == "Success"

    def test_api_viewset_rate_limit_decorator_class_decorator(self):
        """Проверяет, что api_viewset_rate_limit корректно применяет декоратор к классу."""
        
        # Создаем тестовый класс с декоратором
        @api_viewset_rate_limit(group='test_viewset', key='ip', rate='5/m')
        class TestViewSet(ViewSet):
            def list(self, request):
                return Response({"message": "List"})
            
            def retrieve(self, request, pk=None):
                return Response({"message": "Detail", "id": pk})
        
        # Проверяем, что декоратор был применен к методам класса
        assert hasattr(TestViewSet.list, '_ratelimit_config')
        assert hasattr(TestViewSet.retrieve, '_ratelimit_config')
        
        # Проверяем, что методы сохранили свои имена
        assert TestViewSet.list.__name__ == 'list'
        assert TestViewSet.retrieve.__name__ == 'retrieve'
