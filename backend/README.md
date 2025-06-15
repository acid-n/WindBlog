# MUSSON Blog — Backend (Django 5, DRF)

[⬅️ Назад к корневому README](../README.md)

---

## Описание

Бэкенд-приложение для MUSSON Blog реализовано на **Django 5** с использованием **Django REST Framework** для API и **PostgreSQL** в качестве базы данных. Архитектура модульная, покрытие тестами Pytest >80%, поддержка Docker, OpenAPI/Swagger, кастомная модель пользователя, SEO, JWT.

---

## Основные технологии

- **Framework:** Django 5, Django REST Framework
- **База данных:** PostgreSQL (настраивается через переменные окружения)
- **Аутентификация:** JWT (`djangorestframework-simplejwt`)
- **Документация API:** OpenAPI 3.0 (`drf-spectacular`)
- **Тестирование:** Pytest, pytest-django, factory_boy
- **Линтинг и форматирование:** Black, isort, Flake8 (pre-commit)
- **Развёртывание:** Dockerfile, поддержка gunicorn

---

## Структура проекта (`backend/`)

- `blog/`: Основное приложение блога (модели Post, Tag, Rating, ShortLink, сериализаторы, API ViewSets)
- `users/`: Кастомная модель пользователя (`CustomUser`), эндпоинты для регистрации/управления
- `seo/`: SEO-функционал (robots.txt, sitemap.xml, OpenGraph)
- `config/`: Настройки Django (`settings.py`), корневые URL, WSGI/ASGI
- `management/commands/`: Кастомные manage.py команды (например, generate_test_data)
- `requirements.txt`: Зависимости
- `pytest.ini`: Конфиг Pytest
- `manage.py`: Django CLI
- `.env.example`: Пример переменных окружения
- `Dockerfile`: Инструкция для сборки образа

---

## Быстрый старт

### Локально (без Docker)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate    # Windows
pip install -r requirements.txt
cp .env.example .env  # Заполнить переменные
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

- Сервер: http://localhost:8000
- Swagger: http://localhost:8000/api/schema/

### Через Docker

```bash
cd .. # корень репозитория
docker-compose up --build
```

---

## Переменные окружения

- Все настройки вынесены в `.env` (см. `.env.example`)
- Важно: настройте параметры БД, DJANGO_SECRET_KEY и другие

---

## Тесты и линтинг

```bash
pytest          # Все тесты
pytest --cov    # Покрытие
flake8          # Линтинг
black .         # Форматирование
```

---

## Документация API (OpenAPI/Swagger)

- Swagger доступен по адресу http://localhost:8000/api/schema/
- Пример curl-запроса:

```bash
curl http://localhost:8000/api/v1/posts/
```

---

## FAQ
- **Как сгенерировать тестовые данные?**  
  `python manage.py generate_test_data`
- **Как добавить новое приложение?**  
  `python manage.py startapp <имя>` и зарегистрировать в settings.py
- **Как добавить эндпоинт в OpenAPI?**  
  Используйте DRF ViewSet + сериализатор, схема генерируется автоматически.

---

## Контакты
- Issues: [github.com/your-org/your-repo/issues](https://github.com/your-org/your-repo/issues)


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
