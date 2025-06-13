"""
Представления для работы с медиа-файлами блога.

Этот модуль содержит представления и API-эндпоинты,
связанные с загрузкой и обработкой изображений и других медиа-файлов.
"""

import logging
from django.http import JsonResponse
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from ..services.media_service import MediaService

# Получаем логгер
logger = logging.getLogger(__name__)


class ImageUploadView(APIView):
    """
    Принимает POST запрос с файлом изображения ('upload'),
    сохраняет его в MEDIA_ROOT/posts/uploads/
    и возвращает относительный URL сохраненного файла.
    
    Предполагается, что изображение уже конвертировано в WEBP на фронтенде.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """
        Обрабатывает загрузку изображения.
        
        Args:
            request: HTTP-запрос с файлом изображения
            
        Returns:
            Response: JSON-ответ с URL загруженного файла
        """
        logger.info("[ImageUploadView] Получен POST-запрос на загрузку изображения")

        # Проверяем наличие файла в запросе
        if "upload" not in request.FILES:
            logger.error("[ImageUploadView] Нет поля 'upload' в request.FILES")
            return Response(
                {"error": "Файл не загружен. Используйте поле 'upload'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        uploaded_file = request.FILES["upload"]
        logger.info(
            f"[ImageUploadView] Получен файл '{uploaded_file.name}' размером {uploaded_file.size} байт и типом {uploaded_file.content_type}"
        )

        # Используем сервисный метод для сохранения изображения
        saved_path, error = MediaService.save_uploaded_image(uploaded_file)
        
        # Обрабатываем результат
        if error:
            logger.error(f"[ImageUploadView] Ошибка при сохранении файла: {error.get('error')}")
            return Response(
                {"error": error.get("error"), "details": error.get("details", "")},
                status=error.get("status", status.HTTP_500_INTERNAL_SERVER_ERROR)
            )
        
        # Если сохранение прошло успешно
        logger.info(f"[ImageUploadView] Файл успешно сохранен: {saved_path}")
        return Response({"url": saved_path}, status=status.HTTP_201_CREATED)


def custom_ckeditor_upload_file_view(request):
    """
    Обработчик загрузки файлов для CKEditor.
    
    Заменяет стандартный обработчик CKEditor для поддержки WEBP.
    """
    # Права доступа и @require_POST проверяются внутри ckeditor_original_upload_file
    # Мы могли бы переопределить или добавить свою проверку здесь, если нужно

    if request.method == "POST":
        uploaded_file = request.FILES.get("upload")
        if not uploaded_file:
            logger.error("[Custom CKEditor Upload] Файл не был загружен")
            return JsonResponse({"error": {"message": "Файл не загружен"}}, status=400)

        logger.info(
            f"[Custom CKEditor Upload] Получен файл '{uploaded_file.name}' размером {uploaded_file.size} байт"
        )

        # Используем сервисный метод для сохранения изображения CKEditor
        result, error = MediaService.save_ckeditor_image(uploaded_file)

        if error:
            logger.error(f"[Custom CKEditor Upload] Ошибка при сохранении изображения: {error}")
            return JsonResponse(error, status=500)
        
        # Возвращаем успешный результат
        logger.info(f"[Custom CKEditor Upload] Файл успешно сохранен, URL: {result['url']}")
        return JsonResponse(result)
    
    # Для всех остальных методов
    return JsonResponse({"error": {"message": "Метод не разрешен"}}, status=405)
