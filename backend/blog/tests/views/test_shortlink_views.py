"""
Тесты для представлений ShortLinkViewSet и ShortLinkRedirectView.

Этот модуль содержит тесты для проверки функциональности API коротких ссылок
и механизма редиректа на полный URL поста.
"""

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from blog.models import Post, ShortLink
from blog.serializers import ShortLinkSerializer
from blog.services.shortlink_service import ShortLinkService


@pytest.mark.django_db
class TestShortLinkViewSet:
    """Тесты для API коротких ссылок."""

    def setup_method(self):
        """Подготовка тестовых данных."""
        self.client = APIClient()
        
        # Создаем тестовые посты
        self.post1 = Post.objects.create(
            title="Тестовый пост 1",
            slug="test-post-1",
            description="Описание тестового поста 1",
            body={"type": "doc", "content": []},
            is_published=True,
            first_published_at=timezone.now(),
        )
        
        self.post2 = Post.objects.create(
            title="Тестовый пост 2",
            slug="test-post-2",
            description="Описание тестового поста 2",
            body={"type": "doc", "content": []},
            is_published=True,
            first_published_at=timezone.now(),
        )
        
        # Создаем короткие ссылки для постов
        self.shortlink1 = ShortLink.objects.create(post=self.post1)
        self.shortlink2 = ShortLink.objects.create(post=self.post2)
        
        # URL для API коротких ссылок
        self.list_url = reverse("shortlink-list")
        self.detail_url = reverse("shortlink-detail", kwargs={"pk": self.shortlink1.id})
        
        # URL для редиректа короткой ссылки
        self.redirect_url = reverse("shortlink-redirect", kwargs={"code": self.shortlink1.code})
        self.nonexistent_redirect_url = reverse("shortlink-redirect", kwargs={"code": "nonexistent-code"})

    def test_list_shortlinks(self):
        """Тест получения списка всех коротких ссылок."""
        response = self.client.get(self.list_url)
        
        # Проверяем успешный ответ
        assert response.status_code == status.HTTP_200_OK
        
        # Проверяем, что получены все ссылки
        assert len(response.data) == 2
        
        # Проверяем, что ссылки содержат все необходимые поля
        for shortlink in response.data:
            assert "id" in shortlink
            assert "code" in shortlink
            assert "post" in shortlink
            assert "created_at" in shortlink
    
    def test_retrieve_shortlink(self):
        """Тест получения короткой ссылки по ID."""
        response = self.client.get(self.detail_url)
        
        # Проверяем успешный ответ
        assert response.status_code == status.HTTP_200_OK
        
        # Проверяем, что получена нужная ссылка
        assert response.data["id"] == self.shortlink1.id
        assert response.data["code"] == self.shortlink1.code
        assert response.data["post"] == self.post1.id
    
    def test_create_shortlink_not_allowed(self):
        """Тест запрета на создание короткой ссылки через API."""
        new_shortlink_data = {
            "post": self.post1.id,
        }
        
        response = self.client.post(self.list_url, new_shortlink_data, format="json")
        
        # Проверяем, что метод не разрешен (ShortLinkViewSet - ReadOnlyModelViewSet)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED


@pytest.mark.django_db
class TestShortLinkRedirectView:
    """Тесты для механизма редиректа коротких ссылок."""

    def setup_method(self):
        """Подготовка тестовых данных."""
        self.client = APIClient()
        
        # Создаем тестовый пост
        self.post = Post.objects.create(
            title="Тестовый пост для редиректа",
            slug="test-post-redirect",
            description="Описание тестового поста для редиректа",
            body={"type": "doc", "content": []},
            is_published=True,
            first_published_at=timezone.now(),
        )
        
        # Создаем короткую ссылку для поста
        self.shortlink = ShortLink.objects.create(post=self.post)
        
        # URL для редиректа короткой ссылки
        self.redirect_url = reverse("shortlink-redirect", kwargs={"code": self.shortlink.code})
        self.nonexistent_redirect_url = reverse("shortlink-redirect", kwargs={"code": "nonexistent-code"})

    def test_redirect_success(self):
        """Тест успешного редиректа по короткой ссылке."""
        response = self.client.get(self.redirect_url)
        
        # Проверяем редирект (статус 302 Found)
        assert response.status_code == status.HTTP_302_FOUND
        
        # Проверяем, что редирект ведет на URL поста
        assert response.url == self.post.get_absolute_url()
    
    def test_redirect_nonexistent_code(self):
        """Тест редиректа по несуществующему коду."""
        # Проверяем, что запрос с несуществующим кодом возвращает 404
        response = self.client.get(self.nonexistent_redirect_url)
        assert response.status_code == status.HTTP_404_NOT_FOUND
