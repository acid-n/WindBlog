"""
Тесты для сервиса RatingService.

Модуль содержит тесты для методов сервиса RatingService:
- get_all_ratings
- create_or_update_rating
- get_post_ratings
- get_average_rating
"""

import pytest
from django.utils import timezone
from blog.models import Rating, Post
from blog.services.rating_service import RatingService


@pytest.fixture
def test_post(db):
    """Фикстура, создающая тестовый пост."""
    return Post.objects.create(
        title="Тестовый пост для рейтингов",
        slug="test-post-for-ratings",
        author="Автор теста",
        image="",
        body="<p>Содержимое тестового поста для тестирования рейтингов</p>",
        is_published=True,
        published_at=timezone.now()
    )


@pytest.fixture
def test_ratings(db, test_post):
    """Фикстура, создающая тестовые рейтинги для поста."""
    rating1 = Rating.objects.create(
        post=test_post,
        score=5,
        user_hash="user1"
    )
    
    rating2 = Rating.objects.create(
        post=test_post,
        score=3,
        user_hash="user2"
    )
    
    return [rating1, rating2]


@pytest.mark.django_db
class TestRatingService:
    """Тесты для сервиса RatingService."""
    
    def test_get_all_ratings(self, test_ratings):
        """Тест получения всех рейтингов."""
        # Получаем все рейтинги
        ratings = RatingService.get_all_ratings()
        
        # Проверяем, что есть как минимум два рейтинга
        assert len(ratings) >= 2
        
        # Проверяем, что созданные рейтинги присутствуют в результате
        assert test_ratings[0] in ratings
        assert test_ratings[1] in ratings
    
    def test_create_rating_new(self, test_post):
        """Тест создания нового рейтинга."""
        # Данные для создания рейтинга
        data = {
            "post": test_post.id,
            "score": 4,
            "user_hash": "new_user"
        }
        
        # Создаем новый рейтинг
        rating, error = RatingService.create_or_update_rating(data)
        
        # Проверяем результат
        assert error is None
        assert rating is not None
        assert rating.post == test_post
        assert rating.score == 4
        assert rating.user_hash == "new_user"
        
        # Проверяем, что рейтинг действительно сохранен в БД
        assert Rating.objects.filter(user_hash="new_user").exists()
    
    def test_update_rating_existing(self, test_ratings, test_post):
        """Тест обновления существующего рейтинга."""
        # Данные для обновления рейтинга
        data = {
            "post": test_post.id,
            "score": 2,  # Меняем оценку с 5 на 2
            "user_hash": "user1"  # Уже существующий пользователь
        }
        
        # Обновляем существующий рейтинг
        rating, error = RatingService.create_or_update_rating(data)
        
        # Проверяем результат
        assert error is None
        assert rating is not None
        assert rating.post == test_post
        assert rating.score == 2  # Проверяем, что оценка обновилась
        assert rating.user_hash == "user1"
        
        # Проверяем, что в БД только один рейтинг для этого пользователя
        assert Rating.objects.filter(user_hash="user1").count() == 1
    
    def test_create_rating_invalid_data(self):
        """Тест создания рейтинга с некорректными данными."""
        # Неполные данные (отсутствует user_hash)
        incomplete_data = {
            "post": 999,
            "score": 5
        }
        
        # Попытка создать рейтинг с неполными данными
        rating, error = RatingService.create_or_update_rating(incomplete_data)
        
        # Проверяем результат
        assert rating is None
        assert error is not None
        assert "Отсутствуют обязательные поля" in error["error"]
        assert error["status"] == 400
    
    def test_create_rating_nonexistent_post(self):
        """Тест создания рейтинга для несуществующего поста."""
        # Данные с несуществующим ID поста
        data = {
            "post": 9999999,  # Несуществующий ID
            "score": 5,
            "user_hash": "test_user"
        }
        
        # Попытка создать рейтинг для несуществующего поста
        rating, error = RatingService.create_or_update_rating(data)
        
        # Проверяем результат
        assert rating is None
        assert error is not None
        assert "не найден" in error["error"]
        assert error["status"] == 404
    
    def test_get_post_ratings(self, test_post, test_ratings):
        """Тест получения рейтингов для конкретного поста."""
        # Получаем рейтинги для поста
        ratings, error = RatingService.get_post_ratings(test_post.id)
        
        # Проверяем результат
        assert error is None
        assert len(ratings) == 2
        assert test_ratings[0] in ratings
        assert test_ratings[1] in ratings
    
    def test_get_post_ratings_nonexistent_post(self):
        """Тест получения рейтингов для несуществующего поста."""
        # Попытка получить рейтинги для несуществующего поста
        ratings, error = RatingService.get_post_ratings(9999999)
        
        # Проверяем результат
        assert ratings is None
        assert error is not None
        assert "не найден" in error["error"]
        assert error["status"] == 404
    
    def test_get_average_rating(self, test_post, test_ratings):
        """Тест получения среднего рейтинга для поста."""
        # Получаем средний рейтинг
        avg_rating, error = RatingService.get_average_rating(test_post.id)
        
        # Проверяем результат
        assert error is None
        assert avg_rating == 4.0  # (5 + 3) / 2 = 4.0
    
    def test_get_average_rating_nonexistent_post(self):
        """Тест получения среднего рейтинга для несуществующего поста."""
        # Попытка получить средний рейтинг для несуществующего поста
        avg_rating, error = RatingService.get_average_rating(9999999)
        
        # Проверяем результат
        assert avg_rating is None
        assert error is not None
        assert "не найден" in error["error"]
        assert error["status"] == 404
