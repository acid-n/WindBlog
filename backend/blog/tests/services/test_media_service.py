"""
Тесты для сервиса MediaService.

Этот модуль содержит тесты для проверки работы методов класса MediaService,
отвечающего за бизнес-логику, связанную с загрузкой и обработкой изображений.
"""

import os
import pytest
from io import BytesIO
from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image as PilImage
from blog.services.media_service import MediaService


# Функция для создания тестового WEBP изображения
def create_test_webp_image(filename="test.webp", size=(100, 100), color="green"):
    """Создает тестовое WEBP изображение для тестирования загрузки."""
    img = PilImage.new("RGB", size, color=color)
    buffer = BytesIO()
    img.save(buffer, format="WEBP")
    buffer.seek(0)
    return SimpleUploadedFile(filename, buffer.read(), content_type="image/webp")


# Функция для создания тестового JPEG изображения (неподдерживаемый формат)
def create_test_jpeg_image(filename="test.jpg", size=(100, 100), color="red"):
    """Создает тестовое JPEG изображение для тестирования валидации."""
    img = PilImage.new("RGB", size, color=color)
    buffer = BytesIO()
    img.save(buffer, format="JPEG")
    buffer.seek(0)
    return SimpleUploadedFile(filename, buffer.read(), content_type="image/jpeg")


@pytest.mark.django_db
class TestMediaService:
    """Тестирование методов сервиса MediaService."""

    def setup_method(self):
        """Настройка для каждого теста."""
        # Создаем тестовую директорию для загрузок (если нужно)
        media_root = settings.MEDIA_ROOT
        self.uploads_dir = os.path.join(media_root, MediaService.UPLOADS_DIR)
        os.makedirs(self.uploads_dir, exist_ok=True)
        
        # Список файлов для очистки после теста
        self.files_to_cleanup = []

    def teardown_method(self):
        """Очистка после каждого теста."""
        # Удаляем временные файлы, созданные в тесте
        for file_path in self.files_to_cleanup:
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except OSError as e:
                    print(f"Ошибка при удалении файла {file_path}: {e}")

    def test_save_uploaded_image_success(self):
        """Тест успешного сохранения загруженного WEBP изображения."""
        # Создаем тестовое WEBP изображение
        webp_image = create_test_webp_image(filename="test_upload.webp")
        
        # Сохраняем изображение
        saved_path, error = MediaService.save_uploaded_image(webp_image)
        
        # Проверяем, что нет ошибок
        assert error is None
        assert saved_path is not None
        
        # Проверяем, что файл существует в файловой системе
        full_path = os.path.join(settings.MEDIA_ROOT, saved_path)
        assert os.path.exists(full_path)
        
        # Добавляем файл для очистки
        self.files_to_cleanup.append(full_path)
        
        # Проверяем, что путь правильно отформатирован
        assert MediaService.UPLOADS_DIR in saved_path
        assert saved_path.endswith(".webp")

    def test_save_uploaded_image_invalid_extension(self):
        """Тест отклонения изображения с неподдерживаемым расширением."""
        # Создаем тестовое JPEG изображение (неподдерживаемый формат)
        jpeg_image = create_test_jpeg_image(filename="test_invalid.jpg")
        
        # Пытаемся сохранить изображение
        saved_path, error = MediaService.save_uploaded_image(jpeg_image)
        
        # Проверяем, что есть ошибка
        assert error is not None
        assert saved_path is None
        assert "Неподдерживаемый формат файла" in error.get("error", "")
        assert error.get("status") == 400

    def test_save_uploaded_image_none(self):
        """Тест обработки None-файла."""
        # Пытаемся сохранить None вместо файла
        saved_path, error = MediaService.save_uploaded_image(None)
        
        # Проверяем, что есть ошибка
        assert error is not None
        assert saved_path is None
        assert "Файл не предоставлен" in error.get("error", "")
        assert error.get("status") == 400

    def test_save_uploaded_image_special_chars(self):
        """Тест сохранения файла с спецсимволами в имени."""
        # Создаем тестовое WEBP изображение с спецсимволами в имени
        webp_image = create_test_webp_image(filename="test!@#$%^&*.webp")
        
        # Сохраняем изображение
        saved_path, error = MediaService.save_uploaded_image(webp_image)
        
        # Проверяем, что нет ошибок
        assert error is None
        assert saved_path is not None
        
        # Проверяем, что спецсимволы были удалены из имени файла
        assert "!@#$%^&*" not in saved_path
        
        # Проверяем, что файл существует
        full_path = os.path.join(settings.MEDIA_ROOT, saved_path)
        assert os.path.exists(full_path)
        
        # Добавляем файл для очистки
        self.files_to_cleanup.append(full_path)

    def test_save_ckeditor_image_success(self):
        """Тест успешного сохранения изображения через CKEditor."""
        # Создаем тестовое WEBP изображение
        webp_image = create_test_webp_image(filename="ckeditor_test.webp")
        
        # Сохраняем изображение через CKEditor
        result, error = MediaService.save_ckeditor_image(webp_image)
        
        # Проверяем, что нет ошибок
        assert error is None
        assert result is not None
        
        # Проверяем формат ответа для CKEditor
        assert "url" in result
        assert "uploaded" in result
        assert "fileName" in result
        assert result["uploaded"] == 1
        
        # Проверяем, что URL содержит настройки MEDIA_URL
        media_url = settings.MEDIA_URL.rstrip("/")
        assert result["url"].startswith(media_url)
        
        # Извлекаем путь и проверяем, что файл существует
        file_path = result["url"].replace(media_url, "").lstrip("/")
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)
        assert os.path.exists(full_path)
        
        # Добавляем файл для очистки
        self.files_to_cleanup.append(full_path)

    def test_save_ckeditor_image_none(self):
        """Тест обработки None-файла в CKEditor."""
        # Пытаемся сохранить None вместо файла
        result, error = MediaService.save_ckeditor_image(None)
        
        # Проверяем, что есть ошибка
        assert error is not None
        assert result is None
        assert "error" in error
        assert "message" in error["error"]
        assert "Файл не предоставлен" in error["error"]["message"]
