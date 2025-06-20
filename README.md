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

  - Название и описание сайта берутся из Django-модели SiteSettings (через API `/api/v1/site-settings`, результат кешируется на час).
  - В Header и Footer данные загружаются через React Query.
  - Для запросов используется утилита `getBaseUrl`.
    При SSR берётся `DJANGO_API_URL_SSR` (обычно `http://localhost:8000/api/v1`),
    в браузере — `NEXT_PUBLIC_API_BASE` (если переменная не задана, используется `window.location.origin/api/v1`).
  - Серверные fetch-запросы должны быть абсолютными.
    Используйте хелпер `fetchJson('/api/v1/…')`, который подставит `getBackendOrigin()`.

- **Архитектура:**

  - Бэкенд: Django 5, PostgreSQL, DRF, кастомная модель пользователя, сериализаторы, JWT, OpenAPI.
  - Фронтенд: Next.js, Tailwind, CSS-модули, отдельные компоненты, строгая типизация, SSR/SSG, кастомные хуки, сервисы API.
  - Тесты: Pytest (бэкенд), Jest/React Testing Library (фронтенд), покрытие >80% (цель).
  - CI/CD: Docker, GitHub Actions (linting, tests, build для backend и frontend), pre-commit хуки (Python, JS/TS/CSS и др.).

- **Локализация:**

  - Весь интерфейс и даты — на русском языке.

- **SEO и доступность:**
  - Семантическая верстка, уникальные мета-теги (включая `generateMetadata` в Next.js), `sitemap.xml` (маршрут реализован в `app/sitemap/route.ts` с rewrite в `next.config.js`; раньше Next.js 14 создавал дубликат `/sitemap.xml[[...__metadata_id__]]`, вызывая цикл), `robots.txt` (генерируется бэкендом на основе правил из админки). Для корректной работы в production-среде может потребоваться настройка веб-сервера/прокси (например, Nginx) для правильного маппинга запросов: `/robots.txt` на бэкенд, а `/sitemap.xml` на фронтенд. Оптимизация изображений (`next/image` для WebP, lazy loading), aria-атрибуты.

## Структура репозитория

- `frontend/` — Next.js 15.3.1, Tailwind CSS, компоненты, страницы, сервисы, тесты (Jest/RTL), Dockerfile, README.md
- `backend/` — Django 5, DRF, приложения (blog, users, seo), миграции, тесты (Pytest), Dockerfile, README.md
- `.github/` — CI/CD (GitHub Actions workflow)
- `docker/` — `docker-compose.yml` для полного стека (frontend, backend, db), `.env.example` для конфигурации Docker.
- `docs/UX_UI_STYLE_GUIDE.txt` — [UX/UI STYLE GUIDE](docs/UX_UI_STYLE_GUIDE.txt) (pixel-perfect, типографика, сетка, цвета, компоненты)

## Зависимости

Для корректной работы миграций и тестов требуются дополнительные пакеты:

- `beautifulsoup4`
- `lxml`

Они устанавливаются вместе с остальными зависимостями через `pip install -r requirements.txt`. Без них часть функциональности (например, конвертация содержимого в миграциях) недоступна.

## Запуск проекта

### Локально (без Docker)

#### Backend

```bash
cd backend
# Рекомендуется использовать Python 3.11 (или указанную в Dockerfile/CI версию)
python -m venv venv
source venv/bin/activate # для Linux/macOS или venv\Scripts\activate для Windows
pip install -r requirements.txt
# Файл requirements.txt содержит dev-зависимости (flake8, black, isort, pytest-cov)
cp .env.example .env  # заполнить переменные для локального запуска (не Docker)
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

#### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local  # при первом запуске
cd ..
cp .env.local.example .env.local   # настройки API для e2e (корень проекта)
npm run dev
```

### Environment variables

SSR uses `DJANGO_API_URL_SSR`, client uses `NEXT_PUBLIC_API_BASE`.

Основные переменные из `.env`:

- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` — параметры БД
- `DJANGO_SECRET_KEY` — секретный ключ Django
- `DJANGO_DEBUG` — режим отладки
- `API_URL` — базовый адрес API, используется фронтендом
- `DJANGO_ALLOWED_HOSTS` — хосты для Django
- `CORS_ALLOWED_ORIGINS` — разрешённые источники CORS

## 🔐 Пароль Postgres и volume
При первом запуске контейнер `db` создаёт кластер в томе `postgres_data`. Пароль
из `.env` сохраняется внутри и при последующих запусках используется уже из этог
о тома. Если изменить `POSTGRES_PASSWORD`, старый пароль останется актуальным.
Нужно либо удалить том командой `docker compose down -v`, либо выполнить `ALTER
USER` внутри базы, чтобы сменить пароль без потери данных.

### Docker (рекомендуемый способ для разработки и продакшена)

1.  **Скопируйте `.env.example` в `.env`** и при необходимости измените `POSTGRES_PASSWORD`.
    Если пароль менялся ранее, выполните `docker compose down -v` перед перезапуском.
2.  **Запустите все сервисы одной командой:**
    ```bash
    docker compose down -v && docker compose up --build
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

