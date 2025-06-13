# Документация по использованию Docker для WindBlog

## Содержание

1. [Окружение разработки](#окружение-разработки)
2. [Тестирование](#тестирование)
3. [Работа с базой данных](#работа-с-базой-данных)
4. [Production-окружение](#production-окружение)
5. [Переменные окружения](#переменные-окружения)
6. [Устранение неполадок](#устранение-неполадок)

## Окружение разработки

### Сборка и запуск

```bash
# Сборка образов
docker-compose -f docker/docker-compose.yml build

# Запуск всех сервисов
docker-compose -f docker/docker-compose.yml up

# Запуск в фоновом режиме
docker-compose -f docker/docker-compose.yml up -d

# Просмотр логов
docker-compose -f docker/docker-compose.yml logs -f

# Остановка контейнеров
docker-compose -f docker/docker-compose.yml down
```

### Доступ к сервисам

- **Backend API**: http://localhost:8000/api/
- **Frontend**: http://localhost:3000/

## Тестирование

### Запуск тестов

```bash
# Запуск всех тестов
docker-compose -f docker/docker-compose.yml run --rm tests

# Запуск конкретного модуля тестов
docker-compose -f docker/docker-compose.yml run --rm tests python manage.py test blog.tests.services.test_rating_service

# Запуск интеграционных тестов
docker-compose -f docker/docker-compose.yml run --rm tests python manage.py test blog.tests.integration
```

### Анализ покрытия кода тестами

```bash
# Запуск тестов с измерением покрытия
docker-compose -f docker/docker-compose.yml run --rm tests bash -c "cd /app && ./run_coverage.sh"

# Доступ к HTML-отчету о покрытии
# (необходимо скопировать директорию htmlcov из контейнера)
docker cp $(docker-compose -f docker/docker-compose.yml ps -q tests):/app/htmlcov ./htmlcov
```

## Работа с базой данных

```bash
# Создание миграций
docker-compose -f docker/docker-compose.yml run --rm backend python manage.py makemigrations

# Применение миграций
docker-compose -f docker/docker-compose.yml run --rm backend python manage.py migrate

# Доступ к shell базы данных
docker-compose -f docker/docker-compose.yml exec db psql -U postgres -d musson_db

# Создание резервной копии
docker-compose -f docker/docker-compose.yml exec db pg_dump -U postgres musson_db > backup_$(date +%Y%m%d).sql

# Восстановление из резервной копии
cat backup_YYYYMMDD.sql | docker-compose -f docker/docker-compose.yml exec -T db psql -U postgres -d musson_db
```

## Production-окружение

### Подготовка к запуску

1. Создайте файл `.env.prod` в директории `docker/` с необходимыми переменными окружения
2. Убедитесь, что порты 80 и 8000 свободны на вашем сервере

### Сборка и запуск

```bash
# Сборка образов для production
docker-compose -f docker/docker-compose.prod.yml build

# Запуск в production-режиме
docker-compose -f docker/docker-compose.prod.yml up -d

# Проверка статуса сервисов
docker-compose -f docker/docker-compose.prod.yml ps

# Просмотр логов
docker-compose -f docker/docker-compose.prod.yml logs -f
```

## Переменные окружения

### Для разработки (.env)

```
POSTGRES_DB=musson_db
POSTGRES_USER=musson_user
POSTGRES_PASSWORD=your_secure_password
DJANGO_SECRET_KEY_BE=your_django_secret_key
DJANGO_DEBUG=True
FRONTEND_URL_BE=http://localhost:3000
```

### Для production (.env.prod)

```
POSTGRES_DB=windblog_prod
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
DJANGO_SECRET_KEY=your_django_secret_key
API_URL=http://localhost:8000/api
FRONTEND_URL=http://localhost
```

## Устранение неполадок

### Проблема с зависимостями

Если возникают проблемы с зависимостями, например, с `factory_boy`:

```bash
# Пересборка образа с очисткой кэша
docker-compose -f docker/docker-compose.yml build --no-cache backend

# Ручная установка зависимостей внутри контейнера
docker-compose -f docker/docker-compose.yml run --rm backend pip install factory_boy coverage

# Проверка установленных пакетов
docker-compose -f docker/docker-compose.yml run --rm backend pip list
```

### Проблемы с разрешениями файлов

```bash
# Исправление прав доступа для файлов
docker-compose -f docker/docker-compose.yml run --rm backend bash -c "chmod -R 755 /app/logs /app/media"
```
