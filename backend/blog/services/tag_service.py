"""
Сервисный слой для работы с тегами блога.

Этот модуль содержит класс TagService, который инкапсулирует
бизнес-логику, связанную с моделью Tag.
"""

import logging
from typing import Optional, Dict, Any, List, Tuple
from django.db.models import Count, Q, QuerySet

from slugify import slugify as slugify_unicode
from unidecode import unidecode

from ..models import Tag, Post

# Получаем логгер
logger = logging.getLogger(__name__)


class TagService:
    """
    Сервис для работы с тегами блога.
    
    Предоставляет методы для выполнения операций с тегами,
    инкапсулируя бизнес-логику и отделяя ее от представлений.
    """
    
    @staticmethod
    def get_all_tags() -> QuerySet:
        """
        Возвращает queryset всех тегов.
        
        Returns:
            QuerySet: Queryset всех тегов, отсортированный по имени
        """
        return Tag.objects.all().order_by("name").prefetch_related("posts")
    
    @staticmethod
    def get_tags_with_post_count() -> QuerySet:
        """
        Возвращает queryset тегов с количеством опубликованных постов.
        
        Returns:
            QuerySet: Queryset тегов с аннотацией posts_count
        """
        return (
            Tag.objects.all()
            .annotate(posts_count=Count("posts", filter=Q(posts__is_published=True)))
            .order_by("name")
            .prefetch_related("posts")
        )
    
    @staticmethod
    def get_tag_by_slug(slug: str) -> Optional[Tag]:
        """
        Получает тег по его slug.
        
        Args:
            slug (str): Slug тега
            
        Returns:
            Tag: Объект тега или None, если тег не найден
        """
        try:
            return Tag.objects.prefetch_related("posts").get(slug=slug)
        except Tag.DoesNotExist:
            logger.warning(f"[TagService] Попытка получить несуществующий тег по slug: {slug}")
            return None
    
    @staticmethod
    def get_posts_by_tag(tag: Tag) -> QuerySet:
        """
        Возвращает опубликованные посты для указанного тега.
        
        Args:
            tag (Tag): Объект тега
            
        Returns:
            QuerySet: Queryset опубликованных постов, связанных с тегом
        """
        return (
            tag.posts.filter(is_published=True)
            .order_by("-first_published_at")
            .prefetch_related("tags", "ratings", "shortlinks")
        )
    
    @classmethod
    def create_tag(cls, name: str) -> Tuple[Tag, Dict[str, Any]]:
        """
        Создает новый тег с указанным именем.
        
        Проверяет на дубликаты по slug, генерирует slug из имени.
        
        Args:
            name (str): Имя нового тега
            
        Returns:
            Tuple[Tag, Dict]: Кортеж с созданным тегом (или найденным существующим) 
                             и словарем с дополнительной информацией
        """
        if not name:
            return None, {"error": "Поле 'name' обязательно.", "status": 400}
        
        # Генерация slug из имени
        slug = slugify_unicode(unidecode(name))
        if not slug:
            return None, {"error": "Невозможно создать slug из указанного имени.", "status": 400}
        
        # Проверка на существование тега с таким slug
        existing_tag = Tag.objects.filter(slug=slug).first()
        if existing_tag:
            # Если тег существует, но с другим именем - коллизия slug
            if existing_tag.name != name:
                return existing_tag, {
                    "error": "Slug collision: тег с таким slug уже существует, но с другим именем.",
                    "slug": slug,
                    "status": 409
                }
            # Если тег с таким именем уже существует
            return existing_tag, {"detail": "Тег уже существует", "status": 200}
        
        # Создаем новый тег
        try:
            new_tag = Tag.objects.create(name=name)
            logger.info(f"[TagService] Создан новый тег: {name} (slug: {new_tag.slug})")
            return new_tag, {"status": 201}
        except Exception as e:
            logger.error(f"[TagService] Ошибка при создании тега '{name}': {str(e)}")
            return None, {"error": f"Ошибка при создании тега: {str(e)}", "status": 500}
    
    @classmethod
    def get_popular_tags(cls, limit: int = 10) -> List[Tag]:
        """
        Возвращает самые популярные теги по количеству связанных опубликованных постов.
        
        Args:
            limit (int): Максимальное количество возвращаемых тегов
            
        Returns:
            List[Tag]: Список самых популярных тегов
        """
        return list(
            Tag.objects.annotate(
                posts_count=Count("posts", filter=Q(posts__is_published=True))
            )
            .filter(posts_count__gt=0)
            .order_by("-posts_count")[:limit]
        )
