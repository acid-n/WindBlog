"""
Представления для работы с тегами блога.

Этот модуль содержит представления и API-эндпоинты,
связанные с моделью Tag.
"""

import logging
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

from ..serializers import TagSerializer, PostSerializer
from ..services.tag_service import TagService

# Получаем логгер
logger = logging.getLogger(__name__)


class TagViewSet(viewsets.ModelViewSet):
    """API для тегов.
    
    Предоставляет стандартные CRUD-операции для тегов, а также
    дополнительные действия, такие как получение постов по тегу.
    """

    queryset = TagService.get_all_tags()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = "slug"

    def create(self, request, *args, **kwargs):
        """
        Создает новый тег.
        
        Проверяет, что имя тега уникально и формирует соответствующий slug.
        В случае коллизии slug-ов (например, если разные имена дают одинаковый slug)
        возвращает ошибку.
        """
        name = request.data.get('name')
        
        # Используем сервисный метод для создания тега
        tag, result = TagService.create_tag(name)
        
        # Обрабатываем результат
        if 'error' in result:
            return Response({'error': result['error']}, status=result['status'])
            
        if tag:
            serializer = self.get_serializer(tag)
            status_code = result.get('status', 201)
            response_data = serializer.data
            
            # Если тег уже существовал, добавляем соответствующую информацию
            if 'detail' in result:
                response_data.update({'detail': result['detail']})
                
            return Response(response_data, status=status_code)
            
        # Если что-то пошло не так и тег не был создан
        logger.error("[TagViewSet] Ошибка при создании тега: тег не создан, но нет сообщения об ошибке")
        return Response(
            {"error": "Неизвестная ошибка при создании тега"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    def get_queryset(self):
        """
        Возвращает отфильтрованный и отсортированный queryset тегов.
        
        Для списка тегов добавляет аннотацию с количеством опубликованных постов.
        """
        if self.action == "list":
            # Для списка используем метод с подсчетом постов
            return TagService.get_tags_with_post_count()
        # Для всех остальных действий используем стандартный метод
        return TagService.get_all_tags()

    @action(detail=True, methods=["get"], url_path="posts")
    def posts(self, request, slug=None):
        """
        Получить все опубликованные посты по тегу (slug).
        
        Возвращает список постов, отфильтрованный по указанному тегу.
        """
        tag = self.get_object()
        # Используем сервисный метод для получения постов по тегу
        posts = TagService.get_posts_by_tag(tag)
        serializer = PostSerializer(posts, many=True, context={"request": request})
        return Response(serializer.data)
