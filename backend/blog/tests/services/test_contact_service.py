"""
Тесты для сервиса ContactService.

Этот модуль содержит тесты для проверки работы методов класса ContactService,
отвечающего за бизнес-логику, связанную с моделью ContactMessage.
"""

import pytest
from blog.models import ContactMessage
from blog.services.contact_service import ContactService


@pytest.mark.django_db
class TestContactService:
    """Тестирование методов сервиса ContactService."""

    def setup_method(self):
        """Настройка данных для каждого теста."""
        # Создаем несколько контактных сообщений для тестирования
        self.message1 = ContactMessage.objects.create(
            name="Иван Иванов",
            email="ivan@example.com",
            message="Это тестовое сообщение номер 1, достаточно длинное для прохождения валидации."
        )
        
        self.message2 = ContactMessage.objects.create(
            name="Петр Петров",
            email="petr@example.com",
            message="Это тестовое сообщение номер 2, также достаточно длинное для прохождения валидации."
        )
        
        self.message3 = ContactMessage.objects.create(
            name="Сергей Сергеев",
            email="sergey@example.com",
            message="Это тестовое сообщение номер 3, с дополнительными данными."
        )

    def test_validate_message_success(self):
        """Тест успешной валидации сообщения."""
        # Правильные данные для сообщения
        name = "Тест Тестов"
        email = "test@example.com"
        message = "Это тестовое сообщение, которое должно пройти валидацию."
        
        is_valid, error = ContactService.validate_message(name, email, message)
        
        # Проверяем, что валидация прошла успешно
        assert is_valid is True
        assert error is None

    def test_validate_message_empty_name(self):
        """Тест валидации сообщения с пустым именем."""
        name = ""
        email = "test@example.com"
        message = "Это тестовое сообщение."
        
        is_valid, error = ContactService.validate_message(name, email, message)
        
        # Проверяем, что валидация не прошла
        assert is_valid is False
        assert error is not None
        assert "Имя обязательно" in error.get("error", "")
        assert error.get("status") == 400

    def test_validate_message_invalid_email(self):
        """Тест валидации сообщения с некорректным email."""
        name = "Тест Тестов"
        email = "not_a_valid_email"
        message = "Это тестовое сообщение."
        
        is_valid, error = ContactService.validate_message(name, email, message)
        
        # Проверяем, что валидация не прошла
        assert is_valid is False
        assert error is not None
        assert "корректный email" in error.get("error", "")
        assert error.get("status") == 400

    def test_validate_message_short_message(self):
        """Тест валидации сообщения с коротким текстом."""
        name = "Тест Тестов"
        email = "test@example.com"
        message = "Коротко"  # Меньше 10 символов
        
        is_valid, error = ContactService.validate_message(name, email, message)
        
        # Проверяем, что валидация не прошла
        assert is_valid is False
        assert error is not None
        assert "не менее 10 символов" in error.get("error", "")
        assert error.get("status") == 400

    def test_create_message_success(self):
        """Тест успешного создания сообщения."""
        data = {
            "name": "Новый Пользователь",
            "email": "new@example.com",
            "message": "Это новое тестовое сообщение, которое должно быть создано."
        }
        
        message, error = ContactService.create_message(data)
        
        # Проверяем, что сообщение создано без ошибок
        assert error is None
        assert message is not None
        
        # Проверяем, что данные сохранены корректно
        assert message.name == "Новый Пользователь"
        assert message.email == "new@example.com"
        assert message.message == "Это новое тестовое сообщение, которое должно быть создано."
        
        # Проверяем, что сообщение сохранено в БД
        assert ContactMessage.objects.filter(email="new@example.com").exists()

    def test_create_message_with_validation_error(self):
        """Тест создания сообщения с ошибкой валидации."""
        # Данные с ошибкой (короткое сообщение)
        data = {
            "name": "Тест",
            "email": "test@example.com",
            "message": "Коротко"  # Слишком короткое
        }
        
        message, error = ContactService.create_message(data)
        
        # Проверяем, что сообщение не создано и есть ошибка
        assert message is None
        assert error is not None
        assert "не менее 10 символов" in error.get("error", "")
        assert error.get("status") == 400
        
        # Проверяем, что сообщение не сохранено в БД
        assert not ContactMessage.objects.filter(name="Тест", email="test@example.com").exists()

    def test_create_message_with_default_subject(self):
        """Тест создания сообщения без указания темы (должна быть создана автоматически)."""
        data = {
            "name": "Автотема",
            "email": "auto@example.com",
            "message": "Сообщение без явно указанной темы. Она должна быть сгенерирована автоматически."
        }
        
        message, error = ContactService.create_message(data)
        
        # Проверяем, что сообщение создано без ошибок
        assert error is None
        assert message is not None
        
        # Проверяем, что тема создана автоматически
        assert message.subject == "Сообщение от Автотема"

    def test_get_recent_messages(self):
        """Тест получения последних сообщений."""
        # Получаем последние сообщения
        messages = ContactService.get_recent_messages()
        
        # Проверяем, что возвращены все три сообщения
        assert len(messages) == 3
        
        # Проверяем сортировку (от новых к старым)
        # В нашем случае, сообщения созданы в обратном порядке (message3 - самое новое)
        assert messages[0] == self.message3
        assert messages[1] == self.message2
        assert messages[2] == self.message1
        
        # Проверяем ограничение количества
        limited_messages = ContactService.get_recent_messages(limit=2)
        assert len(limited_messages) == 2
        assert limited_messages[0] == self.message3
        assert limited_messages[1] == self.message2

    def test_mark_as_processed_success(self):
        """Тест успешной отметки сообщения как обработанного."""
        # Исходно сообщение 1 не обработано
        self.message1.is_processed = False
        self.message1.save()
        
        # Отмечаем сообщение как обработанное
        success, error = ContactService.mark_as_processed(self.message1.id)
        
        # Проверяем результат
        assert success is True
        assert error is None
        
        # Перезагружаем сообщение из БД и проверяем флаг
        self.message1.refresh_from_db()
        assert self.message1.is_processed is True

    def test_mark_as_processed_already_processed(self):
        """Тест отметки уже обработанного сообщения."""
        # Исходно сообщение 2 уже обработано
        self.message2.is_processed = True
        self.message2.save()
        
        # Отмечаем сообщение как обработанное снова
        success, error = ContactService.mark_as_processed(self.message2.id)
        
        # Проверяем результат (должно пройти успешно)
        assert success is True
        assert error is None
        
        # Перезагружаем сообщение из БД и проверяем флаг
        self.message2.refresh_from_db()
        assert self.message2.is_processed is True

    def test_mark_as_processed_nonexistent(self):
        """Тест отметки несуществующего сообщения."""
        # Используем несуществующий ID
        nonexistent_id = 999999
        
        # Отмечаем несуществующее сообщение
        success, error = ContactService.mark_as_processed(nonexistent_id)
        
        # Проверяем результат
        assert success is False
        assert error is not None
        assert "Сообщение не найдено" in error.get("error", "")
        assert error.get("status") == 404
