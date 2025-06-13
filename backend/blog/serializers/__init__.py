"""
Модуль сериализаторов блога.

Этот пакет содержит сериализаторы для преобразования
моделей Django в JSON и обратно для использования в API.

Структура модуля:
- fields.py: Кастомные поля для сериализаторов
- post_serializers.py: Сериализаторы для постов и рейтингов
- tag_serializers.py: Сериализаторы для тегов
- shortlink_serializers.py: Сериализаторы для коротких ссылок
- archive_serializers.py: Сериализаторы для архива
- analytics_serializers.py: Сериализаторы для аналитики
- contact_serializers.py: Сериализаторы для сообщений обратной связи
"""

# Импортируем все сериализаторы для использования в других модулях
from .fields import CustomImageField
from .post_serializers import PostSerializer, RatingSerializer
from .tag_serializers import TagSerializer
from .shortlink_serializers import ShortLinkSerializer
from .archive_serializers import (
    YearArchiveSerializer,
    MonthArchiveSerializer,
    DayArchiveSerializer,
)
from .analytics_serializers import AnalyticsEventSerializer
from .contact_serializers import ContactMessageSerializer

# Для совместимости с существующим кодом
__all__ = [
    'CustomImageField',
    'PostSerializer',
    'RatingSerializer',
    'TagSerializer',
    'ShortLinkSerializer',
    'YearArchiveSerializer',
    'MonthArchiveSerializer',
    'DayArchiveSerializer',
    'AnalyticsEventSerializer',
    'ContactMessageSerializer',
]
