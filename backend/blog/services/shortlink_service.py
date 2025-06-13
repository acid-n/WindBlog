"""
Сервисный слой для работы с короткими ссылками блога.

Этот модуль содержит класс ShortLinkService, который инкапсулирует
бизнес-логику, связанную с моделью ShortLink.
"""

import logging
from typing import Optional, Dict, Any

from django.db.models import QuerySet

from ..models import ShortLink, Post

# Получаем логгер
logger = logging.getLogger(__name__)


class ShortLinkService:
    """
    Сервис для работы с короткими ссылками блога.
    
    Предоставляет методы для выполнения операций с короткими ссылками,
    инкапсулируя бизнес-логику и отделяя ее от представлений.
    """
    
    @staticmethod
    def get_all_shortlinks() -> QuerySet:
        """
        Возвращает queryset всех коротких ссылок.
        
        Returns:
            QuerySet: Queryset всех коротких ссылок, отсортированный по id
        """
        return ShortLink.objects.all().order_by("id").select_related("post")
    
    @staticmethod
    def get_shortlink_by_code(code: str) -> Optional[ShortLink]:
        """
        Получает короткую ссылку по ее коду.
        
        Args:
            code (str): Код короткой ссылки
            
        Returns:
            ShortLink: Объект короткой ссылки или None, если ссылка не найдена
        """
        try:
            return ShortLink.objects.select_related("post").get(code=code)
        except ShortLink.DoesNotExist:
            logger.warning(f"[ShortLinkService] Попытка получить несуществующую короткую ссылку по коду: {code}")
            return None
        except Exception as e:
            logger.error(f"[ShortLinkService] Ошибка при получении короткой ссылки по коду {code}: {str(e)}")
            return None
    
    @staticmethod
    def get_redirect_url(shortlink: ShortLink) -> str:
        """
        Возвращает URL для редиректа по короткой ссылке.
        
        Args:
            shortlink (ShortLink): Объект короткой ссылки
            
        Returns:
            str: URL для редиректа
        """
        if not shortlink or not shortlink.post:
            logger.error("[ShortLinkService] Попытка получить URL редиректа для недействительной ссылки")
            return "/"
            
        return shortlink.get_redirect_url()
    
    @classmethod
    def generate_shortlink_for_post(cls, post: Post) -> Optional[ShortLink]:
        """
        Генерирует новую короткую ссылку для указанного поста.
        
        Args:
            post (Post): Пост, для которого нужно сгенерировать ссылку
            
        Returns:
            ShortLink: Созданная короткая ссылка или None в случае ошибки
        """
        if not post:
            logger.error("[ShortLinkService] Попытка создать короткую ссылку для None-поста")
            return None
            
        try:
            # Проверяем, есть ли уже короткая ссылка для этого поста
            existing_shortlink = ShortLink.objects.filter(post=post).first()
            if existing_shortlink:
                logger.info(f"[ShortLinkService] Для поста {post.id} уже существует короткая ссылка: {existing_shortlink.code}")
                return existing_shortlink
                
            # Создаем новую короткую ссылку
            shortlink = ShortLink(post=post)
            shortlink.save()
            
            logger.info(f"[ShortLinkService] Создана новая короткая ссылка {shortlink.code} для поста {post.id}")
            return shortlink
        except Exception as e:
            logger.error(f"[ShortLinkService] Ошибка при создании короткой ссылки для поста {post.id}: {str(e)}")
            return None
