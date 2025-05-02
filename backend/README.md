# Musson Blog — Backend

## Описание

Бэкенд реализован на Django 5 с использованием Django REST Framework и PostgreSQL. Архитектура — модульная, все приложения и конфигурация находятся в папке `backend/`.

---

## Структура проекта

```
backend/
  blog/         # Приложение блога (модели, сериализаторы, API, тесты)
  users/        # Кастомная модель пользователя и управление пользователями
  analytics/    # События аналитики
  contact/      # Обратная связь
  config/       # Основные настройки, маршруты, wsgi/asgi
  requirements.txt / requirements.in
  pytest.ini
  manage.py
```

---

## Основные технологии

- Django 5
- Django REST Framework
- PostgreSQL
- JWT-аутентификация (`djangorestframework-simplejwt`)
- OpenAPI/Swagger (`drf-spectacular`)
- Pytest, pytest-django, factory_boy — для тестов

---

## Быстрый старт

### 1. Установка зависимостей

```sh
cd backend
pip install -r requirements.txt
```

### 2. Переменные окружения

Создайте `.env` на основе `.env.example` и укажите параметры БД, секреты и т.д.

### 3. Миграции и суперпользователь

```sh
python manage.py migrate
python manage.py createsuperuser
```

### 4. Запуск сервера

```sh
python manage.py runserver
```

---

## Тестирование

- Все тесты лежат в `blog/tests/` (и аналогично для других приложений).
- Запуск тестов из папки `backend/`:

```sh
pytest
```

---

## API

- Все эндпоинты доступны по `/api/v1/`.
- JWT-аутентификация: получение токена — `/api/token/`, обновление — `/api/token/refresh/`.
- Документация OpenAPI/Swagger: `/api/docs/`.
- Все ошибки возвращаются в формате:
  ```json
  {
    "error": "ErrorType",
    "message": "Описание ошибки"
  }
  ```

---

## Стандарты и best practices

- Код форматируется с помощью `black`.
- Все модели, сериализаторы, обработчики снабжены docstring.
- Используются только современные и поддерживаемые библиотеки.
- Для тестов — покрытие не менее 80% (рекомендуется).
- Для production — рекомендуется использовать Docker и CI/CD.

---

## Разработка и поддержка

- Ветки: `main`, `develop`, `feature/*`, `bugfix/*`.
- Все изменения проходят через pull request и code review.
- Для новых фич и багфиксов — обязательно писать тесты.

---

## Дополнительно

- Для деплоя и CI/CD рекомендуется использовать Docker и GitHub Actions.
- Все секреты и переменные окружения должны храниться вне кода (например, в `.env` или GitHub Secrets).

---

## Примеры запросов

**Получение списка постов:**
```http
GET /api/v1/posts/
Authorization: Bearer <JWT>
```

**Пример ответа:**
```json
[
  {
    "id": 1,
    "title": "Пример поста",
    "slug": "primer-posta"
    // ...
  }
]
```

---

**Документация API:**
- Swagger UI: http://localhost:8000/api/docs/
- OpenAPI schema: http://localhost:8000/api/schema/

---

**Контакты для поддержки:**
- [Указать email или ссылку на команду] 