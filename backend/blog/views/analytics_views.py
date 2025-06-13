"""
Представления для работы с аналитикой блога.

Этот модуль содержит представления и API-эндпоинты,
связанные с моделью AnalyticsEvent и сбором статистики.
"""

import logging
from rest_framework import permissions, mixins, viewsets
from rest_framework.response import Response
from rest_framework import status

from ..serializers import AnalyticsEventSerializer
from ..services.analytics_service import AnalyticsService

# Получаем логгер
logger = logging.getLogger(__name__)


class AnalyticsEventViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """
    API для событий аналитики (только создание).
    
    Предоставляет эндпоинты для создания и хранения событий аналитики,
    таких как просмотры страниц, действия пользователей и т.д.
    
    Примечания:
        - Доступно только создание событий (без просмотра, обновления или удаления)
        - События доступны для анонимных пользователей
    """

    queryset = AnalyticsService.get_latest_events()
    serializer_class = AnalyticsEventSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        """
        Создает новое событие аналитики.
        
        Использует сервисный метод для создания и валидации события.
        
        Args:
            request: HTTP-запрос с данными события
            
        Returns:
            Response: JSON-ответ с результатом создания
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Используем сервисный метод для создания события
        event, error = AnalyticsService.create_event(serializer.validated_data)
        
        if error:
            logger.error(f"[AnalyticsEventViewSet] Ошибка при создании события: {error.get('error')}")
            return Response(
                {"error": error.get("error")},
                status=error.get("status", status.HTTP_500_INTERNAL_SERVER_ERROR)
            )
            
        # Если создание прошло успешно
        serializer = self.get_serializer(event)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
