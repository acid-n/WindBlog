"""
Тесты для модели Rating.

Проверяют корректность работы модели рейтингов, включая валидацию score и ограничения уникальности.
"""

import pytest
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from django.utils import timezone

from blog.models import Post, Rating


@pytest.mark.django_db
class TestRatingModel:
    """Тесты для модели рейтингов."""

    def setup_method(self):
        """Подготовка тестовых данных."""
        # Создаем пост для тестов рейтингов
        self.post = Post.objects.create(
            title="Тестовый пост для рейтингов",
            slug="test-post-ratings",
            description="Описание поста для тестов рейтингов",
            body={"type": "doc", "content": []},
            is_published=True,
            first_published_at=timezone.now(),
        )
        
        # Базовые данные для создания рейтинга
        self.rating_data = {
            "post": self.post,
            "score": 4,
            "user_hash": "test_user_hash_123",
        }

    def test_create_rating(self):
        """Тест создания рейтинга с валидными данными."""
        rating = Rating.objects.create(**self.rating_data)
        
        assert rating.id is not None
        assert rating.post == self.post
        assert rating.score == 4
        assert rating.user_hash == "test_user_hash_123"
        
    def test_score_validation_min(self):
        """Тест валидации минимального значения score."""
        invalid_data = self.rating_data.copy()
        invalid_data["score"] = 0  # Минимальное допустимое значение - 1
        
        with pytest.raises(ValidationError):
            rating = Rating(**invalid_data)
            rating.full_clean()  # Запускаем валидацию явно
            
    def test_score_validation_max(self):
        """Тест валидации максимального значения score."""
        invalid_data = self.rating_data.copy()
        invalid_data["score"] = 6  # Максимальное допустимое значение - 5
        
        with pytest.raises(ValidationError):
            rating = Rating(**invalid_data)
            rating.full_clean()  # Запускаем валидацию явно
            
    def test_unique_post_user_hash(self):
        """Тест ограничения уникальности (post, user_hash)."""
        Rating.objects.create(**self.rating_data)
        
        # Пытаемся создать рейтинг с теми же post и user_hash
        with pytest.raises(IntegrityError):
            Rating.objects.create(**self.rating_data)
            
    def test_update_existing_rating(self):
        """Тест обновления существующего рейтинга."""
        rating = Rating.objects.create(**self.rating_data)
        
        # Обновляем score
        rating.score = 5
        rating.save()
        
        # Проверяем, что обновление успешно
        updated_rating = Rating.objects.get(id=rating.id)
        assert updated_rating.score == 5
        
    def test_multiple_ratings_for_post(self):
        """Тест создания нескольких рейтингов для одного поста."""
        # Создаем первый рейтинг
        Rating.objects.create(**self.rating_data)
        
        # Создаем второй рейтинг с другим user_hash
        second_rating_data = self.rating_data.copy()
        second_rating_data["user_hash"] = "another_user_hash"
        Rating.objects.create(**second_rating_data)
        
        # Проверяем, что у поста два рейтинга
        assert self.post.ratings.count() == 2
