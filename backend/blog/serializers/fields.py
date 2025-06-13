"""
Кастомные поля для сериализаторов.

Этот модуль содержит специализированные поля для сериализаторов,
такие как поля для обработки изображений и других медиа-файлов.
"""

import logging
from rest_framework import serializers
from rest_framework.settings import api_settings

# Получаем логгер
logger = logging.getLogger(__name__)


class CustomImageField(serializers.ImageField):
    """
    Кастомное поле для обработки изображений.
    
    Обеспечивает корректную обработку как файловых, так и строковых значений.
    Поддерживает сценарии, когда фронтенд отправляет либо новый файл, либо
    существующий путь к файлу.
    """
    
    def to_internal_value(self, data):
        """
        Преобразует входные данные во внутреннее представление.
        
        Если данные - строка и не загруженный файл, возвращает строку как есть.
        В противном случае обрабатывает как файл.
        
        Args:
            data: Входные данные (строка или файл)
            
        Returns:
            str или файл: Внутреннее представление данных
        """
        # Если это строка (предположительно путь к файлу),
        # и это не файл из multipart-запроса (т.е. нет в self.context['request'].FILES)
        # или если self.context['request'].FILES пуст (на случай если его там вообще нет при JSON запросе)
        files = self.context["request"].FILES
        # Если 'data' это строка и ( (нет 'image' в files) или (есть 'image' в files и data не является ключом в files['image']) )
        # Это условие сложное. По сути, если data - это строка, и она не является именем загруженного файла, то это путь.

        if isinstance(data, str) and (
            not files or data not in files.get(self.field_name, [])
        ):
            if not data:
                return False

            return data

        try:
            processed_data = super().to_internal_value(data)
            return processed_data
        except serializers.ValidationError as e:
            # Попытка вернуть строку, если стандартный обработчик не смог принять ее как файл
            if isinstance(data, str) and any(
                "The submitted data was not a file." in str(detail)
                for detail_list in e.detail.values()
                for detail in detail_list
                if isinstance(detail, (str, serializers.ValidationError))
            ):  # Проверяем все сообщения об ошибках
                return data
            raise e

    def to_representation(self, value):
        """
        Преобразует внутреннее представление в выходные данные.
        
        Обрабатывает как объекты файлов, так и строковые пути.
        
        Args:
            value: Внутреннее представление (FieldFile или строка)
            
        Returns:
            str или None: URL изображения
        """
        # Эта часть отвечает за то, как данные отдаются фронтенду
        # value здесь - это экземпляр FieldFile или None

        if not value:
            return None

        use_url = getattr(self, "use_url", api_settings.UPLOADED_FILES_USE_URL)

        if use_url:
            try:
                url = value.url
                request = self.context.get("request", None)
                if request is not None:
                    return request.build_absolute_uri(url)
                return url
            except AttributeError:
                # Если value не имеет url (например, это строка), просто возвращаем value
                return value
        
        return value.name
