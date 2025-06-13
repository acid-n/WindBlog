"""
Тесты для представлений RatingViewSet.

Этот модуль содержит тесты для проверки функциональности API рейтингов постов.
"""

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from blog.models import Post, Rating
from blog.serializers.post_serializers import RatingSerializer
from blog.services.rating_service import RatingService


@pytest.mark.django_db
class TestRatingViewSet:
    """Тесты для API рейтингов постов."""

    def setup_method(self):
        """Подготовка тестовых данных."""
        self.client = APIClient()
        
        # Создаем тестовый пост
        self.post = Post.objects.create(
            title="Тестовый пост для рейтингов",
            slug="test-post-for-ratings",
            description="Описание тестового поста для рейтингов",
            body={"type": "doc", "content": []},
            is_published=True,
            first_published_at=timezone.now(),
        )
        
        # Создаем тестовые рейтинги
        self.rating1 = Rating.objects.create(
            post=self.post,
            score=5,
            user_hash="user1hash",
        )
        
        self.rating2 = Rating.objects.create(
            post=self.post,
            score=3,
            user_hash="user2hash",
        )
        
        # URL для API рейтингов
        self.list_url = reverse("rating-list")
        self.post_ratings_url = reverse("rating-post-ratings", kwargs={"post_id": str(self.post.id)})
        self.average_rating_url = reverse("rating-average-rating", kwargs={"post_id": str(self.post.id)})
        
        # Данные для создания нового рейтинга
        self.new_rating_data = {
            "post": self.post.id,
            "score": 4,
            "user_hash": "user3hash",
        }
        
        # Данные для обновления существующего рейтинга
        self.update_rating_data = {
            "post": self.post.id,
            "score": 2,
            "user_hash": "user1hash",  # Тот же user_hash, что и у rating1
        }
        
        # Данные с неверным ID поста
        self.invalid_post_data = {
            "post": 9999,  # Несуществующий ID
            "score": 4,
            "user_hash": "user4hash",
        }
        
        # Данные с неверным значением score
        self.invalid_score_data = {
            "post": self.post.id,
            "score": 6,  # Неверное значение (допустимо от 1 до 5)
            "user_hash": "user5hash",
        }

    def test_list_ratings(self):
        """Тест получения списка всех рейтингов."""
        response = self.client.get(self.list_url)
        
        # Проверяем успешный ответ
        assert response.status_code == status.HTTP_200_OK
        
        # Проверяем, что получены все рейтинги
        assert len(response.data) == 2
        
        # Проверяем, что рейтинги содержат все необходимые поля
        for rating in response.data:
            assert "id" in rating
            assert "post" in rating
            assert "score" in rating
            assert "user_hash" in rating
            assert "created_at" in rating
        
    def test_create_rating(self):
        """Тест создания нового рейтинга."""
        response = self.client.post(self.list_url, self.new_rating_data, format="json")
        
        # Проверяем успешный ответ
        assert response.status_code == status.HTTP_201_CREATED
        
        # Проверяем, что рейтинг создан с правильными данными
        assert response.data["post"] == self.post.id
        assert response.data["score"] == 4
        assert response.data["user_hash"] == "user3hash"
        
        # Проверяем, что рейтинг сохранен в БД
        assert Rating.objects.filter(user_hash="user3hash").exists()
        
    def test_update_existing_rating(self):
        """Тест обновления существующего рейтинга."""
        response = self.client.post(self.list_url, self.update_rating_data, format="json")
        
        # Проверяем успешный ответ
        assert response.status_code == status.HTTP_201_CREATED
        
        # Проверяем, что рейтинг обновлен с правильными данными
        assert response.data["post"] == self.post.id
        assert response.data["score"] == 2  # Новое значение
        assert response.data["user_hash"] == "user1hash"
        
        # Проверяем, что в БД только один рейтинг для пользователя
        assert Rating.objects.filter(user_hash="user1hash").count() == 1
        
    def test_create_rating_invalid_post(self):
        """Тест создания рейтинга с неверным ID поста."""
        response = self.client.post(self.list_url, self.invalid_post_data, format="json")
        
        # Проверяем ответ с ошибкой
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "не найден" in response.data["error"]
        
    def test_create_rating_invalid_score(self):
        """Тест создания рейтинга с неверным значением score."""
        response = self.client.post(self.list_url, self.invalid_score_data, format="json")
        
        # Проверяем ответ с ошибкой валидации
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "score" in response.data
        
    def test_get_post_ratings(self):
        """Тест получения рейтингов для конкретного поста."""
        response = self.client.get(self.post_ratings_url)
        
        # Проверяем успешный ответ
        assert response.status_code == status.HTTP_200_OK
        
        # Проверяем, что получены все рейтинги для поста
        assert len(response.data) == 2
        
        # Проверяем, что все рейтинги относятся к нужному посту
        for rating in response.data:
            assert rating["post"] == self.post.id
        
    def test_get_post_ratings_nonexistent_post(self):
        """Тест получения рейтингов для несуществующего поста."""
        nonexistent_url = reverse("rating-post-ratings", kwargs={"post_id": "9999"})
        response = self.client.get(nonexistent_url)
        
        # Проверяем ответ с ошибкой
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "не найден" in response.data["error"]
        
    def test_get_average_rating(self):
        """Тест получения среднего рейтинга для поста."""
        response = self.client.get(self.average_rating_url)
        
        # Проверяем успешный ответ
        assert response.status_code == status.HTTP_200_OK
        
        # Проверяем структуру ответа
        assert "post_id" in response.data
        assert "average_rating" in response.data
        
        # Проверяем ID поста
        assert str(response.data["post_id"]) == str(self.post.id)
        
        # Проверяем среднее значение рейтинга
        # Для рейтингов 5 и 3 среднее значение = 4.0
        assert response.data["average_rating"] == 4.0
        
    def test_get_average_rating_nonexistent_post(self):
        """Тест получения среднего рейтинга для несуществующего поста."""
        nonexistent_url = reverse("rating-average-rating", kwargs={"post_id": "9999"})
        response = self.client.get(nonexistent_url)
        
        # Проверяем ответ с ошибкой
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "не найден" in response.data["error"]
