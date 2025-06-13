"""
Тесты для представлений архива блога.

Этот модуль содержит тесты для проверки функциональности API архива постов,
включая получение сводок по годам, месяцам, дням и списков постов по датам.
"""

import pytest
from datetime import datetime
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from blog.models import Post
from blog.services.archive_service import ArchiveService


@pytest.mark.django_db
class TestArchiveViews:
    """Тесты для API архива блога."""

    def setup_method(self):
        """Подготовка тестовых данных."""
        self.client = APIClient()
        
        # Создаем тестовые посты с разными датами публикации
        self.post_2023_jan = Post.objects.create(
            title="Пост за январь 2023",
            slug="post-2023-jan",
            description="Описание поста за январь 2023",
            body={"type": "doc", "content": []},
            is_published=True,
            first_published_at=datetime(2023, 1, 15, tzinfo=timezone.utc),
        )
        
        self.post_2023_feb = Post.objects.create(
            title="Пост за февраль 2023",
            slug="post-2023-feb",
            description="Описание поста за февраль 2023",
            body={"type": "doc", "content": []},
            is_published=True,
            first_published_at=datetime(2023, 2, 20, tzinfo=timezone.utc),
        )
        
        self.post_2024_jan = Post.objects.create(
            title="Пост за январь 2024",
            slug="post-2024-jan",
            description="Описание поста за январь 2024",
            body={"type": "doc", "content": []},
            is_published=True,
            first_published_at=datetime(2024, 1, 10, tzinfo=timezone.utc),
        )
        
        # Создаем черновик (не должен учитываться в архиве)
        self.draft_post = Post.objects.create(
            title="Черновик поста",
            slug="draft-post",
            description="Описание черновика",
            body={"type": "doc", "content": []},
            is_published=False,
            first_published_at=None,
        )
        
        # URL для API архива
        self.years_url = reverse("archive-years")
        self.months_url_2023 = reverse("archive-months", kwargs={"year": "2023"})
        self.days_url_2023_01 = reverse("archive-days", kwargs={"year": "2023", "month": "1"})
        self.posts_url_2023_01_15 = reverse("archive-posts", kwargs={"year": "2023", "month": "1", "day": "15"})

    def test_get_years_summary(self):
        """Тест получения сводки по годам."""
        response = self.client.get(self.years_url)
        
        # Проверяем успешный ответ
        assert response.status_code == status.HTTP_200_OK
        
        # Проверяем, что получены корректные годы
        years = [item["year"] for item in response.data]
        assert 2023 in years
        assert 2024 in years
        
        # Проверяем количество постов за 2023 год (должно быть 2)
        for item in response.data:
            if item["year"] == 2023:
                assert item["count"] == 2
    
    def test_get_months_summary(self):
        """Тест получения сводки по месяцам для конкретного года."""
        response = self.client.get(self.months_url_2023)
        
        # Проверяем успешный ответ
        assert response.status_code == status.HTTP_200_OK
        
        # Проверяем, что получены корректные месяцы
        months = [item["month"] for item in response.data]
        assert 1 in months  # Январь
        assert 2 in months  # Февраль
        
        # Проверяем количество постов за январь 2023 (должно быть 1)
        for item in response.data:
            if item["month"] == 1:
                assert item["count"] == 1
    
    def test_get_days_summary(self):
        """Тест получения сводки по дням для конкретного года и месяца."""
        response = self.client.get(self.days_url_2023_01)
        
        # Проверяем успешный ответ
        assert response.status_code == status.HTTP_200_OK
        
        # Проверяем, что получен корректный день
        days = [item["day"] for item in response.data]
        assert 15 in days  # 15 января
        
        # Проверяем количество постов за 15 января 2023 (должно быть 1)
        for item in response.data:
            if item["day"] == 15:
                assert item["count"] == 1
    
    def test_get_posts_for_day(self):
        """Тест получения списка постов за конкретный день."""
        response = self.client.get(self.posts_url_2023_01_15)
        
        # Проверяем успешный ответ
        assert response.status_code == status.HTTP_200_OK
        
        # Проверяем, что получен нужный пост
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["slug"] == self.post_2023_jan.slug
    
    def test_get_posts_for_day_invalid_date(self):
        """Тест получения списка постов для некорректной даты."""
        invalid_url = reverse("archive-posts", kwargs={"year": "9999", "month": "99", "day": "99"})
        response = self.client.get(invalid_url)
        
        # Проверяем успешный ответ (API возвращает пустой список, а не ошибку)
        assert response.status_code == status.HTTP_200_OK
        
        # Проверяем, что список пуст
        assert len(response.data["results"]) == 0
    
    def test_get_posts_for_day_non_numeric_params(self):
        """Тест получения списка постов с нечисловыми параметрами даты."""
        invalid_url = reverse("archive-posts", kwargs={"year": "year", "month": "month", "day": "day"})
        response = self.client.get(invalid_url)
        
        # Проверяем успешный ответ (API возвращает пустой список, а не ошибку)
        assert response.status_code == status.HTTP_200_OK
        
        # Проверяем, что список пуст
        assert len(response.data["results"]) == 0
