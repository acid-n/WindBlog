"""
Представления для работы с формами обратной связи блога.

Этот модуль содержит представления и API-эндпоинты,
связанные с моделью ContactMessage.
"""

import logging
from rest_framework import permissions, mixins, viewsets
from rest_framework.response import Response
from rest_framework import status

from ..serializers import ContactMessageSerializer
from ..services.contact_service import ContactService

# Получаем логгер
logger = logging.getLogger(__name__)


class ContactMessageViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """
    API для сообщений обратной связи (только создание).
    
    Предоставляет эндпоинты для создания и хранения сообщений от пользователей,
    отправленных через форму обратной связи.
    
    Примечания:
        - Доступно только создание сообщений (без просмотра, обновления или удаления)
        - Эндпоинт доступен для анонимных пользователей
    """

    queryset = ContactService.get_recent_messages()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        """
        Создает новое сообщение обратной связи с валидацией.
        
        Использует сервисный слой для валидации и создания сообщения.
        
        Args:
            request: HTTP-запрос с данными формы
            
        Returns:
            Response: JSON-ответ с результатом создания
        """
        # Собираем данные из запроса
        data = {
            "name": request.data.get("name", "").strip(),
            "email": request.data.get("email", "").strip(),
            "message": request.data.get("message", "").strip(),
            "subject": request.data.get("subject", "").strip(),
            "phone": request.data.get("phone", "").strip(),
        }
        
        # Добавляем IP-адрес, если он доступен
        if 'HTTP_X_FORWARDED_FOR' in request.META:
            data["ip_address"] = request.META.get('HTTP_X_FORWARDED_FOR').split(',')[0].strip()
        elif 'REMOTE_ADDR' in request.META:
            data["ip_address"] = request.META.get('REMOTE_ADDR')
        
        # Используем сервисный метод для создания сообщения
        contact_message, error = ContactService.create_message(data)
        
        # Обрабатываем результат
        if error:
            logger.warning(f"[ContactMessageViewSet] Ошибка валидации формы: {error.get('error')}")
            return Response(
                {"error": error.get("error")},
                status=error.get("status", status.HTTP_400_BAD_REQUEST),
            )
        
        # Если сообщение успешно создано
        logger.info(f"[ContactMessageViewSet] Создано новое сообщение от {data['name']}, ID: {contact_message.id}")
        serializer = self.get_serializer(contact_message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
