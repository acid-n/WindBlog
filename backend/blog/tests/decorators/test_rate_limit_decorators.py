"""
Тесты для декораторов ограничения частоты запросов.

Проверяет работу реальных декораторов api_rate_limit, api_view_rate_limit и api_viewset_rate_limit.
"""

import pytest
from django.test import RequestFactory, override_settings
from django.http import HttpResponse
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet
from rest_framework import status

# Исправляем путь импорта, так как файл декораторов находится в корне проекта
from blog import decorators


# Используем фиксированные настройки для тестирования
RATELIMIT_TEST_SETTINGS = {
    'RATELIMIT_ENABLE': True,
    'RATELIMIT_USE_CACHE': 'default',
    'RATELIMIT_VIEW_ATTR': '_ratelimit_config',
    'RATELIMIT_RATE_GROUPS': {
        'test': '1/d',  # 1 запрос в день - для тестирования превышения лимита
        'api': '5/m',  # 5 запросов в минуту - настройка по умолчанию
    }
}


@pytest.mark.django_db
@override_settings(**RATELIMIT_TEST_SETTINGS)
class TestRateLimitDecorators:
    """Тесты для декораторов ограничения частоты запросов."""

    def setup_method(self):
        """Подготовка тестового окружения."""
        self.factory = RequestFactory()
        
        # Задаем фиксированный IP для тестов
        self.test_ip = '127.0.0.1'
        
    def test_api_rate_limit_decorator_adds_config(self):
        """Проверяет, что декоратор api_rate_limit правильно добавляет конфигурацию."""
        
        @decorators.api_rate_limit(group='test_group', key='ip', rate='10/m')
        def test_view(request):
            return HttpResponse("Success")
        
        # Проверяем, что декоратор создал обернутую функцию
        assert hasattr(test_view, '__wrapped__')
        
        # Проверяем, что функция работает
        request = self.factory.get('/')
        request.META['REMOTE_ADDR'] = self.test_ip
        response = test_view(request)
        assert response.status_code == 200
        assert response.content == b"Success"
    
    def test_api_rate_limit_decorator_handles_ratelimit_exception(self):
        """Проверяет, что декоратор api_rate_limit корректно обрабатывает превышение лимита."""
        
        # Используем группу 'test' с очень ограниченным лимитом '1/d'
        @decorators.api_rate_limit(group='test', key='ip')
        def test_view(request):
            return HttpResponse("Success")
        
        # Первый запрос должен пройти
        request = self.factory.get('/')
        request.META['REMOTE_ADDR'] = self.test_ip
        response1 = test_view(request)
        assert response1.status_code == 200
        
        # Второй запрос должен быть ограничен
        response2 = test_view(request)
        assert response2.status_code == status.HTTP_429_TOO_MANY_REQUESTS
        assert "Превышен лимит запросов" in str(response2.content)
    
    def test_api_view_rate_limit_decorator(self):
        """Проверяет работу декоратора api_view_rate_limit для методов класса APIView."""
        
        class TestAPIView(APIView):
            @decorators.api_view_rate_limit(group='api')
            def get(self, request):
                return Response({"message": "Success"})
        
        # Проверяем, что метод работает
        view_instance = TestAPIView()
        request = self.factory.get('/')
        request.META['REMOTE_ADDR'] = self.test_ip
        view_instance.request = request
        
        # Тестируем успешный ответ
        response = view_instance.get(request)
        assert response.status_code == 200
        assert response.data["message"] == "Success"
    
    def test_api_viewset_rate_limit_decorator(self):
        """Проверяет работу декоратора api_viewset_rate_limit для ViewSet."""
        
        @decorators.api_viewset_rate_limit(group='api')
        class TestViewSet(ViewSet):
            def list(self, request):
                return Response({"message": "List"})
            
            def retrieve(self, request, pk=None):
                return Response({"message": "Detail", "id": pk})
        
        # Проверяем, что методы работают
        viewset = TestViewSet()
        request = self.factory.get('/')
        request.META['REMOTE_ADDR'] = self.test_ip
        viewset.request = request
        
        # Тестируем метод list
        list_response = viewset.list(request)
        assert list_response.status_code == 200
        assert list_response.data["message"] == "List"
        
        # Тестируем метод retrieve
        retrieve_response = viewset.retrieve(request, pk=1)
        assert retrieve_response.status_code == 200
        assert retrieve_response.data["message"] == "Detail"
        assert retrieve_response.data["id"] == 1
    
    def test_api_viewset_rate_limit_handles_ratelimit_exception(self):
        """Проверяет, что ViewSet с ограничением частоты запросов корректно обрабатывает превышение лимита."""
        
        @decorators.api_viewset_rate_limit(group='test')  # Используем группу 'test' с ограниченным лимитом
        class LimitedViewSet(ViewSet):
            def list(self, request):
                return Response({"message": "List"})
        
        viewset = LimitedViewSet()
        request = self.factory.get('/')
        request.META['REMOTE_ADDR'] = self.test_ip
        viewset.request = request
        
        # Первый запрос должен пройти
        response1 = viewset.list(request)
        assert response1.status_code == 200
        
        # Второй запрос должен быть ограничен
        response2 = viewset.list(request)
        assert response2.status_code == status.HTTP_429_TOO_MANY_REQUESTS
        assert "Превышен лимит запросов" in str(response2.data)
