"""
Тесты для мок-реализации декораторов rate limiting.

Использует мок-декораторы вместо реальных для автономного тестирования.
"""

import pytest
from django.test import RequestFactory
from django.http import HttpResponse
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet

from blog.tests.decorators.mock_decorators import (
    mock_api_rate_limit,
    mock_api_view_rate_limit,
    mock_api_viewset_rate_limit
)


@pytest.mark.django_db
class TestMockRateLimitDecorators:
    """Тесты для мок-декораторов ограничения частоты запросов."""

    def setup_method(self):
        """Подготовка тестового окружения."""
        self.factory = RequestFactory()

    def test_mock_api_rate_limit_decorator(self):
        """Проверяет, что мок-декоратор api_rate_limit правильно оборачивает функцию."""
        
        @mock_api_rate_limit(group='test', key='ip', rate='5/m')
        def test_view(request):
            return HttpResponse("Success")
        
        # Проверяем, что декоратор добавил атрибут _ratelimit_config
        assert hasattr(test_view, '_ratelimit_config')
        assert test_view._ratelimit_config['group'] == 'test'
        assert test_view._ratelimit_config['key'] == 'ip'
        assert test_view._ratelimit_config['rate'] == '5/m'
        
        # Проверяем, что функция работает
        request = self.factory.get('/')
        response = test_view(request)
        assert response.status_code == 200
        assert response.content == b"Success"

    def test_mock_api_view_rate_limit_decorator(self):
        """Проверяет, что мок-декоратор api_view_rate_limit правильно применяется к методам класса."""
        
        class TestAPIView(APIView):
            @mock_api_view_rate_limit(group='test_api_view', key='ip', rate='5/m')
            def get(self, request):
                return Response({"message": "Success"})
        
        # Проверяем, что декоратор добавил атрибут _view_rate_limit
        assert hasattr(TestAPIView.get, '_view_rate_limit')
        assert TestAPIView.get._view_rate_limit['group'] == 'test_api_view'
        assert TestAPIView.get._view_rate_limit['key'] == 'ip'
        assert TestAPIView.get._view_rate_limit['rate'] == '5/m'
        
        # Проверяем, что метод работает
        view_instance = TestAPIView()
        request = self.factory.get('/')
        view_instance.request = request
        response = view_instance.get(request)
        assert response.status_code == 200
        assert response.data["message"] == "Success"

    def test_mock_api_viewset_rate_limit_decorator(self):
        """Проверяет, что мок-декоратор api_viewset_rate_limit правильно применяется к классу ViewSet."""
        
        @mock_api_viewset_rate_limit(group='test_viewset', key='ip', rate='5/m')
        class TestViewSet(ViewSet):
            def list(self, request):
                return Response({"message": "List"})
            
            def retrieve(self, request, pk=None):
                return Response({"message": "Detail", "id": pk})
        
        # Проверяем, что декоратор добавил атрибуты к методам
        assert hasattr(TestViewSet.list, '_viewset_rate_limit')
        assert hasattr(TestViewSet.retrieve, '_viewset_rate_limit')
        assert TestViewSet.list._viewset_rate_limit['group'] == 'test_viewset'
        assert TestViewSet.list._viewset_rate_limit['key'] == 'ip'
        assert TestViewSet.list._viewset_rate_limit['rate'] == '5/m'
        
        # Проверяем, что методы работают
        viewset = TestViewSet()
        request = self.factory.get('/')
        viewset.request = request
        
        list_response = viewset.list(request)
        assert list_response.status_code == 200
        assert list_response.data["message"] == "List"
        
        retrieve_response = viewset.retrieve(request, pk=1)
        assert retrieve_response.status_code == 200
        assert retrieve_response.data["message"] == "Detail"
        assert retrieve_response.data["id"] == 1
