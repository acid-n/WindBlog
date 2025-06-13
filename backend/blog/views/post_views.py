"""
Представления для работы с постами блога.

Этот модуль содержит все представления и API-эндпоинты,
связанные с моделью Post.
"""

import logging
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework import status

from ..serializers import PostSerializer
from ..services.post_service import PostService

# Получаем логгер
logger = logging.getLogger(__name__)


class PostViewSet(viewsets.ModelViewSet):
    """API для постов блога.
    
    Предоставляет стандартные CRUD-операции для постов, а также
    дополнительные действия, такие как поиск и фильтрация.
    """

    queryset = PostService.get_published_posts()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = "slug"
    pagination_class = PageNumberPagination

    def get_queryset(self):
        """
        Возвращает отфильтрованный и отсортированный queryset постов.
        
        Поддерживает фильтрацию по:
        - опубликованным постам (по умолчанию)
        - черновикам (если пользователь аутентифицирован)
        - постам для sitemap
        - поиску по ключевым словам
        """
        # Используем разные методы сервиса в зависимости от параметров запроса
        search_term = self.request.query_params.get("search", None)
        is_for_sitemap = (
            self.request.query_params.get("for_sitemap", "false").lower() == "true"
        )
        show_drafts = self.request.query_params.get("drafts", "false").lower() == "true"

        # Для операций с одним объектом нам нужны все посты (опубликованные и черновики)
        if self.action in ["retrieve", "update", "partial_update", "destroy"]:
            return PostService.get_published_posts().model.objects.all()
        
        # Для списка постов используем соответствующий метод сервиса
        if show_drafts and self.request.user.is_authenticated:
            # Черновики (только для авторизованных пользователей)
            return PostService.get_draft_posts()
        elif is_for_sitemap:
            # Посты для sitemap
            return PostService.get_posts_for_sitemap()
        elif search_term:
            # Поиск по ключевым словам
            return PostService.search_posts(search_term)
        else:
            # Обычный список опубликованных постов
            return PostService.get_published_posts()

    def paginate_queryset(self, queryset):
        """
        Отключает пагинацию для запросов к sitemap.
        
        Для остальных запросов использует стандартную пагинацию.
        """
        is_for_sitemap = (
            self.request.query_params.get("for_sitemap", "false").lower() == "true"
        )
        if is_for_sitemap:
            logger.debug("Disabling pagination for sitemap request.")
            return None  # Возвращаем None для отключения пагинации

        # Для обычных запросов используем пагинацию по умолчанию, вызывая метод суперкласса
        logger.debug("Using default pagination.")
        return super().paginate_queryset(queryset)

    @action(detail=True, methods=["get"], url_path="by-id")
    def get_by_id(self, request, slug=None):
        """
        Получить пост по ID (для коротких ссылок).
        
        Этот метод используется для получения поста по его числовому ID,
        что полезно для реализации коротких ссылок.
        """
        try:
            post_id = int(slug)
            # Используем сервисный метод для получения поста по ID
            post = PostService.get_post_by_id(post_id)

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
            logger.error(f"[PostViewSet.get_by_id] Ошибка: {str(e)}")
            return Response(
                {"error": "Внутренняя ошибка сервера", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
