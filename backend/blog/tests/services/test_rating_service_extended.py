"""
Расширенные тесты для RatingService.

Проверяют функциональность сервиса рейтингов, включая создание, обновление,
получение рейтингов для постов и расчет среднего рейтинга.
"""

import pytest
from datetime import datetime
from django.utils import timezone

from blog.models import Post, Rating
from blog.services.rating_service import RatingService


@pytest.mark.django_db
class TestRatingServiceExtended:
    """Расширенные тесты для RatingService."""

    def setup_method(self):
        """Подготовка тестовых данных."""
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
        
        # Создаем тестовые рейтинги для первого поста
        self.rating1 = Rating.objects.create(
            post=self.post1,
            score=5,
            user_hash="user1",
        )
        
        self.rating2 = Rating.objects.create(
            post=self.post1,
            score=3,
            user_hash="user2",
        )
        
        # Тестовые данные для создания нового рейтинга
        self.new_rating_data = {
            "post": self.post1.id,
            "score": 4,
            "user_hash": "user3",
        }
        
        # Тестовые данные для обновления существующего рейтинга
        self.update_rating_data = {
            "post": self.post1.id,
            "score": 2,
            "user_hash": "user1",  # Тот же пользователь, что и у rating1
        }
        
        # Тестовые данные с неверным ID поста
        self.invalid_post_data = {
            "post": 9999,  # Несуществующий ID
            "score": 4,
            "user_hash": "user4",
        }
        
        # Тестовые данные с отсутствующими обязательными полями
        self.incomplete_data = {
            "post": self.post1.id,
            # Отсутствует score
            "user_hash": "user5",
        }

    def test_get_all_ratings(self):
        """Тестирование получения всех рейтингов."""
        ratings = RatingService.get_all_ratings()
        
        # Проверяем, что получили все созданные рейтинги
        assert ratings.count() == 2
        # Проверяем сортировку (сначала новые)
        assert ratings.first().user_hash == "user2"  # Рейтинг, созданный последним
        
    def test_create_rating_new(self):
        """Тестирование создания нового рейтинга."""
        rating, error = RatingService.create_or_update_rating(self.new_rating_data)
        
        # Проверяем, что рейтинг создан
        assert rating is not None
        assert error is None
        assert rating.post_id == self.post1.id
        assert rating.score == 4
        assert rating.user_hash == "user3"
        
        # Проверяем, что рейтинг сохранен в БД
        assert Rating.objects.filter(user_hash="user3").exists()
        
    def test_update_existing_rating(self):
        """Тестирование обновления существующего рейтинга."""
        # Проверяем текущее значение рейтинга пользователя user1
        assert self.rating1.score == 5
        
        # Обновляем рейтинг
        rating, error = RatingService.create_or_update_rating(self.update_rating_data)
        
        # Проверяем, что рейтинг обновлен
        assert rating is not None
        assert error is None
        assert rating.post_id == self.post1.id
        assert rating.score == 2  # Обновленное значение
        assert rating.user_hash == "user1"
        
        # Проверяем, что в БД только один рейтинг для пользователя user1
        assert Rating.objects.filter(user_hash="user1").count() == 1
        
    def test_create_rating_invalid_post(self):
        """Тестирование создания рейтинга с неверным ID поста."""
        rating, error = RatingService.create_or_update_rating(self.invalid_post_data)
        
        # Проверяем, что рейтинг не создан
        assert rating is None
        assert error is not None
        assert "не найден" in error["error"]
        assert error["status"] == 404
        
    def test_create_rating_incomplete_data(self):
        """Тестирование создания рейтинга с неполными данными."""
        rating, error = RatingService.create_or_update_rating(self.incomplete_data)
        
        # Проверяем, что рейтинг не создан
        assert rating is None
        assert error is not None
        assert "Отсутствуют обязательные поля" in error["error"]
        assert error["status"] == 400
        
    def test_get_post_ratings(self):
        """Тестирование получения рейтингов для конкретного поста."""
        ratings, error = RatingService.get_post_ratings(self.post1.id)
        
        # Проверяем, что рейтинги получены
        assert ratings is not None
        assert error is None
        assert ratings.count() == 2
        
        # Проверяем, что рейтинги относятся к нужному посту
        for rating in ratings:
            assert rating.post_id == self.post1.id
            
    def test_get_post_ratings_nonexistent_post(self):
        """Тестирование получения рейтингов для несуществующего поста."""
        ratings, error = RatingService.get_post_ratings(9999)
        
        # Проверяем, что рейтинги не получены
        assert ratings is None
        assert error is not None
        assert "не найден" in error["error"]
        assert error["status"] == 404
        
    def test_get_average_rating(self):
        """Тестирование расчета среднего рейтинга поста."""
        # Для поста 1 у нас есть рейтинги 5 и 3, среднее = 4.0
        avg_rating, error = RatingService.get_average_rating(self.post1.id)
        
        # Проверяем, что средний рейтинг посчитан правильно
        assert avg_rating == 4.0
        assert error is None
        
    def test_get_average_rating_no_ratings(self):
        """Тестирование расчета среднего рейтинга для поста без рейтингов."""
        # Для поста 2 нет рейтингов
        avg_rating, error = RatingService.get_average_rating(self.post2.id)
        
        # Проверяем, что средний рейтинг = 0
        assert avg_rating == 0
        assert error is None
        
    def test_get_average_rating_nonexistent_post(self):
        """Тестирование расчета среднего рейтинга для несуществующего поста."""
        avg_rating, error = RatingService.get_average_rating(9999)
        
        # Проверяем, что средний рейтинг не посчитан
        assert avg_rating is None
        assert error is not None
        assert "не найден" in error["error"]
        assert error["status"] == 404
