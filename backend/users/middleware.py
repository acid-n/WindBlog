"""
Middleware для расширенного контроля доступа и логирования авторизации.
Предоставляет защиту от брутфорс-атак и подробное логирование попыток авторизации.
"""

import json
import logging
import time
from functools import wraps

from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse
from django.utils import timezone

# Настройка логгера для событий авторизации
auth_logger = logging.getLogger('auth')
if not auth_logger.handlers:
    # Если обработчики не настроены, добавляем базовую конфигурацию
    handler = logging.FileHandler(settings.BASE_DIR / 'logs' / 'auth.log')
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    auth_logger.addHandler(handler)
    auth_logger.setLevel(logging.INFO)
    auth_logger.propagate = False  # Предотвращаем дублирование логов

# Настройки лимитов и блокировок
MAX_FAILED_ATTEMPTS = 5  # Максимальное количество неудачных попыток
BLOCK_TIME = 15 * 60  # Время блокировки в секундах (15 минут)
RATE_LIMIT_WINDOW = 60  # Окно для rate limiting в секундах
MAX_REQUESTS_PER_WINDOW = 5  # Максимальное количество запросов в окне


class AuthRateLimitMiddleware:
    """
    Middleware для расширенного rate limiting и защиты от брутфорс-атак.
    Применяет ограничения на количество запросов к эндпоинтам авторизации
    и блокирует доступ после многократных неудачных попыток.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Проверяем, относится ли запрос к API авторизации
        if 'api/token' in request.path and request.method == 'POST':
            client_ip = self._get_client_ip(request)
            
            # Проверяем, заблокирован ли IP
            if self._is_ip_blocked(client_ip):
                auth_logger.warning(
                    f"Запрос заблокирован из-за превышения лимита попыток. IP: {client_ip}"
                )
                return JsonResponse(
                    {
                        "detail": "Слишком много неудачных попыток входа. "
                        "Пожалуйста, попробуйте позже."
                    },
                    status=429,
                )

            # Проверяем rate limit для данного IP
            if self._check_rate_limit(client_ip):
                auth_logger.warning(
                    f"Превышен rate limit для IP: {client_ip}"
                )
                return JsonResponse(
                    {"detail": "Превышен лимит запросов. Пожалуйста, попробуйте позже."},
                    status=429,
                )

            # Логируем попытку авторизации (предварительно)
            try:
                body = json.loads(request.body)
                email = body.get('email', 'unknown')
                # Маскируем email для безопасности в логах
                masked_email = self._mask_email(email)
                auth_logger.info(
                    f"Попытка авторизации: IP={client_ip}, Email={masked_email}"
                )
            except (json.JSONDecodeError, AttributeError):
                auth_logger.warning(
                    f"Некорректный формат запроса авторизации с IP: {client_ip}"
                )

        # Передаем запрос дальше
        response = self.get_response(request)

        # Обрабатываем результат авторизации для запросов к API токенов
        if 'api/token' in request.path and request.method == 'POST':
            client_ip = self._get_client_ip(request)
            try:
                body = json.loads(request.body)
                email = body.get('email', 'unknown')
                masked_email = self._mask_email(email)

                if response.status_code == 200:
                    # Успешная авторизация
                    auth_logger.info(
                        f"Успешная авторизация: IP={client_ip}, Email={masked_email}"
                    )
                    # Сбрасываем счетчик неудачных попыток
                    self._reset_failed_attempts(client_ip, email)
                else:
                    # Неудачная попытка авторизации
                    auth_logger.warning(
                        f"Неудачная авторизация: IP={client_ip}, Email={masked_email}, "
                        f"Код={response.status_code}"
                    )
                    # Увеличиваем счетчик неудачных попыток
                    self._increment_failed_attempts(client_ip, email)
            except (json.JSONDecodeError, AttributeError):
                pass

        return response

    def _get_client_ip(self, request):
        """Получение IP-адреса клиента с учетом прокси."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR', '0.0.0.0')
        return ip

    def _check_rate_limit(self, ip):
        """Проверка rate limit для IP-адреса."""
        cache_key = f"auth_rate_limit:{ip}"
        requests = cache.get(cache_key, [])
        
        # Удаляем устаревшие запросы
        current_time = time.time()
        requests = [req_time for req_time in requests if current_time - req_time < RATE_LIMIT_WINDOW]
        
        # Проверяем количество запросов
        if len(requests) >= MAX_REQUESTS_PER_WINDOW:
            return True  # Превышен лимит
            
        # Добавляем текущий запрос
        requests.append(current_time)
        cache.set(cache_key, requests, RATE_LIMIT_WINDOW * 2)
        return False  # Лимит не превышен

    def _is_ip_blocked(self, ip):
        """Проверка, заблокирован ли IP-адрес."""
        cache_key = f"auth_ip_blocked:{ip}"
        return cache.get(cache_key, False)

    def _increment_failed_attempts(self, ip, email):
        """Увеличение счетчика неудачных попыток и блокировка при необходимости."""
        cache_key = f"auth_failed_attempts:{ip}:{email}"
        attempts = cache.get(cache_key, 0) + 1
        cache.set(cache_key, attempts, BLOCK_TIME)
        
        # Если превышен лимит попыток, блокируем IP
        if attempts >= MAX_FAILED_ATTEMPTS:
            block_key = f"auth_ip_blocked:{ip}"
            cache.set(block_key, True, BLOCK_TIME)
            auth_logger.warning(
                f"IP {ip} заблокирован на {BLOCK_TIME/60} минут после {attempts} неудачных попыток"
            )

    def _reset_failed_attempts(self, ip, email):
        """Сброс счетчика неудачных попыток после успешной авторизации."""
        cache_key = f"auth_failed_attempts:{ip}:{email}"
        cache.delete(cache_key)

    def _mask_email(self, email):
        """Маскирование email для безопасного логирования."""
        if '@' in email:
            username, domain = email.split('@')
            if len(username) > 2:
                masked_username = username[0] + '*' * (len(username) - 2) + username[-1]
            else:
                masked_username = username[0] + '*' * (len(username) - 1)
            return f"{masked_username}@{domain}"
        return email  # Возвращаем исходное значение, если формат некорректный
