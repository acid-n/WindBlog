# Быстрый старт для разработчиков

## Переменные окружения
Создайте файл `.env` на основе `.env.example` в корне проекта. Основные настройки:

- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` — параметры подключения к PostgreSQL
- `DJANGO_SECRET_KEY` — секретный ключ Django
- `DJANGO_DEBUG` — включить режим отладки (`True` или `False`)
- `API_URL` — базовый URL API, используется фронтендом
- `DJANGO_ALLOWED_HOSTS` — допустимые хосты для Django
- `CORS_ALLOWED_ORIGINS` — разрешённые источники CORS

## Запуск проекта
1. Установите зависимости:
   ```bash
   pip install -r backend/requirements.txt
   npm ci --prefix frontend
   ```
2. Скопируйте `.env.example` в `.env` и при необходимости отредактируйте параметры.
3. Запустите сервисы:
   ```bash
   docker compose up --build
   ```
   Backend будет доступен на <http://localhost:8000>, frontend — на <http://localhost:3000>.

## Тесты
- **Backend:** `pytest -q backend`
- **Frontend:** `npm test --prefix frontend`

