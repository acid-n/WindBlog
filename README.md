# MUSSON Blog — Next.js + Django

[![Build Status](https://img.shields.io/github/actions/workflow/status/your-org/your-repo/ci.yml?branch=main)](https://github.com/your-org/your-repo/actions)
[![Coverage Status](https://img.shields.io/codecov/c/github/your-org/your-repo/main.svg)](https://codecov.io/gh/your-org/your-repo)

---

**Современный блог-проект: Next.js (TypeScript, Tailwind CSS) + Django 5 (DRF, PostgreSQL, JWT), строгая типизация, Docker, CI/CD, автотесты, pixel-perfect UI.**
- **Backend:** Django 5, Django REST Framework, PostgreSQL, Pytest, JWT, кастомная модель пользователя, админка, API v1.
- **CI/CD:** Docker (Dockerfile для backend и frontend), GitHub Actions (linting, tests, сборка и пуш образов в Yandex Container Registry), pre-commit хуки, автотесты. Подготовлена инфраструктура для деплоя в Yandex Cloud (пользователю необходимо настроить GitHub Secrets: `YC_SA_JSON_KEY_FOR_CR`, `YC_SA_JSON_KEY_FOR_DEPLOY`, `YC_CLOUD_ID`, `YC_FOLDER_ID` и заменить плейсхолдеры в `.github/workflows/ci.yml`).

## Соответствие Read WP (pixel-perfect)

- Внешний вид, ширина, типографика, цвета, анонсы, кнопки, пагинация, шрифты полностью повторяют тему [Read WP](https://themes.pixelwars.org/read-wp/).
- Используются CSS-модули Tailwind CSS для pixel-perfect.
- Все ключевые элементы сверстаны в точности по оригиналу.

## Главная страница блога

### Особенности реализации

- **Внешний вид и UX:**

  - Полное соответствие оригинальной теме Read WP (https://themes.pixelwars.org/read-wp/).
  - Используется Next.js 15.3.1 (App Router) + Tailwind CSS + CSS-модули для pixel-perfect.
  - SSR/SSG для страниц, строгая типизация TypeScript.
  - Семантическая верстка, SEO-мета-теги (включая OpenGraph), оптимизация изображений с `next/image` (поддержка WebP), доступность (aria-атрибуты).

- **Пагинация:**

  - Минималистичная, с кастомным шрифтом, цветами и подчёркиванием как в Read WP.
  - Реализована через отдельный компонент с CSS-модулем.

- **Анонсы и посты:**

  - Анонс ограничен 180 символами, всегда лаконичный.
  - Обложка — широкая, невысокая (1200x400), как постер. Используется `next/image`.
  - Генерация тестовых данных: каждый пост содержит все типы блоков.
  - Все изображения скачиваются и сохраняются в `media/posts/`.
  - Генерация тестовых данных не затирает старые посты, каждый запуск добавляет 10 новых.

- **Динамическое название сайта:**

  - Название и описание сайта берутся из Django-модели SiteSettings (через API `/api/v1/site-settings`).
  - В Header и Footer всегда актуальное название из админки.

- **Архитектура:**

  - Бэкенд: Django 5, PostgreSQL, DRF, кастомная модель пользователя, сериализаторы, JWT, OpenAPI.
  - Фронтенд: Next.js, Tailwind, CSS-модули, отдельные компоненты, строгая типизация, SSR/SSG, кастомные хуки, сервисы API.
  - Тесты: Pytest (бэкенд), Jest/React Testing Library (фронтенд), покрытие >80% (цель).
  - CI/CD: Docker, GitHub Actions (linting, tests, build для backend и frontend), pre-commit хуки (Python, JS/TS/CSS и др.).

- **Локализация:**

  - Весь интерфейс и даты — на русском языке.

- **SEO и доступность:**
  - Семантическая верстка, уникальные мета-теги (включая `generateMetadata` в Next.js), `sitemap.xml` (генерируется динамически фронтендом с использованием данных с бэкенда для постов и тегов, а также статических страниц), `robots.txt` (генерируется бэкендом на основе правил из админки). Для корректной работы в production-среде может потребоваться настройка веб-сервера/прокси (например, Nginx) для правильного маппинга запросов: `/robots.txt` на бэкенд, а `/sitemap.xml` на фронтенд. Оптимизация изображений (`next/image` для WebP, lazy loading), aria-атрибуты.

## Структура репозитория

- `frontend/` — Next.js 15.3.1, Tailwind CSS, компоненты, страницы, сервисы, тесты (Jest/RTL), Dockerfile, README.md
- `backend/` — Django 5, DRF, приложения (blog, users, analytics, contact), миграции, тесты (Pytest), Dockerfile, README.md
- `.github/` — CI/CD (GitHub Actions workflow)
- `docker/` — `docker-compose.yml` для полного стека (frontend, backend, db), `.env.example` для конфигурации Docker.
- `docs/UX_UI_STYLE_GUIDE.txt` — [UX/UI STYLE GUIDE](docs/UX_UI_STYLE_GUIDE.txt) (pixel-perfect, типографика, сетка, цвета, компоненты)

## Запуск проекта

### Локально (без Docker)

#### Backend

```bash
cd backend
# Рекомендуется использовать Python 3.11 (или указанную в Dockerfile/CI версию)
python -m venv venv
source venv/bin/activate # для Linux/macOS или venv\Scripts\activate для Windows
pip install -r requirements.txt
cp .env.example .env  # заполнить переменные для локального запуска (не Docker)
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Docker (рекомендуемый способ для разработки и продакшена)

1.  **Скопируйте `docker/.env.example` в `docker/.env`** и настройте переменные:
    ```bash
    cd docker
    cp .env.example .env
    # Откройте .env и отредактируйте значения (POSTGRES_PASSWORD, DJANGO_SECRET_KEY_BE и др.)
    ```
2.  **Запустите все сервисы:**
    ```bash
    docker-compose -f docker/docker-compose.yml up --build
    ```
    Приложения будут доступны:
    - Frontend: http://localhost:3000
    - Backend: http://localhost:8000

### Генерация тестовых данных (после запуска backend)

```bash
# Если backend запущен локально (без Docker):
python backend/manage.py generate_test_data

# Если backend запущен в Docker:
docker-compose -f docker/docker-compose.yml exec backend python manage.py generate_test_data
```

- Каждый запуск добавляет 10 новых постов с полным набором блоков и изображений.
- Старые посты не затираются.

## Тесты

- **Backend:** Pytest, pytest-django. Запуск: `cd backend && pytest`
- **Frontend:** Jest, React Testing Library. Запуск: `cd frontend && npm test`
- Покрытие тестами не менее 80% (цель).
- Тесты и линтеры запускаются автоматически через pre-commit и CI.

## Проверка стиля и линтинг

- **Python:** black, isort, flake8 (настроены в pre-commit и CI).
- **JS/TS/CSS и др.:** Prettier, ESLint (настроены в pre-commit и CI).

## Документация

- [Frontend README](frontend/README.md)
- [Backend README](backend/README.md)
- OpenAPI/Swagger: `/api/docs/` (после запуска backend)
- [UX/UI STYLE GUIDE](docs/UX_UI_STYLE_GUIDE.txt)

## Основные фичи

- Pixel-perfect, SSR/SSG, адаптивность, SEO, aria, уникальные мета-теги
- Masonry/blog-grid, анимация поиска в меню, кастомные шрифты
- JWT, REST API (защищенные эндпоинты для CUD операций), структурированные ошибки, версионирование, реализованы короткие ссылки (`/s/<code>/`)
- CI/CD (GitHub Actions), pre-commit (Python, JS/TS), code review, Conventional Commits

## Быстрый старт (Docker)

1.  Склонируйте репозиторий.
2.  Перейдите в папку `docker/`, скопируйте `.env.example` в `.env` и настройте его.
3.  Выполните `docker-compose up --build` из корня проекта или указав путь к файлу.
4.  Откройте [http://localhost:3000](http://localhost:3000).
5.  Сгенерируйте тестовые данные: `docker-compose exec backend python manage.py generate_test_data`.

## Структура кода (ключевые точки)

- `frontend/src/app/` — страницы Next.js App Router.
- `frontend/src/components/` — React-компоненты.
- `frontend/src/services/api.ts` — унифицированный сервис для работы с API.
- `frontend/next.config.ts` — конфигурация Next.js (включая `remotePatterns` для `next/image`).
- `backend/config/settings.py` — настройки Django.
- `backend/blog/views.py` — ViewSets для API блога (с `IsAuthenticatedOrReadOnly`).
- `backend/blog/management/commands/generate_test_data.py` — генерация тестовых постов.
- `.github/workflows/ci.yml` — CI/CD пайплайн (включает сборку и пуш Docker-образов, подготовку к деплою).
- `docker/docker-compose.yml` — оркестрация сервисов.
- `backend/Dockerfile`, `frontend/Dockerfile` — инструкции по сборке образов.

## Стандарты и гайдлайны

- Все стили и архитектура соответствуют [UX/UI STYLE GUIDE](docs/UX_UI_STYLE_GUIDE.txt).
- Pixel-perfect соответствие Read WP.
- Код покрыт тестами (цель >80%), проходит линтеры и CI.

## FAQ / Типичные проблемы

- **Ошибка миграций (Docker):** Убедитесь, что сервис `db` успел запуститься перед `backend`. `docker-compose.yml` использует `depends_on`, но для миграций может потребоваться wait-for-it скрипт в entrypoint бэкенда.
- **Ошибка миграций (локально):** Проверьте настройки `.env` и выполните `python manage.py migrate`.
- **Не отображаются изображения:** Проверьте `MEDIA_URL`/`MEDIA_ROOT` в Django и доступность `media/` тома в Docker.
- **Проблемы с генерацией тестовых данных:** Убедитесь, что есть интернет для скачивания изображений, и директория `media/posts/` доступна для записи (права доступа к тому в Docker).
- **Проблемы с запуском фронтенда:** Проверьте, что все зависимости установлены (`npm install`). Проверьте `NEXT_PUBLIC_API_URL` при запуске в Docker. При проблемах со стилями Tailwind CSS, попробуйте удалить папки `.next` и `node_modules`, затем выполнить `npm install`.
- **ESLint/Prettier в pre-commit:** Убедитесь, что в `frontend/` установлены все зависимости (`npm install`), включая `eslint-config-next` и другие плагины ESLint, указанные в `additional_dependencies` в `.pre-commit-config.yaml`.
- **Вопросы:** musson@support.ru

## Лицензия и контакты

- MIT License
- Вопросы: musson@support.ru

---

Для доработок и новых фич — см. [CONTRIBUTING.md] (необходимо создать) или обращайтесь к разработчикам.
