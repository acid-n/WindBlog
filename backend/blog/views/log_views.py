from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
import logging
import json
from django.conf import settings
import os
from datetime import datetime

# Создаем специальный логгер для фронтенда
frontend_logger = logging.getLogger('frontend')

class LoggingView(APIView):
    """
    API эндпоинт для сохранения логов с фронтенда
    Логи сохраняются в файл logs/frontend.log
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        try:
            # Получаем логи из запроса
            log_data = request.data.get('logs', [])
            
            if not log_data or not isinstance(log_data, list):
                return Response(
                    {'error': 'Неверный формат данных логов'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Убедимся, что директория для логов существует
            log_dir = os.path.join(settings.BASE_DIR, 'logs')
            os.makedirs(log_dir, exist_ok=True)
            
            # Полный путь к файлу логов
            log_file_path = os.path.join(log_dir, 'frontend.log')
            
            # Записываем каждую запись лога в файл
            with open(log_file_path, 'a', encoding='utf-8') as log_file:
                for log_entry in log_data:
                    # Добавляем дополнительную информацию о пользователе
                    log_entry['user_id'] = request.user.id
                    log_entry['username'] = request.user.username
                    log_entry['server_timestamp'] = datetime.now().isoformat()
                    
                    # Форматируем лог в одну строку JSON
                    log_line = json.dumps(log_entry, ensure_ascii=False)
                    log_file.write(f'{log_line}\n')
                    
                    # Также отправляем в системный логгер
                    level = log_entry.get('level', 'info')
                    message = log_entry.get('message', 'Нет сообщения')
                    source = log_entry.get('source', 'unknown')
                    
                    if level == 'error':
                        frontend_logger.error(f'[{source}] {message}', extra=log_entry)
                    elif level == 'warn':
                        frontend_logger.warning(f'[{source}] {message}', extra=log_entry)
                    elif level == 'debug':
                        frontend_logger.debug(f'[{source}] {message}', extra=log_entry)
                    else:
                        frontend_logger.info(f'[{source}] {message}', extra=log_entry)
            
            return Response({'status': 'success', 'message': f'Сохранено {len(log_data)} записей логов'})
            
        except Exception as e:
            # В случае ошибки записываем её в системный лог
            logging.error(f'Ошибка при сохранении логов: {str(e)}')
            return Response(
                {'error': f'Ошибка при обработке логов: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
