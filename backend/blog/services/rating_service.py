"""
Сервисный модуль для работы с рейтингами постов.

Предоставляет методы для создания, обновления и получения рейтингов постов.
Рейтинги привязаны к user_hash пользователя и могут быть установлены только один раз для каждого поста.
"""

import logging
from typing import Dict, Any, List, Tuple, Optional, Union
from django.db.models import Avg, QuerySet

from blog.models import Rating, Post

logger = logging.getLogger(__name__)


class RatingService:
    """
    Сервис для работы с рейтингами постов блога.
    
    Предоставляет методы для:
    - Создания и обновления рейтингов
    - Получения всех рейтингов
    - Получения рейтингов конкретного поста
    - Расчета среднего рейтинга поста
    """
    
    @staticmethod
    def get_all_ratings() -> QuerySet:
        """
        Получение всех рейтингов.
        
        Returns:
            QuerySet: Запрос, возвращающий все рейтинги, отсортированные по дате создания (сначала новые)
        """
        # Используем select_related для загрузки связанных постов за один запрос
        return Rating.objects.select_related('post').order_by('-created_at')
    
    @classmethod
    def create_or_update_rating(cls, data: Dict[str, Any]) -> Tuple[Optional[Rating], Optional[Dict[str, Any]]]:
        """
        Создает новый рейтинг или обновляет существующий.
        
        Если пользователь с указанным user_hash уже оценивал данный пост,
        его оценка будет обновлена. В противном случае создается новая оценка.
        
        Args:
            data (Dict): Данные рейтинга (должны содержать post, score, user_hash)
            
        Returns:
            Tuple[Rating, Dict]: Кортеж с созданным/обновленным рейтингом (или None при ошибке)
                               и словарем с ошибкой (или None при успехе)
        """
        post_id = data.get('post')
        user_hash = data.get('user_hash')
        score = data.get('score')
        
        if not post_id or not user_hash or not score:
            error = {
                "error": "Отсутствуют обязательные поля (post, user_hash, score)",
                "status": 400
            }
            logger.error(f"[RatingService] Ошибка валидации данных: {error}")
            return None, error
            
        try:
            # Проверяем существование поста
            try:
                post = Post.objects.get(id=post_id)
            except Post.DoesNotExist:
                error = {
                    "error": f"Пост с ID {post_id} не найден",
                    "status": 404
                }
                logger.error(f"[RatingService] {error['error']}")
                return None, error
                
            # Проверяем, есть ли уже рейтинг от этого пользователя
            rating, created = Rating.objects.update_or_create(
                post=post,
                user_hash=user_hash,
                defaults={'score': score}
            )
            
            action = "создан" if created else "обновлен"
            logger.info(f"[RatingService] Рейтинг для поста {post_id} {action}, score={score}")
            
            return rating, None
            
        except Exception as e:
            error = {
                "error": f"Ошибка при создании/обновлении рейтинга: {str(e)}",
                "status": 500
            }
            logger.error(f"[RatingService] {error['error']}")
            return None, error
    
    @staticmethod
    def get_post_ratings(post_id: int) -> Tuple[Optional[QuerySet], Optional[Dict[str, Any]]]:
        """
        Получение всех рейтингов для конкретного поста.
        
        Args:
            post_id (int): ID поста
            
        Returns:
            Tuple[QuerySet, Dict]: Кортеж с запросом рейтингов (или None при ошибке)
                                 и словарем с ошибкой (или None при успехе)
        """
        try:
            # Сначала проверяем существование поста, используя кэшируемый exists() запрос
            if not Post.objects.filter(id=post_id).exists():
                error = {
                    "error": f"Пост с ID {post_id} не найден",
                    "status": 404
                }
                logger.error(f"[RatingService] {error['error']}")
                return None, error
                
            # Используем select_related для загрузки связанных данных поста вместе с рейтингами
            ratings = Rating.objects.select_related('post').filter(post_id=post_id).order_by('-created_at')
            return ratings, None
            
        except Exception as e:
            error = {
                "error": f"Ошибка при получении рейтингов для поста {post_id}: {str(e)}",
                "status": 500
            }
            logger.error(f"[RatingService] {error['error']}")
            return None, error
    
    @staticmethod
    def get_average_rating(post_id: int) -> Tuple[Optional[float], Optional[Dict[str, Any]]]:
        """
        Получение среднего рейтинга для конкретного поста.
        
        Args:
            post_id (int): ID поста
            
        Returns:
            Tuple[float, Dict]: Кортеж со средним рейтингом (или None при ошибке)
                              и словарем с ошибкой (или None при успехе)
        """
        try:
            # Проверяем существование поста быстрым запросом exists()
            if not Post.objects.filter(id=post_id).exists():
                error = {
                    "error": f"Пост с ID {post_id} не найден",
                    "status": 404
                }
                logger.error(f"[RatingService] {error['error']}")
                return None, error
                
            # Получаем средний рейтинг напрямую из базы данных без загрузки поста
            # Это эффективнее, чем загрузка всего объекта поста
            avg_data = Rating.objects.filter(post_id=post_id).aggregate(avg_score=Avg('score'))
            avg_score = avg_data.get('avg_score')
            
            # Округляем до 1 знака после запятой, если рейтинг есть
            result = round(avg_score, 1) if avg_score is not None else 0
            
            return result, None
            
        except Exception as e:
            error = {
                "error": f"Ошибка при получении среднего рейтинга для поста {post_id}: {str(e)}",
                "status": 500
            }
            logger.error(f"[RatingService] {error['error']}")
            return None, error
