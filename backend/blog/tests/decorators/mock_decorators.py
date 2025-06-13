"""
Мок-реализация декораторов для тестирования.

Имитирует функциональность декораторов из blog.decorators без зависимости от django-ratelimit.
"""

import functools
from typing import Callable, Dict, Optional, Type, Union
from django.utils.decorators import method_decorator
from rest_framework.views import APIView


def mock_api_rate_limit(
    group: str = "api",
    key: str = "ip",
    rate: Optional[str] = None,
    method: Union[str, list] = "ALL",
    block: bool = True,
) -> Callable:
    """
    Мок-декоратор, имитирующий api_rate_limit.
    """
    def decorator(view_func):
        @functools.wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            # Просто вызываем оригинальную функцию без ограничений
            return view_func(request, *args, **kwargs)
        
        # Добавляем атрибут для проверки в тестах
        _wrapped_view._ratelimit_config = {
            'group': group,
            'key': key,
            'rate': rate,
            'method': method,
            'block': block
        }
        
        return _wrapped_view
    
    return decorator


def mock_api_view_rate_limit(**kwargs):
    """
    Мок-декоратор, имитирующий api_view_rate_limit.
    """
    def decorator(view_method):
        decorated = method_decorator(mock_api_rate_limit(**kwargs))(view_method)
        # Добавляем атрибут для проверки в тестах
        decorated._view_rate_limit = kwargs
        return decorated
    
    return decorator


def mock_api_viewset_rate_limit(group: str = "api", **kwargs):
    """
    Мок-декоратор, имитирующий api_viewset_rate_limit.
    """
    def decorator(cls: Type[APIView]):
        for method_name in ['list', 'create', 'retrieve', 'update', 'partial_update', 'destroy']:
            if hasattr(cls, method_name) and callable(getattr(cls, method_name)):
                method = getattr(cls, method_name)
                decorated_method = method_decorator(
                    mock_api_rate_limit(group=group, **kwargs)
                )(method)
                # Добавляем атрибут для проверки в тестах
                decorated_method._viewset_rate_limit = {'group': group, **kwargs}
                setattr(cls, method_name, decorated_method)
        return cls
    
    return decorator
