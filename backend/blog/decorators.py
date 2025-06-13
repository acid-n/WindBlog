"""
Декораторы для API-представлений.

Модуль содержит различные декораторы для API-представлений, включая ограничение частоты запросов.
"""

import functools
import logging
from typing import Any, Callable, Dict, Optional, Type, Union

from django.http import HttpRequest, HttpResponse
from django.utils.decorators import method_decorator
from ratelimit.decorators import ratelimit
from ratelimit.exceptions import Ratelimited
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


def api_rate_limit(
    group: str = "api",
    key: str = "ip",
    rate: Optional[str] = None,
    method: Union[str, list] = "ALL",
    block: bool = True,
) -> Callable:
    """
    Декоратор для ограничения частоты запросов к API-представлениям.

    Args:
        group: Группа ограничений, связанная с настройками RATELIMIT_RATE_GROUPS
        key: Ключ для идентификации пользователя ('ip', 'user', 'user_or_ip')
        rate: Ограничение частоты, например "5/m", "100/h". Если None, используется значение из группы
        method: HTTP-метод или список методов, к которым применяется ограничение ('GET', 'POST', и т.д. или 'ALL')
        block: Блокировать запрос, если превышен лимит, или просто логировать

    Returns:
        Декорированная функция или метод класса
    """
    def decorator(view_func):
        @functools.wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            try:
                return view_func(request, *args, **kwargs)
            except Ratelimited:
                logger.warning(
                    f"Rate limit exceeded: {key}={request.META.get('REMOTE_ADDR')} for {group}"
                )
                return Response(
                    {"detail": "Превышен лимит запросов. Пожалуйста, попробуйте позже."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
        
        # Применяем декоратор ratelimit от django-ratelimit
        return ratelimit(group=group, key=key, rate=rate, method=method, block=block)(_wrapped_view)
    
    return decorator


def api_view_rate_limit(**kwargs):
    """
    Декоратор для ограничения частоты запросов к классам APIView.
    
    Используется для декорирования методов класса (get, post, и т.д.).
    
    Args:
        **kwargs: Аргументы, передаваемые в функцию api_rate_limit
        
    Returns:
        Декоратор для метода класса
    """
    def decorator(view_method):
        return method_decorator(api_rate_limit(**kwargs))(view_method)
    
    return decorator


def api_viewset_rate_limit(group: str = "api", **kwargs):
    """
    Декоратор для ограничения частоты запросов к ViewSet.
    
    Примеры использования:
    
    @api_viewset_rate_limit(group='auth')
    class AuthViewSet(ViewSet):
        ...
    
    Args:
        group: Группа ограничений
        **kwargs: Дополнительные аргументы для api_rate_limit
        
    Returns:
        Декорированный класс ViewSet
    """
    def decorator(cls: Type[APIView]):
        for method_name in ['list', 'create', 'retrieve', 'update', 'partial_update', 'destroy']:
            if hasattr(cls, method_name) and callable(getattr(cls, method_name)):
                setattr(
                    cls, 
                    method_name, 
                    method_decorator(api_rate_limit(group=group, **kwargs))(getattr(cls, method_name))
                )
        return cls
    
    return decorator
