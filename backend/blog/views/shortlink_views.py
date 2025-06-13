"""
Представления для работы с короткими ссылками блога.

Этот модуль содержит представления и API-эндпоинты,
связанные с моделью ShortLink.
"""

import logging
from django.http import Http404, HttpResponseRedirect
from django.views import View
from rest_framework import permissions, viewsets

from ..serializers import ShortLinkSerializer
from ..services.shortlink_service import ShortLinkService

# Получаем логгер
logger = logging.getLogger(__name__)


class ShortLinkViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API для коротких ссылок.
    
    Предоставляет доступ только для чтения к коротким ссылкам.
    Создание ссылок происходит автоматически через сигналы при создании поста.
    """

    queryset = ShortLinkService.get_all_shortlinks()
    serializer_class = ShortLinkSerializer
    permission_classes = [permissions.AllowAny]


class ShortLinkRedirectView(View):
    """
    Редирект по короткой ссылке на пост.
    
    Выполняет перенаправление пользователя с короткой ссылки 
    на полный URL поста.
    """

    def get(self, request, code):
        """
        Обрабатывает GET-запрос для перенаправления.
        
        Args:
            request: HTTP-запрос
            code: Уникальный код короткой ссылки
            
        Returns:
            HttpResponseRedirect: Перенаправление на URL поста
            
        Raises:
            Http404: Если ссылка с указанным кодом не найдена
        """
        # Используем сервисный метод для получения короткой ссылки по коду
        shortlink = ShortLinkService.get_shortlink_by_code(code)
        
        if not shortlink:
            logger.warning(f"[ShortLinkRedirectView] Попытка перейти по несуществующей короткой ссылке: {code}")
            raise Http404("Короткая ссылка не найдена")
            
        # Получаем URL для редиректа через сервис
        redirect_url = ShortLinkService.get_redirect_url(shortlink)
        return HttpResponseRedirect(redirect_url)
