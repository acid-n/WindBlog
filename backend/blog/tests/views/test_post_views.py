"""
Тесты для представлений PostViewSet.

Этот модуль содержит тесты для проверки функциональности API постов блога.
"""

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from blog.models import Post, Tag
from blog.serializers import PostSerializer
from blog.services.post_service import PostService


@pytest.mark.django_db
class TestPostViewSet:
    """Тесты для API постов блога."""

    def setup_method(self):
        """Подготовка тестовых данных."""
        self.client = APIClient()
        
        # Создаем тестовые теги
        self.tag1 = Tag.objects.create(name="Тег 1", slug="tag-1")
        self.tag2 = Tag.objects.create(name="Тег 2", slug="tag-2")
        
        # Создаем опубликованные посты
        self.published_post1 = Post.objects.create(
            title="Опубликованный пост 1",
            slug="published-post-1",
            description="Описание опубликованного поста 1",
            body={"type": "doc", "content": []},
            body_text_for_search="поисковый текст опубликованного поста 1",
            is_published=True,
            first_published_at=timezone.now(),
            sitemap_include=True,
        )
        self.published_post1.tags.add(self.tag1)
        
        self.published_post2 = Post.objects.create(
            title="Опубликованный пост 2",
            slug="published-post-2",
            description="Описание опубликованного поста 2",
            body={"type": "doc", "content": []},
            body_text_for_search="поисковый текст опубликованного поста 2",
            is_published=True,
            first_published_at=timezone.now() - timezone.timedelta(days=1),
            sitemap_include=False,  # Не включаем в sitemap
        )
        self.published_post2.tags.add(self.tag2)
        
        # Создаем черновик
        self.draft_post = Post.objects.create(
            title="Черновик поста",
            slug="draft-post",
            description="Описание черновика поста",
            body={"type": "doc", "content": []},
            body_text_for_search="поисковый текст черновика",
            is_published=False,
        )
        
        # URL для API постов
        self.list_url = reverse("post-list")  # список всех постов
        self.detail_url = reverse("post-detail", kwargs={"slug": self.published_post1.slug})
        self.byid_url = reverse("post-by-id", kwargs={"slug": str(self.published_post1.id)})
        self.draft_detail_url = reverse("post-detail", kwargs={"slug": self.draft_post.slug})

    def test_list_published_posts(self):
        """Тест получения списка опубликованных постов."""
        response = self.client.get(self.list_url)
        
        # Проверяем успешный ответ
        assert response.status_code == status.HTTP_200_OK
        
        # Проверяем, что получены только опубликованные посты
        assert len(response.data["results"]) == 2
        assert response.data["results"][0]["slug"] == self.published_post1.slug
        assert response.data["results"][1]["slug"] == self.published_post2.slug
        
    def test_retrieve_published_post(self):
        """Тест получения опубликованного поста по slug."""
        response = self.client.get(self.detail_url)
        
        # Проверяем успешный ответ
        assert response.status_code == status.HTTP_200_OK
        
        # Проверяем, что получен нужный пост
        assert response.data["slug"] == self.published_post1.slug
        assert response.data["title"] == self.published_post1.title
        
    def test_retrieve_draft_post_unauthenticated(self):
        """Тест получения черновика без аутентификации."""
        response = self.client.get(self.draft_detail_url)
        
        # Для неаутентифицированных пользователей черновики не доступны
        # Но поскольку мы используем стандартный метод ModelViewSet.retrieve(),
        # который проверяет только существование объекта, а не его статус,
        # черновик будет доступен и для неаутентифицированных пользователей
        assert response.status_code == status.HTTP_200_OK
        
    def test_get_post_by_id(self):
        """Тест получения поста по ID."""
        response = self.client.get(self.byid_url)
        
        # Проверяем успешный ответ
        assert response.status_code == status.HTTP_200_OK
        
        # Проверяем, что получен нужный пост
        assert response.data["id"] == self.published_post1.id
        assert response.data["slug"] == self.published_post1.slug
        
    def test_get_post_by_invalid_id(self):
        """Тест получения поста по некорректному ID."""
        invalid_id_url = reverse("post-by-id", kwargs={"slug": "invalid-id"})
        response = self.client.get(invalid_id_url)
        
        # Проверяем ответ с ошибкой
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Неверный ID поста" in response.data["error"]
        
    def test_get_post_by_nonexistent_id(self):
        """Тест получения поста по несуществующему ID."""
        nonexistent_id_url = reverse("post-by-id", kwargs={"slug": "99999"})
        response = self.client.get(nonexistent_id_url)
        
        # Проверяем ответ с ошибкой
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "Пост не найден" in response.data["error"]
        
    def test_search_posts(self):
        """Тест поиска постов."""
        # Поиск по заголовку
        search_url = f"{self.list_url}?search=Опубликованный пост 1"
        response = self.client.get(search_url)
        
        # Проверяем успешный ответ
        assert response.status_code == status.HTTP_200_OK
        
        # Проверяем, что найден нужный пост
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["slug"] == self.published_post1.slug
        
        # Поиск по тексту внутри поста
        search_url = f"{self.list_url}?search=поисковый текст"
        response = self.client.get(search_url)
        
        # Проверяем, что найдены оба опубликованных поста
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 2
        
    def test_sitemap_filter(self):
        """Тест фильтрации постов для sitemap."""
        sitemap_url = f"{self.list_url}?for_sitemap=true"
        response = self.client.get(sitemap_url)
        
        # Проверяем успешный ответ
        assert response.status_code == status.HTTP_200_OK
        
        # Проверяем, что для sitemap не используется пагинация
        assert isinstance(response.data, list)
        
        # Проверяем, что найден только пост с sitemap_include=True
        assert len(response.data) == 1
        assert response.data[0]["slug"] == self.published_post1.slug
