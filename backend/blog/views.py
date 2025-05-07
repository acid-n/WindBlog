from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Count
from django.db.models.functions import TruncDay, TruncMonth, TruncYear
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
import datetime
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank, TrigramSimilarity
from django.db.models import F, Value
from django.conf import settings
import logging # Добавляем импорт logging
# Импортируем пагинатор
from rest_framework.pagination import PageNumberPagination

from .models import AnalyticsEvent, ContactMessage, Post, Rating, ShortLink, Tag
from .serializers import (
    AnalyticsEventSerializer,
    ContactMessageSerializer,
    PostSerializer,
    RatingSerializer,
    ShortLinkSerializer,
    TagSerializer,
    DayArchiveSerializer,
    MonthArchiveSerializer,
    YearArchiveSerializer,
)

# Получаем логгер
logger = logging.getLogger(__name__)

class PostViewSet(viewsets.ModelViewSet):
    """API для постов блога."""

    queryset = Post.objects.filter(is_published=True)
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = "slug"
    pagination_class = PageNumberPagination # Возвращаем стандартный пагинатор

    def get_queryset(self):
        queryset = super().get_queryset() # Получаем базовый queryset (is_published=True)
        search_term = self.request.query_params.get('search', None)
        is_for_sitemap = self.request.query_params.get('for_sitemap', 'false').lower() == 'true'

        if is_for_sitemap:
            # Для sitemap возвращаем все опубликованные и включенные в sitemap посты
            # Убираем специфичную для поиска сортировку по rank
            # Добавляем фильтр sitemap_include=True
            queryset = queryset.filter(sitemap_include=True)
            # Сортировка для sitemap не так важна, но можно оставить по дате
            queryset = queryset.order_by('-first_published_at') 
        elif search_term:
            # Логика поиска остается как была
            search_language = getattr(settings, 'SEARCH_LANGUAGE', 'russian')
            vector = SearchVector('title', 'slug', 'description', 'body_text_for_search', config=search_language)
            query = SearchQuery(search_term, config=search_language, search_type='websearch')
            queryset = queryset.annotate(
                rank=SearchRank(vector, query)
            ).filter(rank__gte=0.01).order_by('-rank', '-first_published_at')
        else:
             # Стандартная сортировка для списка постов (если не поиск и не sitemap)
             queryset = queryset.order_by('-first_published_at')

        return queryset
    
    def paginate_queryset(self, queryset):
        """Отключаем пагинацию, если запрошено для sitemap."""
        is_for_sitemap = self.request.query_params.get('for_sitemap', 'false').lower() == 'true'
        if is_for_sitemap:
            logger.debug("Disabling pagination for sitemap request.")
            return None # Возвращаем None для отключения пагинации
        
        # Для обычных запросов используем пагинацию по умолчанию, вызывая метод суперкласса
        logger.debug("Using default pagination.")
        return super().paginate_queryset(queryset)

    @action(detail=True, methods=["get"], url_path="by-id")
    def get_by_id(self, request, slug=None):
        """Получить пост по ID (для коротких ссылок)."""
        try:
            post_id = int(slug)
            post = Post.objects.filter(id=post_id, is_published=True).first()
            
            if not post:
                return Response(
                    {"error": "Пост не найден", "details": f"ID: {post_id}"},
                    status=status.HTTP_404_NOT_FOUND,
                )
                
            serializer = self.get_serializer(post)
            return Response(serializer.data)
        except (ValueError, TypeError) as e:
            return Response(
                {"error": "Неверный ID поста", "details": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": "Внутренняя ошибка сервера", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class TagViewSet(viewsets.ModelViewSet):
    """API для тегов."""

    queryset = Tag.objects.all().order_by('name')
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = "slug"

    @action(detail=True, methods=["get"], url_path="posts")
    def posts(self, request, slug=None):
        """Получить все опубликованные посты по тегу (slug)."""
        tag = self.get_object()
        posts = tag.posts.filter(is_published=True).order_by("-first_published_at")
        serializer = PostSerializer(posts, many=True, context={"request": request})
        return Response(serializer.data)


class RatingViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """API для создания рейтинга поста."""

    queryset = Rating.objects.all()
    serializer_class = RatingSerializer
    permission_classes = [permissions.AllowAny]


class ShortLinkViewSet(viewsets.ReadOnlyModelViewSet):
    """API для коротких ссылок."""

    queryset = ShortLink.objects.all().order_by('id')
    serializer_class = ShortLinkSerializer
    permission_classes = [permissions.AllowAny]


class AnalyticsEventViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """API для событий аналитики (только создание)."""

    queryset = AnalyticsEvent.objects.all()
    serializer_class = AnalyticsEventSerializer
    permission_classes = [permissions.AllowAny]


class ContactMessageViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """API для сообщений обратной связи (только создание)."""

    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]


# --- API Архива --- #

class ArchiveYearSummaryView(APIView):
    """Возвращает сводку по годам: год и количество постов."""
    permission_classes = [permissions.AllowAny]  # Архив доступен всем

    def get(self, request, *args, **kwargs):
        # Группируем опубликованные посты по году, считаем количество
        summary = (
            Post.objects.filter(is_published=True)
            .annotate(year=TruncYear("first_published_at"))
            .values("year")
            .annotate(posts_count=Count("id"))
            .values("year", "posts_count")
            .order_by("-year") # Сортируем по убыванию года
        )
        # Преобразуем год из datetime в integer
        for item in summary:
            if item['year']: # Проверка, что год не None
                 item['year'] = item['year'].year
            else:
                 # Обработка случая, если first_published_at = None
                 item['year'] = 0
                 item['posts_count'] = 0
        # Убираем записи с None/0 годом, если они появились
        summary = [item for item in summary if item['year'] != 0]
        
        serializer = YearArchiveSerializer(summary, many=True)
        return Response(serializer.data)

class ArchiveMonthSummaryView(APIView):
    """Возвращает сводку по месяцам для указанного года."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, year, *args, **kwargs):
        summary = (
            Post.objects.filter(is_published=True, first_published_at__year=year)
            .annotate(month=TruncMonth("first_published_at"))
            .values("month")
            .annotate(posts_count=Count("id"))
            .values("month", "posts_count")
            .order_by("month")
        )
        for item in summary:
            if item['month']:
                item['month'] = item['month'].month
            else:
                item['month'] = 0
                item['posts_count'] = 0
        summary = [item for item in summary if item['month'] != 0]        
        serializer = MonthArchiveSerializer(summary, many=True)
        return Response(serializer.data)

class ArchiveDaySummaryView(APIView):
    """Возвращает сводку по дням для указанного года и месяца."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, year, month, *args, **kwargs):
        summary = (
            Post.objects.filter(is_published=True, first_published_at__year=year, first_published_at__month=month)
            .annotate(day=TruncDay("first_published_at"))
            .values("day")
            .annotate(posts_count=Count("id"))
            .values("day", "posts_count")
            .order_by("day")
        )
        for item in summary:
            if item['day']:
                item['day'] = item['day'].day
            else:
                item['day'] = 0
                item['posts_count'] = 0
        summary = [item for item in summary if item['day'] != 0]
        serializer = DayArchiveSerializer(summary, many=True)
        return Response(serializer.data)

class ArchiveDayPostsView(ListAPIView):
    """Возвращает пагинированный список постов за указанный день."""
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]
    # Пагинация будет использоваться из глобальных настроек REST_FRAMEWORK

    def get_queryset(self):
        year = self.kwargs.get("year")
        month = self.kwargs.get("month")
        day = self.kwargs.get("day")

        if not all([year, month, day]):
            logger.warning(f"[Archive Log] Missing date components: year={year}, month={month}, day={day}")
            return Post.objects.none()

        try:
            target_date = datetime.date(year, month, day)
            logger.info(f"[Archive Log] Attempting to fetch posts for date: {target_date}")

            queryset = Post.objects.filter(
                is_published=True,
                first_published_at__date=target_date
            ).order_by("-first_published_at")
            
            logger.info(f"[Archive Log] Found {queryset.count()} posts for date {target_date} before pagination.")
            
            return queryset
        except ValueError:
            logger.warning(f"[Archive Log] ValueError: Invalid date components: year={year}, month={month}, day={day}")
            return Post.objects.none()
        except Exception as e:
            # import traceback # traceback можно убрать, если логгируем исключение полностью
            logger.error(f"[Archive Log] Unexpected error in get_queryset for {year}-{month}-{day}: {type(e).__name__} - {str(e)}", exc_info=True)
            # traceback.print_exc() # Заменено на exc_info=True в логгере
            raise
