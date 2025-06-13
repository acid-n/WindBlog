"""
Представления для работы с рейтингами постов.
"""
import logging
from typing import Dict, Any

from django.db.models import Avg
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from blog.decorators import api_viewset_rate_limit, api_view_rate_limit
from blog.models import Rating, Post
from blog.serializers.post_serializers import RatingSerializer, RatingCreateSerializer
from blog.services.rating_service import RatingService

logger = logging.getLogger(__name__)


@api_viewset_rate_limit(group='user_content', key='ip', rate='20/m')
class RatingViewSet(viewsets.ModelViewSet):
    """
    API для работы с рейтингами постов.
    
    Позволяет создавать и получать рейтинги постов.
    Рейтинги привязаны к user_hash пользователя и могут быть установлены только один раз.
    Все методы защищены ограничением частоты запросов (20 запросов в минуту).
    """
    queryset = Rating.objects.all()
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        """Возвращает разные сериализаторы в зависимости от действия."""
        if self.action == 'create':
            return RatingCreateSerializer
        return RatingSerializer
    
    @method_decorator(cache_page(60 * 15))  # Кеширование на 15 минут
    def list(self, request: Request) -> Response:
        """
        Получение списка всех рейтингов.
        
        Возвращает список всех рейтингов в системе.
        Результаты кешируются на 15 минут.
        """
        ratings = RatingService.get_all_ratings()
        serializer = self.get_serializer(ratings, many=True)
        return Response(serializer.data)
    
    def create(self, request: Request) -> Response:
        """
        Создание нового рейтинга для поста.
        
        Если пользователь уже оценил этот пост, его рейтинг будет обновлен.
        """
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            rating, error = RatingService.create_or_update_rating(serializer.validated_data)
            
            if error:
                return Response(error, status=error.get('status', status.HTTP_400_BAD_REQUEST))
                
            result_serializer = RatingSerializer(rating)
            return Response(result_serializer.data, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='post/(?P<post_id>[^/.]+)')
    def post_ratings(self, request: Request, post_id=None) -> Response:
        """
        Получение всех рейтингов для конкретного поста.
        
        Args:
            post_id: ID поста, для которого нужно получить рейтинги
        """
        ratings, error = RatingService.get_post_ratings(post_id)
        
        if error:
            return Response(error, status=error.get('status', status.HTTP_404_NOT_FOUND))
            
        serializer = self.get_serializer(ratings, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='average/(?P<post_id>[^/.]+)')
    def average_rating(self, request: Request, post_id=None) -> Response:
        """
        Получение среднего рейтинга для конкретного поста.
        
        Args:
            post_id: ID поста, для которого нужно получить средний рейтинг
        """
        avg_rating, error = RatingService.get_average_rating(post_id)
        
        if error:
            return Response(error, status=error.get('status', status.HTTP_404_NOT_FOUND))
            
        return Response({"post_id": post_id, "average_rating": avg_rating})
