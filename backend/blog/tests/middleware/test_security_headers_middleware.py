"""
Тесты для SecurityHeadersMiddleware.

Проверяют добавление HTTP Security Headers к ответам приложения.
"""

import pytest
from django.test import RequestFactory
from django.http import HttpResponse
from blog.middleware import SecurityHeadersMiddleware


@pytest.mark.django_db
class TestSecurityHeadersMiddleware:
    """Тесты для middleware, добавляющего заголовки безопасности."""

    def setup_method(self):
        """Подготовка тестового окружения."""
        self.factory = RequestFactory()
        self.get_response_mock = lambda request: HttpResponse("Test Response")
        self.middleware = SecurityHeadersMiddleware(self.get_response_mock)

    def test_adds_xss_protection_header(self):
        """Проверяет добавление заголовка X-XSS-Protection."""
        request = self.factory.get('/')
        response = self.middleware(request)
        assert 'X-XSS-Protection' in response
        assert response['X-XSS-Protection'] == '1; mode=block'

    def test_adds_content_type_options_header(self):
        """Проверяет добавление заголовка X-Content-Type-Options."""
        request = self.factory.get('/')
        response = self.middleware(request)
        assert 'X-Content-Type-Options' in response
        assert response['X-Content-Type-Options'] == 'nosniff'

    def test_adds_frame_options_header(self):
        """Проверяет добавление заголовка X-Frame-Options."""
        request = self.factory.get('/')
        response = self.middleware(request)
        assert 'X-Frame-Options' in response
        assert response['X-Frame-Options'] == 'DENY'

    def test_adds_content_security_policy_header(self):
        """Проверяет добавление заголовка Content-Security-Policy."""
        request = self.factory.get('/')
        response = self.middleware(request)
        assert 'Content-Security-Policy' in response
        # Проверяем наличие основных директив
        assert "default-src 'self'" in response['Content-Security-Policy']
        assert "script-src" in response['Content-Security-Policy']

    def test_adds_referrer_policy_header(self):
        """Проверяет добавление заголовка Referrer-Policy."""
        request = self.factory.get('/')
        response = self.middleware(request)
        assert 'Referrer-Policy' in response
        assert response['Referrer-Policy'] == 'strict-origin-when-cross-origin'

    def test_adds_permissions_policy_header(self):
        """Проверяет добавление заголовка Permissions-Policy."""
        request = self.factory.get('/')
        response = self.middleware(request)
        assert 'Permissions-Policy' in response
        assert 'camera=()' in response['Permissions-Policy']
        assert 'microphone=()' in response['Permissions-Policy']
        assert 'geolocation=()' in response['Permissions-Policy']

    def test_adds_hsts_header_for_secure_request(self):
        """Проверяет добавление HSTS заголовка для HTTPS запросов."""
        request = self.factory.get('/')
        request.is_secure = lambda: True  # Имитируем HTTPS запрос
        response = self.middleware(request)
        assert 'Strict-Transport-Security' in response
        assert 'max-age=31536000' in response['Strict-Transport-Security']
        assert 'includeSubDomains' in response['Strict-Transport-Security']

    def test_no_hsts_header_for_insecure_request(self):
        """Проверяет отсутствие HSTS заголовка для HTTP запросов."""
        request = self.factory.get('/')
        request.is_secure = lambda: False  # Имитируем HTTP запрос
        response = self.middleware(request)
        assert 'Strict-Transport-Security' not in response
