"""
Middleware для добавления HTTP Security Headers к ответам.

Добавляет следующие заголовки:
- X-XSS-Protection: Защита от XSS-атак
- X-Content-Type-Options: Предотвращение MIME-sniffing
- X-Frame-Options: Управление фреймами (защита от кликджекинга)
- Strict-Transport-Security: Принудительное использование HTTPS
- Content-Security-Policy: Ограничение источников контента
- Referrer-Policy: Управление заголовком Referer
- Permissions-Policy: Управление доступом к API браузера
"""

import logging

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware:
    """Middleware для добавления HTTP Security Headers к ответам."""
    
    def __init__(self, get_response):
        """
        Инициализация middleware.
        
        Args:
            get_response: Функция для получения ответа
        """
        self.get_response = get_response

    def __call__(self, request):
        """
        Обработка запроса и добавление заголовков безопасности.
        
        Args:
            request: HTTP-запрос
            
        Returns:
            HTTP-ответ с добавленными заголовками безопасности
        """
        response = self.get_response(request)
        
        # Защита от XSS
        response['X-XSS-Protection'] = '1; mode=block'
        
        # Предотвращение MIME-sniffing
        response['X-Content-Type-Options'] = 'nosniff'
        
        # Управление фреймами (защита от кликджекинга)
        response['X-Frame-Options'] = 'DENY'
        
        # HSTS (только для HTTPS)
        if request.is_secure():
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        # Content Security Policy
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data:",
            "font-src 'self'",
            "connect-src 'self'",
        ]
        response['Content-Security-Policy'] = '; '.join(csp_directives)
        
        # Referrer Policy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Permissions Policy (ранее Feature Policy)
        response['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'
        
        return response
