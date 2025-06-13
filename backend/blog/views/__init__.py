"""
Модуль представлений (views) блога.

Представления разделены на логические группы:
- post_views.py: представления для работы с постами
- tag_views.py: представления для работы с тегами
- rating_views.py: представления для работы с рейтингами постов
- archive_views.py: представления для работы с архивом
- media_views.py: представления для работы с медиа
- analytics_views.py: представления для работы с аналитикой
- contact_views.py: представления для работы с обратной связью
- shortlink_views.py: представления для работы с короткими ссылками

Все представления используют сервисный слой для выполнения бизнес-логики.
"""

# Импортируем все представления для доступности через blog.views
from .post_views import PostViewSet
from .tag_views import TagViewSet
from .rating_views import RatingViewSet
from .archive_views import (
    ArchiveYearSummaryView,
    ArchiveMonthSummaryView,
    ArchiveDaySummaryView,
    ArchiveDayPostsView,
)
from .shortlink_views import ShortLinkViewSet, ShortLinkRedirectView
from .media_views import ImageUploadView, custom_ckeditor_upload_file_view
from .analytics_views import AnalyticsEventViewSet
from .contact_views import ContactMessageViewSet
from .log_views import LoggingView

# Для совместимости с существующим кодом
__all__ = [
    'PostViewSet',
    'TagViewSet',
    'RatingViewSet',
    'ArchiveYearSummaryView',
    'ArchiveMonthSummaryView',
    'ArchiveDaySummaryView',
    'ArchiveDayPostsView',
    'ShortLinkViewSet',
    'ShortLinkRedirectView',
    'ImageUploadView',
    'custom_ckeditor_upload_file_view',
    'AnalyticsEventViewSet',
    'ContactMessageViewSet',
    'LoggingView',
]
