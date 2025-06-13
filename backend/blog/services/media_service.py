"""
Сервисный слой для работы с медиа-файлами блога.

Этот модуль содержит класс MediaService, который инкапсулирует
бизнес-логику, связанную с загрузкой и обработкой изображений.
"""

import os
import uuid
import logging
import re
from typing import Dict, Any, Optional, Tuple

from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import UploadedFile

# Получаем логгер
logger = logging.getLogger(__name__)


class MediaService:
    """
    Сервис для работы с медиа-файлами блога.
    
    Предоставляет методы для загрузки и обработки изображений и других медиа-файлов.
    """
    
    # Константы для настройки сервиса
    UPLOADS_DIR = "posts/uploads"
    ALLOWED_EXTENSIONS = [".webp"]
    
    @classmethod
    def save_uploaded_image(cls, uploaded_file: UploadedFile) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
        """
        Сохраняет загруженное изображение в медиа-директорию.
        
        Args:
            uploaded_file (UploadedFile): Загруженный файл
            
        Returns:
            Tuple[str, Dict]: Кортеж с относительным путем к сохраненному файлу и словарем с ошибкой (если есть)
        """
        if not uploaded_file:
            logger.error("[MediaService] Попытка сохранить пустой файл")
            return None, {"error": "Файл не предоставлен", "status": 400}
            
        # Проверка расширения файла
        file_extension = os.path.splitext(uploaded_file.name.lower())[1]
        if file_extension not in cls.ALLOWED_EXTENSIONS:
            logger.error(f"[MediaService] Неподдерживаемое расширение файла: {file_extension}")
            return None, {
                "error": f"Неподдерживаемый формат файла. Разрешены только: {', '.join(cls.ALLOWED_EXTENSIONS)}",
                "status": 400
            }
            
        # Проверка MEDIA_ROOT и целевой папки
        media_root_path = str(settings.MEDIA_ROOT)
        full_target_dir = os.path.join(media_root_path, cls.UPLOADS_DIR)
        
        # Проверяем, что директория для загрузок существует
        try:
            os.makedirs(full_target_dir, exist_ok=True)
            logger.info(f"[MediaService] Создана/проверена директория: {full_target_dir}")
        except Exception as e:
            logger.error(f"[MediaService] Ошибка при создании директории для загрузок: {str(e)}")
            return None, {
                "error": "Ошибка сервера при подготовке директории для загрузок",
                "details": str(e),
                "status": 500
            }
            
        # Генерируем уникальное имя файла
        original_name_without_ext = os.path.splitext(uploaded_file.name)[0]
        # Очищаем имя от спецсимволов
        safe_original_name = re.sub(r"[^a-zA-Z0-9_-]", "", original_name_without_ext)
        
        # Если имя слишком короткое или пустое после очистки, используем стандартное
        if len(safe_original_name) < 3:
            safe_original_name = "image"
            
        unique_id = uuid.uuid4().hex[:8]  # Короткий уникальный ID
        # Собираем имя файла: очищенное_имя-уникальный_id.webp
        filename = f"{safe_original_name}-{unique_id}.webp"
        
        # Путь внутри MEDIA_ROOT, куда будет сохранен файл
        save_path_within_media_root = os.path.join(cls.UPLOADS_DIR, filename)
        # Убедимся, что нет обратных слешей, если работаем на Windows
        save_path_within_media_root = save_path_within_media_root.replace("\\", "/")
        
        logger.info(f"[MediaService] Сохранение файла как: {save_path_within_media_root}")
        
        try:
            # Сохраняем файл
            saved_file_name_from_storage = default_storage.save(
                save_path_within_media_root, uploaded_file
            )
            logger.info(f"[MediaService] Файл успешно сохранен: {saved_file_name_from_storage}")
            
            # Путь, который будет возвращен клиенту и сохранен в модели
            path_for_model_and_client = saved_file_name_from_storage
            
            # Убедимся, что это корректный относительный путь без начального MEDIA_ROOT
            if path_for_model_and_client.startswith(media_root_path):
                logger.warning(f"[MediaService] Путь '{path_for_model_and_client}' содержит MEDIA_ROOT. Удаляем его.")
                path_for_model_and_client = os.path.relpath(path_for_model_and_client, media_root_path)
                path_for_model_and_client = path_for_model_and_client.replace("\\", "/")
                
            return path_for_model_and_client, None
        except Exception as e:
            logger.error(f"[MediaService] Ошибка при сохранении файла: {str(e)}", exc_info=True)
            return None, {
                "error": "Ошибка при сохранении файла на сервере.",
                "details": str(e),
                "status": 500
            }
    
    @classmethod
    def save_ckeditor_image(cls, uploaded_file: UploadedFile) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
        """
        Сохраняет изображение, загруженное через CKEditor.
        
        Args:
            uploaded_file (UploadedFile): Загруженный файл
            
        Returns:
            Tuple[Dict, Dict]: Кортеж с результатом (успех) и словарем с ошибкой (если есть)
        """
        if not uploaded_file:
            logger.error("[MediaService] CKEditor: попытка сохранить пустой файл")
            return None, {"error": {"message": "Файл не предоставлен"}}
            
        # Сохраняем файл, используя тот же метод, что и для обычных изображений
        saved_path, error = cls.save_uploaded_image(uploaded_file)
        
        if error:
            logger.error(f"[MediaService] CKEditor: ошибка при сохранении файла: {error}")
            return None, {"error": {"message": error.get("error", "Ошибка при сохранении файла")}}
            
        # Формируем URL для CKEditor
        media_url = settings.MEDIA_URL.rstrip("/")
        file_url = f"{media_url}/{saved_path}"
        
        return {
            "url": file_url,
            "uploaded": 1,
            "fileName": os.path.basename(saved_path)
        }, None
