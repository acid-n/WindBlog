"""
Сервисный слой для работы с постами блога.

Этот модуль содержит класс PostService, который инкапсулирует
бизнес-логику, связанную с моделью Post.
"""

import logging
from django.conf import settings
from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
from django.db.models import Q, QuerySet

from ..models import Post

# Получаем логгер
logger = logging.getLogger(__name__)


class PostService:
    """
    Сервис для работы с постами блога.
    
    Предоставляет методы для выполнения операций с постами,
    инкапсулируя бизнес-логику и отделяя ее от представлений.
    """
    
    @staticmethod
    def get_published_posts() -> QuerySet:
        """
        Возвращает queryset опубликованных постов.
        
        Returns:
            QuerySet: Queryset опубликованных постов с подгруженными связанными объектами
        """
        return (
            Post.objects.filter(is_published=True)
            .order_by("-first_published_at")
            .prefetch_related("tags", "ratings", "shortlinks")
        )
    
    @staticmethod
    def get_draft_posts() -> QuerySet:
        """
        Возвращает queryset черновиков постов.
        
        Returns:
            QuerySet: Queryset неопубликованных постов с подгруженными связанными объектами
        """
        return (
            Post.objects.filter(is_published=False)
            .order_by("-updated_at")
            .prefetch_related("tags", "ratings", "shortlinks")
        )
    
    @staticmethod
    def get_posts_for_sitemap() -> QuerySet:
        """
        Возвращает queryset постов для sitemap.
        
        Returns:
            QuerySet: Queryset опубликованных постов, включенных в sitemap
        """
        return (
            Post.objects.filter(is_published=True, sitemap_include=True)
            .order_by("-first_published_at")
            .prefetch_related("tags")
        )
    
    @staticmethod
    def search_posts(search_term: str) -> QuerySet:
        """
        Выполняет полнотекстовый поиск по постам.
        
        Args:
            search_term (str): Поисковый запрос
            
        Returns:
            QuerySet: Queryset постов, отсортированный по релевантности
        """
        if not search_term:
            return Post.objects.none()
            
        search_language = getattr(settings, "SEARCH_LANGUAGE", "russian")
        vector = SearchVector(
            "title",
            "slug",
            "description",
            "body_text_for_search",
            config=search_language,
        )
        query = SearchQuery(
            search_term, config=search_language, search_type="websearch"
        )
        
        return (
            Post.objects.filter(is_published=True)
            .annotate(rank=SearchRank(vector, query))
            .filter(rank__gte=0.01)
            .order_by("-rank", "-first_published_at")
            .prefetch_related("tags", "ratings", "shortlinks")
        )
    
    @staticmethod
    def get_post_by_slug(slug: str) -> Post:
        """
        Получает пост по его slug.
        
        Args:
            slug (str): Slug поста
            
        Returns:
            Post: Объект поста или None, если пост не найден
        """
        try:
            return Post.objects.prefetch_related("tags", "ratings", "shortlinks").get(slug=slug)
        except Post.DoesNotExist:
            logger.warning(f"[PostService] Попытка получить несуществующий пост по slug: {slug}")
            return None
    
    @staticmethod
    def get_post_by_id(post_id: int) -> Post:
        """
        Получает опубликованный пост по его ID.
        
        Args:
            post_id (int): ID поста
            
        Returns:
            Post: Объект поста или None, если пост не найден
        """
        try:
            return Post.objects.filter(id=post_id, is_published=True).prefetch_related("tags", "ratings").first()
        except (ValueError, TypeError):
            logger.warning(f"[PostService] Неверный ID поста: {post_id}")
            return None
        except Exception as e:
            logger.error(f"[PostService] Ошибка при получении поста по ID {post_id}: {str(e)}")
            return None
