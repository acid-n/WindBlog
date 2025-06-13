"""
Представления для работы с архивом блога.

Этот модуль содержит представления и API-эндпоинты,
связанные с архивированием постов по датам (год, месяц, день).
"""

import datetime
import logging
from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response

from ..serializers import (
    PostSerializer,
    YearArchiveSerializer,
    MonthArchiveSerializer,
    DayArchiveSerializer,
)
from ..services.archive_service import ArchiveService

# Получаем логгер
logger = logging.getLogger(__name__)


class ArchiveYearSummaryView(APIView):
    """
    Возвращает сводку по годам: год и количество постов.
    
    Используется для навигации по архиву блога.
    """

    permission_classes = [permissions.AllowAny]  # Архив доступен всем

    def get(self, request, *args, **kwargs):
        """
        Формирует агрегированную статистику постов по годам.
        """
        # Используем сервисный метод для получения сводки по годам
        summary = ArchiveService.get_years_summary()

        serializer = YearArchiveSerializer(summary, many=True)
        return Response(serializer.data)


class ArchiveMonthSummaryView(APIView):
    """
    Возвращает сводку по месяцам для указанного года.
    
    Используется для навигации по архиву блога внутри выбранного года.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, year, *args, **kwargs):
        """
        Формирует агрегированную статистику постов по месяцам для указанного года.
        """
        # Используем сервисный метод для получения сводки по месяцам
        summary = ArchiveService.get_months_summary(int(year))
        serializer = MonthArchiveSerializer(summary, many=True)
        return Response(serializer.data)


class ArchiveDaySummaryView(APIView):
    """
    Возвращает сводку по дням для указанного года и месяца.
    
    Используется для навигации по архиву блога внутри выбранного месяца.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, year, month, *args, **kwargs):
        """
        Формирует агрегированную статистику постов по дням 
        для указанного года и месяца.
        """
        # Используем сервисный метод для получения сводки по дням
        summary = ArchiveService.get_days_summary(int(year), int(month))
        serializer = DayArchiveSerializer(summary, many=True)
        return Response(serializer.data)


class ArchiveDayPostsView(ListAPIView):
    """
    Возвращает пагинированный список постов за указанный день.
    
    Предоставляет список постов, опубликованных в конкретную дату.
    """

    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]
    # Пагинация будет использоваться из глобальных настроек REST_FRAMEWORK

    def get_queryset(self):
        """
        Формирует queryset постов для указанной даты (год, месяц, день).
        
        Включает обработку ошибок и логирование.
        """
        year = self.kwargs.get("year")
        month = self.kwargs.get("month")
        day = self.kwargs.get("day")

        if not all([year, month, day]):
            logger.warning(
                f"[Archive Log] Missing date components: year={year}, month={month}, day={day}"
            )
            # Сервисный метод вернёт пустой QuerySet при некорректных параметрах
            return ArchiveService.get_posts_by_date(0, 0, 0)

        try:
            # Проверяем, что параметры - числа
            year = int(year)
            month = int(month)
            day = int(day)
            
            # Используем сервисный метод для получения постов по дате
            return ArchiveService.get_posts_by_date(year, month, day)
        except ValueError:
            logger.warning(
                f"[Archive Log] ValueError: Invalid date components: year={year}, month={month}, day={day}"
            )
            return ArchiveService.get_posts_by_date(0, 0, 0)
        except Exception as e:
            logger.error(
                f"[Archive Log] Unexpected error in get_queryset for {year}-{month}-{day}: {type(e).__name__} - {str(e)}",
                exc_info=True,
            )
            raise
