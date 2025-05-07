# Используем официальный образ Python
FROM python:3.11-slim

# Устанавливаем переменные окружения
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем системные зависимости, если они нужны (например, для psycopg2)
# RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev

# Копируем файлы зависимостей и устанавливаем их (сначала зависимости, чтобы использовать кэш Docker)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем остальной код приложения
COPY . .

# Создаем пользователя без прав root для запуска приложения
RUN addgroup --system app && adduser --system --ingroup app appuser
# Важно: collectstatic может потребовать прав на запись. 
# Если STATIC_ROOT настроен вне /app или требует спец. прав, эту команду нужно размещать ДО USER appuser
# или убедиться, что appuser имеет права на запись в STATIC_ROOT.
# В данном случае предполагаем, что STATIC_ROOT будет внутри /app и доступен appuser.
USER appuser

# Собираем статические файлы
RUN python manage.py collectstatic --noinput

# Открываем порт, на котором будет работать приложение
EXPOSE 8000

# Команда для запуска приложения Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "config.wsgi:application"]
# CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"] # Оставляем для справки или комментируем 