- **Backend:** Pytest, pytest-django. Запуск: `cd backend && pytest --cov=. -q` для вывода покрытия.
- **Frontend:** Jest, React Testing Library. Запуск: `cd frontend && npm test -- --coverage`.
- **E2E:** Playwright. Запуск: `pnpm exec playwright test` (требует запущенного сервера).
- Цель покрытия — не менее 95%.
- Backend использует SQLite для тестов (config/settings_test.py).
- Тесты и линтеры запускаются автоматически через pre-commit и CI.
- Перед запуском убедитесь, что зависимости установлены:
  - `pip install -r backend/requirements.txt`
  - `npm ci --legacy-peer-deps --prefix frontend`

## Проверка стиля и линтинг

- Запуск линтеров вручную:

  - `flake8` и `black --check` в каталоге `backend`
  - `isort --check --profile=django` для проверки порядка импортов
  - `npm run lint` в каталоге `frontend`

- **Python:** black, isort, flake8 (настроены в pre-commit и CI).
- **JS/TS/CSS и др.:** Prettier, ESLint (настроены в pre-commit и CI).
- Для `@ts-expect-error` требуется описание причины (минимум 3 символа) из-за правила ESLint.

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
2.  Скопируйте `.env.example` в `.env` в корне проекта и при необходимости измените `POSTGRES_PASSWORD`.
    Если пароль менялся ранее, удалите том БД командой `docker compose down -v`.
    В каталоге `frontend` создайте `.env.local` на основе `.env.local.example`.
3.  Выполните `docker compose up --build` из корня проекта.
4.  Откройте [http://localhost:3000](http://localhost:3000).
5.  Сгенерируйте тестовые данные: `docker-compose exec backend python manage.py generate_test_data`.

---

### Инициализация backend после первого запуска

1. **Выполните миграции (если не применились автоматически):**

   ```bash
   docker-compose exec backend python manage.py migrate
   ```

2. **Создайте суперпользователя Django:**

   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

   Следуйте инструкциям в терминале (логин, email, пароль).

3. **Добавьте Site для локального домена (если используется django.contrib.sites и возникает ошибка "Site matching query does not exist"):**

   ```bash
   docker-compose exec backend python manage.py shell -c "from django.contrib.sites.models import Site; Site.objects.create(domain='localhost:8000', name='localhost')"
   ```

   Если используете другой порт/домен — замените на нужный.

4. **Проверьте доступность админки:**
   - http://localhost:8000/admin/

---

## Структура кода (ключевые точки)

- `frontend/src/app/` — страницы Next.js App Router.
- `frontend/src/components/` — React-компоненты.
- `frontend/src/services/api.ts` — унифицированный сервис для работы с API.
- `frontend/next.config.js` — конфигурация Next.js (включая `remotePatterns` для `next/image`).
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
- **Проблемы с запуском фронтенда:** Убедитесь, что все зависимости установлены (`npm install`). В Docker переменные `NEXT_PUBLIC_API_BASE` и `DJANGO_API_URL_SSR` берутся из `frontend/.env.local`. При проблемах со стилями Tailwind CSS удалите папки `.next` и `node_modules`, затем выполните `npm install`.
- **ESLint/Prettier в pre-commit:** Убедитесь, что в `frontend/` установлены все зависимости (`npm install`), включая `eslint-config-next` и другие плагины ESLint, указанные в `additional_dependencies` в `.pre-commit-config.yaml`.
- **Ошибка ESLint `ban-ts-comment`:** используйте `@ts-expect-error` вместо `@ts-ignore`.
- **Вопросы:** musson@support.ru

## Git-гигиена

- Бинарные файлы (изображения, архивы, логи) не хранятся в репозитории.
- Для локальных ресурсов используйте папку `media-dev/` — она исключена из Git.
- `.gitignore` содержит правила для `*.png`, `*.jpg`, `*.webp`, `__pycache__`, логов и временных файлов.

## Лицензия и контакты

- MIT License
- Вопросы: musson@support.ru

---

Для доработок и новых фич — см. [CONTRIBUTING.md] или обращайтесь к разработчикам.
