"""
Сервисный слой для работы с архивом блога.

Этот модуль содержит класс ArchiveService, который инкапсулирует
бизнес-логику, связанную с архивированием постов по датам.
"""

import datetime
import logging
from typing import List, Dict, Any, Optional
from django.db.models import Count, QuerySet
from django.db.models.functions import TruncDay, TruncMonth, TruncYear

from ..models import Post

# Получаем логгер
logger = logging.getLogger(__name__)


class ArchiveService:
    """
    Сервис для работы с архивом блога.
    
    Предоставляет методы для получения статистики постов по датам
    и выборки постов за определенные периоды времени.
    """
    
    @staticmethod
    def get_years_summary() -> List[Dict[str, Any]]:
        """
        Возвращает сводку постов по годам.
        
        Returns:
            List[Dict]: Список словарей с годом и количеством постов
        """
        # Группируем опубликованные посты по году, считаем количество
        summary = (
            Post.objects.filter(is_published=True)
            .annotate(year=TruncYear("first_published_at"))
            .values("year")
            .annotate(posts_count=Count("id"))
            .values("year", "posts_count")
            .order_by("-year")  # Сортируем по убыванию года
        )
        
        # Преобразуем год из datetime в integer
        result = []
        for item in summary:
            if item["year"]:  # Проверка, что год не None
                result.append({
                    "year": item["year"].year,
                    "posts_count": item["posts_count"]
                })
                
        return result
    
    @staticmethod
    def get_months_summary(year: int) -> List[Dict[str, Any]]:
        """
        Возвращает сводку постов по месяцам для указанного года.
        
        Args:
            year (int): Год для выборки
            
        Returns:
            List[Dict]: Список словарей с месяцем и количеством постов
        """
        summary = (
            Post.objects.filter(is_published=True, first_published_at__year=year)
            .annotate(month=TruncMonth("first_published_at"))
            .values("month")
            .annotate(posts_count=Count("id"))
            .values("month", "posts_count")
            .order_by("month")
        )
        
        result = []
        for item in summary:
            if item["month"]:
                result.append({
                    "month": item["month"].month,
                    "posts_count": item["posts_count"]
                })
                
        return result
    
    @staticmethod
    def get_days_summary(year: int, month: int) -> List[Dict[str, Any]]:
        """
        Возвращает сводку постов по дням для указанного года и месяца.
        
        Args:
            year (int): Год для выборки
            month (int): Месяц для выборки
            
        Returns:
            List[Dict]: Список словарей с днем и количеством постов
        """
        summary = (
            Post.objects.filter(
                is_published=True,
                first_published_at__year=year,
                first_published_at__month=month,
            )
            .annotate(day=TruncDay("first_published_at"))
            .values("day")
            .annotate(posts_count=Count("id"))
            .values("day", "posts_count")
            .order_by("day")
        )
        
        result = []
        for item in summary:
            if item["day"]:
                result.append({
                    "day": item["day"].day,
                    "posts_count": item["posts_count"]
                })
                
        return result
    
    @staticmethod
    def get_posts_by_date(year: int, month: Optional[int] = None, day: Optional[int] = None) -> QuerySet:
        """
        Возвращает посты за указанный период (год, месяц, день).
        
        Args:
            year (int): Год
            month (int, optional): Месяц
            day (int, optional): День
            
        Returns:
            QuerySet: Queryset постов за указанный период
        """
        filters = {"is_published": True, "first_published_at__year": year}
        
        if month is not None:
            filters["first_published_at__month"] = month
        
        if day is not None:
            filters["first_published_at__day"] = day
        
        try:
            # Проверка валидности даты
            if day and month:
                datetime.date(year, month, day)
                log_date = f"{year}-{month}-{day}"
            elif month:
                log_date = f"{year}-{month}"
            else:
                log_date = f"{year}"
                
            logger.info(f"[ArchiveService] Запрос постов за дату: {log_date}")
            
            posts = (
                Post.objects.filter(**filters)
                .order_by("-first_published_at")
                .prefetch_related("tags", "ratings", "shortlinks")
            )
            
            post_count = posts.count()
            logger.info(f"[ArchiveService] Найдено {post_count} постов за дату: {log_date}")
            
            return posts
        except ValueError:
            logger.warning(
                f"[ArchiveService] Некорректные параметры даты: год={year}, месяц={month}, день={day}"
            )
            return Post.objects.none()
        except Exception as e:
            logger.error(
                f"[ArchiveService] Ошибка при получении постов за дату {year}-{month}-{day}: {str(e)}",
                exc_info=True
            )
            raise
