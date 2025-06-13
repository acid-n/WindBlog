"""
Сервисный слой для работы с аналитикой блога.

Этот модуль содержит класс AnalyticsService, который инкапсулирует
бизнес-логику, связанную с моделью AnalyticsEvent.
"""

import logging
from typing import Dict, Any, Optional, Tuple
from django.db.models import QuerySet, Count
from django.utils import timezone
from datetime import datetime, timedelta

from ..models import AnalyticsEvent

# Получаем логгер
logger = logging.getLogger(__name__)


class AnalyticsService:
    """
    Сервис для работы с аналитикой блога.
    
    Предоставляет методы для работы с событиями аналитики,
    их агрегацией и анализом.
    """
    
    @staticmethod
    def create_event(event_data: Dict[str, Any]) -> Tuple[Optional[AnalyticsEvent], Optional[Dict[str, Any]]]:
        """
        Создает новое событие аналитики.
        
        Args:
            event_data (Dict): Данные события
            
        Returns:
            Tuple[AnalyticsEvent, Dict]: Кортеж с созданным событием и словарем с ошибкой (если есть)
        """
        try:
            # Базовая валидация данных
            path = event_data.get("path")
            if not path:
                logger.warning("[AnalyticsService] Попытка создать событие без указания пути страницы")
                return None, {"error": "Путь страницы обязателен", "status": 400}
                
            # Создаем событие, убедившись что ключи соответствуют полям модели
            valid_data = {
                'path': event_data.get('path'),
                'ip': event_data.get('ip'),
                'user_agent': event_data.get('user_agent'),
                'referrer': event_data.get('referrer')
            }
            
            # Удаляем None значения
            valid_data = {k: v for k, v in valid_data.items() if v is not None}
            
            event = AnalyticsEvent.objects.create(**valid_data)
            logger.info(f"[AnalyticsService] Создано новое событие для пути '{path}', ID: {event.id}")
            
            return event, None
        except Exception as e:
            logger.error(f"[AnalyticsService] Ошибка при создании события: {str(e)}")
            return None, {"error": f"Ошибка при создании события: {str(e)}", "status": 500}
    
    @staticmethod
    def get_view_stats(days: int = 30) -> Dict[str, Any]:
        """
        Возвращает статистику просмотров за указанный период.
        
        Args:
            days (int): Количество дней для анализа
            
        Returns:
            Dict: Словарь со статистикой просмотров
        """
        start_date = timezone.now() - timedelta(days=days)
        
        # Получаем все события за указанный период
        page_views = AnalyticsEvent.objects.filter(
            created_at__gte=start_date
        )
        
        # Считаем общее количество просмотров
        total_views = page_views.count()
        
        # Группируем по путям страниц
        page_stats = (
            page_views.values("path")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        
        # Группируем по дням
        daily_stats = (
            page_views.extra(select={'day': "date(created_at)"})
            .values('day')
            .annotate(count=Count('id'))
            .order_by('day')
        )
        
        return {
            "total_views": total_views,
            "page_stats": list(page_stats[:10]),  # Топ-10 страниц
            "daily_stats": list(daily_stats),
            "period_days": days
        }
    
    @staticmethod
    def get_events_by_path_prefix(path_prefix: str, limit: int = 100) -> QuerySet:
        """
        Возвращает события для страниц с указанным префиксом пути.
        
        Args:
            path_prefix (str): Префикс пути страницы (e.g., '/blog/' для страниц блога)
            limit (int): Максимальное количество возвращаемых событий
            
        Returns:
            QuerySet: Queryset событий для страниц с указанным префиксом
        """
        return (
            AnalyticsEvent.objects.filter(path__startswith=path_prefix)
            .order_by("-created_at")[:limit]
        )
        
    @staticmethod
    def get_latest_events(limit: int = 100) -> QuerySet:
        """
        Возвращает последние события аналитики.
        
        Args:
            limit (int): Максимальное количество возвращаемых событий
            
        Returns:
            QuerySet: Queryset последних событий аналитики
        """
        return AnalyticsEvent.objects.all().order_by("-created_at")[:limit]
