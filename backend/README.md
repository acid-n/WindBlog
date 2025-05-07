# Musson Blog — Backend

## Описание

Бэкенд-приложение для MUSSON Blog, реализованное на Django 5 с использованием Django REST Framework для предоставления API и PostgreSQL в качестве базы данных. Архитектура — модульная, с разделением на приложения по функциональным областям.

## Основные технологии

- **Framework:** Django 5, Django REST Framework
- **База данных:** PostgreSQL (настраивается через переменные окружения)
- **Аутентификация:** JWT (`djangorestframework-simplejwt`)
- **Документация API:** OpenAPI 3.0 (`drf-spectacular`)
- **Тестирование:** Pytest, pytest-django, factory_boy
- **Линтинг и форматирование:** Black, isort, Flake8 (интегрированы с pre-commit хуками)
- **Развертывание:** Подготовлен Dockerfile для контейнеризации.

## Структура проекта (`backend/`)

- `blog/`: Основное приложение блога (модели Post, Tag, Rating, ShortLink (с автогенерацией уникального `code` и логикой редиректа для `/s/<code>/`); сериализаторы (включая поле `code` из `ShortLink` в `PostSerializer`); API ViewSets (включая поддержку `?for_sitemap=true` для эндпоинта постов); тесты).
- `users/`: Кастомная модель пользователя (`CustomUser`) и эндпоинты для регистрации/управления пользователями.
- `analytics/`: Модель `AnalyticsEvent` и API для сбора простой аналитики.
- `contact/`: Модель `ContactMessage` и API для формы обратной связи.
- `seo/`: Новое приложение для SEO-функциональности (модели `RobotsRule`, `GlobalSEOSettings`); модель `Post` расширена SEO-полями; Django генерирует `/robots.txt`.
- `config/`: Основные настройки Django (`settings.py`), корневые URL (`urls.py`), WSGI/ASGI конфигурации. Включает модель `SiteSettings`.
- `management/commands/`: Директория для кастомных manage.py команд (например, `generate_test_data`).
- `requirements.txt`: Список Python зависимостей.
- `pytest.ini`: Конфигурация Pytest.
- `manage.py`: Утилита управления Django.
- `.env.example`: Пример файла переменных окружения.
- `Dockerfile`: Инструкции для сборки Docker-образа приложения.

## Установка и запуск (локально, без Docker)

1.  **Клонируйте репозиторий** (если еще не сделали).
2.  **Перейдите в директорию `backend/`**.
3.  **Создайте и активируйте виртуальное окружение** (рекомендуется Python 3.11+):
    ```bash
    python -m venv venv
    source venv/bin/activate  # Linux/macOS
    # venv\Scripts\activate    # Windows
    ```
4.  **Установите зависимости:**
    ```bash
    pip install -r requirements.txt
    ```
5.  **Настройте переменные окружения:**
    Скопируйте `.env.example` в `.env` и заполните необходимые значения (параметры БД, `DJANGO_SECRET_KEY` и т.д.).
    ```bash
    cp .env.example .env
    ```
6.  **Примените миграции базы данных:**
    ```bash
    python manage.py migrate
    ```
7.  **Создайте суперпользователя** (для доступа к админ-панели Django):
    ```bash
    python manage.py createsuperuser
    ```
8.  **(Опционально) Сгенерируйте тестовые данные:**
    ```bash
    python manage.py generate_test_data
    ```
9.  **Запустите сервер разработки Django:**
    ```bash
    python manage.py runserver
    ```
    Сервер будет доступен по адресу [http://localhost:8000](http://localhost:8000).

## Docker

Бэкенд-приложение может быть запущено в Docker-контейнере. Смотрите глобальный `README.md` и `docker/docker-compose.yml` для инструкций по запуску всего стека (включая PostgreSQL, Frontend и Backend) с помощью Docker Compose.

- `backend/Dockerfile` содержит инструкции для сборки образа, включая шаг `RUN python manage.py collectstatic --noinput` для сбора статики.
- Для продакшен-сборки и запуска используется `gunicorn`. Команда запуска в Dockerfile: `CMD ["gunicorn", "--bind", "0.0.0.0:8000", "config.wsgi:application"]`. `gunicorn` добавлен в зависимости проекта.

## API

- **Базовый URL:** Все эндпоинты API доступны по префиксу `/api/v1/`.
- **Версионирование:** Используется версионирование v1.
- **Аутентификация:**
  - Для получения/обновления JWT токенов: `/api/token/`, `/api/token/refresh/`.
  - Защищенные эндпоинты (например, создание/изменение постов и тегов) требуют `Bearer <JWT>` в заголовке `Authorization`.
  - Публичные эндпоинты (например, чтение постов, тегов, архива) доступны без аутентификации (`IsAuthenticatedOrReadOnly` для ViewSet-ов).
- **Документация API (OpenAPI/Swagger):**
  - Интерактивная документация (Swagger UI): `/api/docs/`
  - Схема OpenAPI (JSON): `/api/schema/`
- **Формат ошибок:** При ошибках API возвращает JSON с полями `error` (тип ошибки) и `message` (описание), опционально `details`.

## Тестирование

- Используется Pytest с плагином `pytest-django` и `factory_boy` для генерации тестовых данных.
- Тесты расположены в директориях `tests/` внутри каждого Django-приложения (например, `blog/tests/`).
- **Запуск тестов:**
  Находясь в директории `backend/` (с активным виртуальным окружением, если не используется Docker):
  ```bash
  pytest
  ```
- Целевое покрытие тестами: >80%.
- Тесты автоматически запускаются в CI пайплайне.

## Линтинг и форматирование

- Код форматируется с помощью `black`.
- Импорты сортируются с помощью `isort`.
- Качество кода проверяется с помощью `flake8`.
- Эти инструменты настроены для автоматического запуска через pre-commit хуки (см. конфигурацию в корневом `.pre-commit-config.yaml`).

## Ключевые эндпоинты (примеры)

- `GET /api/v1/posts/` - Список постов (пагинированный). Также поддерживает параметр `?for_sitemap=true` для получения данных постов с SEO-атрибутами, необходимых для генерации `sitemap.xml` фронтендом.
- `GET /api/v1/posts/{slug}/` - Получение поста по slug.
- `POST /api/v1/posts/` - Создание нового поста (требуется аутентификация).
- `GET /api/v1/tags/` - Список тегов.
- `GET /api/v1/site-settings/` - Получение настроек сайта (название, описание).
- `GET /s/<code>/` - Редирект с короткой ссылки на соответствующий пост (если найден) или на главную страницу фронтенда.
- `/robots.txt` - Генерируется Django на основе правил из модели `RobotsRule` (приложение `seo`).

## Админ-панель Django

Доступна по адресу `/admin/` после запуска сервера. Используйте учетные данные суперпользователя.

## Замечания по разработке

- Придерживайтесь Git Flow (ветки `main`, `develop`, `feature/*`, `bugfix/*`).
- Все изменения в `develop` и `main` должны проходить через Pull Request и Code Review.
- Для новых фич и исправлений багов обязательно пишите тесты.

## Контакты

- По вопросам и предложениям: musson@support.ru
