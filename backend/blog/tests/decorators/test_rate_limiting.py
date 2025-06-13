"""
Тесты для декораторов ограничения частоты запросов (rate limiting).

Модуль проверяет корректную работу декораторов:
- api_rate_limit
- api_view_rate_limit
- api_viewset_rate_limit
"""

import pytest
from unittest.mock import patch, MagicMock
from django.test import RequestFactory, override_settings
from django.http import HttpResponse
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet
from rest_framework.test import APIClient

# Используем моки вместо реальных импортов
class MockRatelimited(Exception):
    """Мок-класс для имитации исключения Ratelimited."""
    pass

# Патчим импорты в модуле декораторов
import blog.decorators as decorators

# Заменяем реальные импорты моками
decoratorModule = decorators
decoratorModule.ratelimit = MagicMock()
decoratorModule.Ratelimited = MockRatelimited

# Используем декораторы из модуля
api_rate_limit = decorators.api_rate_limit
api_view_rate_limit = decorators.api_view_rate_limit
api_viewset_rate_limit = decorators.api_viewset_rate_limit


@pytest.mark.django_db
class TestRateLimitDecorators:
    """Тесты для декораторов ограничения частоты запросов."""

    def setup_method(self):
        """Подготовка тестового окружения."""
        self.factory = RequestFactory()
        self.client = APIClient()

    @override_settings(RATELIMIT_ENABLE=True)
    def test_api_rate_limit_decorator_success(self):
        """Проверяет успешный запрос с декоратором api_rate_limit."""
        
        @api_rate_limit(group='test', key='ip', rate='5/m')
        def test_view(request):
            return HttpResponse("Success")
        
        request = self.factory.get('/')
        request.META['REMOTE_ADDR'] = '127.0.0.1'
        
        response = test_view(request)
        assert response.status_code == 200
        assert response.content == b"Success"

    @override_settings(RATELIMIT_ENABLE=True)
    @patch('ratelimit.decorators.is_ratelimited', return_value=True)
    def test_api_rate_limit_decorator_exceeded(self, mock_is_ratelimited):
        """Проверяет, что декоратор api_rate_limit обрабатывает превышение лимита."""
        
        @api_rate_limit(group='test', key='ip', rate='5/m')
        def test_view(request):
            # Вызовет исключение MockRatelimited благодаря моку
            raise MockRatelimited()
        
        request = self.factory.get('/')
        request.META['REMOTE_ADDR'] = '127.0.0.1'
        
        response = test_view(request)
        assert response.status_code == 429
        assert "Превышен лимит запросов" in str(response.content)

    @override_settings(RATELIMIT_ENABLE=True)
    def test_api_view_rate_limit_decorator(self):
        """Проверяет декоратор api_view_rate_limit для методов класса APIView."""
        
        class TestAPIView(APIView):
            @api_view_rate_limit(group='test_api_view', key='ip', rate='5/m')
            def get(self, request):
                return Response({"message": "Success"})
        
        view = TestAPIView.as_view()
        request = self.factory.get('/')
        request.META['REMOTE_ADDR'] = '127.0.0.1'
        
        # Патчим метод is_ratelimited, чтобы не вызвать реальное ограничение
        with patch('ratelimit.decorators.is_ratelimited', return_value=False):
            response = view(request)
            assert response.status_code == 200
            assert response.data["message"] == "Success"

    @override_settings(RATELIMIT_ENABLE=True)
    def test_api_viewset_rate_limit_decorator(self):
        """Проверяет декоратор api_viewset_rate_limit для ViewSet."""
        
        @api_viewset_rate_limit(group='test_viewset', key='ip', rate='5/m')
        class TestViewSet(ViewSet):
            def list(self, request):
                return Response({"message": "List"})
            
            def retrieve(self, request, pk=None):
                return Response({"message": "Detail", "id": pk})
        
        # Проверяем, что декоратор применился к методам
        assert hasattr(TestViewSet.list, 'ratelimit')
        assert hasattr(TestViewSet.retrieve, 'ratelimit')
        
        # Создаем экземпляр ViewSet для теста
        viewset = TestViewSet()
        viewset.request = self.factory.get('/')
        viewset.request.META['REMOTE_ADDR'] = '127.0.0.1'
        
        # Патчим метод is_ratelimited, чтобы не вызвать реальное ограничение
        with patch('ratelimit.decorators.is_ratelimited', return_value=False):
            response = viewset.list(viewset.request)
            assert response.status_code == 200
            assert response.data["message"] == "List"

    @override_settings(RATELIMIT_ENABLE=False)
    def test_rate_limit_disabled_in_settings(self):
        """Проверяет, что при RATELIMIT_ENABLE=False ограничения не применяются."""
        
        # Создаем мок-функцию, которая будет отслеживать вызовы
        mock_ratelimit = MagicMock(side_effect=lambda *args, **kwargs: lambda func: func)
        
        # Патчим декоратор ratelimit из библиотеки
        with patch('blog.decorators.ratelimit', mock_ratelimit):
            @api_rate_limit(group='test', key='ip', rate='5/m')
            def test_view(request):
                return HttpResponse("Success")
            
            request = self.factory.get('/')
            response = test_view(request)
            
            # Проверяем, что декоратор работает, но не применяет ограничения
            assert response.status_code == 200
            assert response.content == b"Success"
            
            # В настройках тестов RATELIMIT_ENABLE=False, поэтому декоратор ratelimit
            # должен быть вызван с block=False
            mock_ratelimit.assert_called_with(group='test', key='ip', rate='5/m', 
                                             method='ALL', block=False)
