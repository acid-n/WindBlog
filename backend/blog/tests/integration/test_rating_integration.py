"""
Интеграционные тесты для RatingViewSet и RatingService.

Тесты проверяют корректное взаимодействие между представлением и сервисом,
а также правильную обработку API-запросов.
"""

import json
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from blog.models import Post, Rating
from blog.services.rating_service import RatingService


class RatingIntegrationTests(APITestCase):
    """Интеграционные тесты для рейтингов."""
    
    def setUp(self):
        """Подготовка данных для каждого теста."""
        # Создаем тестовый пост
        self.post = Post.objects.create(
            title="Тестовый пост для интеграционных тестов рейтингов",
            slug="test-post-for-integration-tests",
            author="Автор теста",
            image="",
            body="<p>Содержимое тестового поста для интеграционных тестов рейтингов</p>",
            is_published=True,
            published_at=timezone.now()
        )
        
        # Создаем клиента API
        self.client = APIClient()
        
        # Создаем несколько рейтингов для поста
        Rating.objects.create(
            post=self.post,
            score=5,
            user_hash="user1"
        )
        
        Rating.objects.create(
            post=self.post,
            score=3,
            user_hash="user2"
        )
    
    def test_create_rating(self):
        """Тест создания рейтинга через API."""
        url = reverse('rating-list')
        data = {
            'post': self.post.id,
            'score': 4,
            'user_hash': 'new_user'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Rating.objects.count(), 3)
        self.assertEqual(Rating.objects.filter(user_hash='new_user').count(), 1)
        self.assertEqual(Rating.objects.get(user_hash='new_user').score, 4)
    
    def test_update_rating(self):
        """Тест обновления существующего рейтинга через API."""
        url = reverse('rating-list')
        data = {
            'post': self.post.id,
            'score': 2,
            'user_hash': 'user1'  # Существующий пользователь
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Rating.objects.count(), 2)  # Количество рейтингов не изменилось
        self.assertEqual(Rating.objects.get(user_hash='user1').score, 2)  # Обновлено значение
    
    def test_get_post_ratings(self):
        """Тест получения рейтингов для поста через API."""
        url = reverse('rating-detail', args=[self.post.id])
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ratings = json.loads(response.content)
        self.assertEqual(len(ratings), 2)
    
    def test_get_average_rating(self):
        """Тест получения среднего рейтинга поста через API."""
        url = reverse('rating-average', args=[self.post.id])
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content)
        self.assertEqual(data['average_rating'], 4.0)  # (5 + 3) / 2 = 4.0
    
    def test_api_service_integration(self):
        """Тест интеграции между API и сервисом."""
        # Создаем рейтинг через API
        url = reverse('rating-list')
        data = {
            'post': self.post.id,
            'score': 5,
            'user_hash': 'integration_test_user'
        }
        
        self.client.post(url, data, format='json')
        
        # Проверяем, что рейтинг доступен через сервис
        ratings = RatingService.get_all_ratings()
        self.assertTrue(any(r.user_hash == 'integration_test_user' for r in ratings))
        
        # Получаем средний рейтинг через сервис
        avg_rating, _ = RatingService.get_average_rating(self.post.id)
        
        # Проверяем, что средний рейтинг доступен через API
        url = reverse('rating-average', args=[self.post.id])
        response = self.client.get(url)
        data = json.loads(response.content)
        
        # Проверяем, что значения совпадают
        self.assertEqual(data['average_rating'], avg_rating)
