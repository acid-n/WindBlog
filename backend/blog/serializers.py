"""
Совместимость с предыдущей версией структуры сериализаторов.

Этот файл реэкспортирует сериализаторы из модульной структуры
для обеспечения обратной совместимости с существующим кодом.

Примечание: Рекомендуется использовать новую модульную структуру
из пакета serializers/ для новых разработок.
"""

# Импортируем все сериализаторы из новой модульной структуры
from .serializers.fields import CustomImageField
from .serializers.post_serializers import PostSerializer, RatingSerializer
from .serializers.tag_serializers import TagSerializer
from .serializers.shortlink_serializers import ShortLinkSerializer
from .serializers.archive_serializers import (
    YearArchiveSerializer,
    MonthArchiveSerializer,
    DayArchiveSerializer,
)
from .serializers.analytics_serializers import AnalyticsEventSerializer
from .serializers.contact_serializers import ContactMessageSerializer

# Перенаправляем все импорты для обратной совместимости
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
