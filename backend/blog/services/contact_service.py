"""
Сервисный слой для работы с контактными сообщениями блога.

Этот модуль содержит класс ContactService, который инкапсулирует
бизнес-логику, связанную с моделью ContactMessage.
"""

import logging
import re
from typing import Dict, Any, Optional, Tuple

from django.db.models import QuerySet

from ..models import ContactMessage

# Получаем логгер
logger = logging.getLogger(__name__)


class ContactService:
    """
    Сервис для работы с контактными сообщениями блога.
    
    Предоставляет методы для создания и обработки сообщений обратной связи.
    """
    
    @staticmethod
    def validate_message(name: str, email: str, message: str) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Валидирует данные контактного сообщения.
        
        Args:
            name (str): Имя отправителя
            email (str): Email отправителя
            message (str): Текст сообщения
            
        Returns:
            Tuple[bool, Dict]: Кортеж с результатом валидации (True/False) и словарем с ошибкой (если есть)
        """
        # Проверка имени
        if not name or not name.strip():
            logger.warning("[ContactService] Попытка отправить сообщение без имени")
            return False, {"error": "Имя обязательно для заполнения", "status": 400}
        
        # Проверка email
        if not email or not email.strip():
            logger.warning("[ContactService] Попытка отправить сообщение без email")
            return False, {"error": "Email обязателен для заполнения", "status": 400}
        
        # Простая проверка формата email
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            logger.warning(f"[ContactService] Некорректный формат email: {email}")
            return False, {"error": "Пожалуйста, введите корректный email", "status": 400}
        
        # Проверка сообщения
        if not message or not message.strip():
            logger.warning("[ContactService] Попытка отправить пустое сообщение")
            return False, {"error": "Сообщение обязательно для заполнения", "status": 400}
        
        # Проверка длины сообщения
        if len(message.strip()) < 10:
            logger.warning(f"[ContactService] Слишком короткое сообщение: '{message}'")
            return False, {"error": "Сообщение должно содержать не менее 10 символов", "status": 400}
        
        return True, None
    
    @classmethod
    def create_message(cls, data: Dict[str, Any]) -> Tuple[Optional[ContactMessage], Optional[Dict[str, Any]]]:
        """
        Создает новое контактное сообщение с валидацией.
        
        Создает объект ContactMessage после проверки обязательных полей.
        Если поле 'subject' не указано, создает его автоматически в формате "Сообщение от {name}".
        Новые сообщения создаются со значением is_processed=False.
        
        Args:
            data (Dict): Данные сообщения (обязательные поля: 'name', 'email', 'message';
                       необязательные: 'subject')
            
        Returns:
            Tuple[ContactMessage, Dict]: Кортеж с созданным сообщением (или None при ошибке)
                                       и словарем с ошибкой (или None при успехе)
        """
        name = data.get("name", "").strip()
        email = data.get("email", "").strip()
        message = data.get("message", "").strip()
        
        # Валидация данных
        is_valid, error = cls.validate_message(name, email, message)
        if not is_valid:
            return None, error
        
        try:
            # Создаем сообщение со всеми полями
            contact_message = ContactMessage.objects.create(
                name=name,
                email=email,
                message=message,
                subject=data.get("subject", "").strip() or f"Сообщение от {name}",
                is_processed=False  # По умолчанию не обработано
            )
            
            logger.info(f"[ContactService] Создано новое контактное сообщение от {name}, ID: {contact_message.id}")
            return contact_message, None
        except Exception as e:
            logger.error(f"[ContactService] Ошибка при создании контактного сообщения: {str(e)}")
            return None, {"error": f"Ошибка при сохранении сообщения: {str(e)}", "status": 500}
    
    @staticmethod
    def get_recent_messages(limit: int = 10) -> QuerySet:
        """
        Возвращает последние контактные сообщения.
        
        Args:
            limit (int): Максимальное количество возвращаемых сообщений
            
        Returns:
            QuerySet: Queryset последних контактных сообщений
        """
        return ContactMessage.objects.all().order_by("-created_at")[:limit]
    
    @staticmethod
    def mark_as_processed(message_id: int) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Помечает сообщение как обработанное.
        
        Устанавливает поле is_processed=True для указанного сообщения.
        Этот метод может быть использован для отметки сообщений, которые были прочитаны или обработаны администратором.
        В случае успеха регистрирует событие в логах.
        
        Args:
            message_id (int): ID сообщения, которое нужно пометить как обработанное
            
        Returns:
            Tuple[bool, Dict]: Кортеж с результатом операции (True при успехе, False при ошибке)
                               и словарем с ошибкой (или None при успехе)
        """
        try:
            message = ContactMessage.objects.get(id=message_id)
            message.is_processed = True
            message.save(update_fields=["is_processed", "updated_at"])
            
            logger.info(f"[ContactService] Сообщение {message_id} помечено как обработанное")
            return True, None
        except ContactMessage.DoesNotExist:
            logger.warning(f"[ContactService] Попытка пометить несуществующее сообщение {message_id}")
            return False, {"error": "Сообщение не найдено", "status": 404}
        except Exception as e:
            logger.error(f"[ContactService] Ошибка при обработке сообщения {message_id}: {str(e)}")
            return False, {"error": f"Ошибка при обработке сообщения: {str(e)}", "status": 500}
