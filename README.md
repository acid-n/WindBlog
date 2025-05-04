# MUSSON Blog — Fullstack (Next.js + Django)

## Описание

Полноценный блог-проект:
- **Frontend:** Next.js 14 (App Router), Tailwind CSS, Framer Motion, строгий MUSSON UX/UI STYLE GUIDE, визуал и анимации как в Read WP.
- **Backend:** Django 5, Django REST Framework, PostgreSQL, JWT, кастомная модель пользователя, админка, API v1.
- **CI/CD:** Docker, GitHub Actions, pre-commit, автотесты, деплой.

## Соответствие Read WP (pixel-perfect)
- Внешний вид, ширина, типографика, цвета, анонсы, кнопки, пагинация, шрифты полностью повторяют тему [Read WP](https://themes.pixelwars.org/read-wp/).
- Используются кастомные CSS-модули для pixel-perfect.
- Все ключевые элементы сверстаны в точности по оригиналу.

## Главная страница блога

### Особенности реализации
- **Внешний вид и UX:**
  - Полное соответствие оригинальной теме Read WP (https://themes.pixelwars.org/read-wp/):
    - Ширина, типографика, стилизация, анонсы, кнопки, пагинация, шрифты, цвета.
  - Используется Next.js 14 (App Router) + Tailwind CSS + кастомные CSS-модули для pixel-perfect.
  - SSR/SSG для страниц, строгая типизация TypeScript.
  - Семантическая верстка, SEO-мета-теги, доступность.

- **Пагинация:**
  - Минималистичная, с кастомным шрифтом, цветами и подчёркиванием как в Read WP.
  - Реализована через отдельный компонент с CSS-модулем.

- **Анонсы и посты:**
  - Анонс ограничен 180 символами, всегда лаконичный.
  - Обложка — широкая, невысокая (1200x400), как постер.
  - Генерация тестовых данных: каждый пост содержит все типы блоков (заголовки, параграфы, цитаты, картинки с разным обтеканием, галереи, код, видео, списки, таблицы).
  - Все изображения скачиваются и сохраняются в media/posts/.
  - Генерация тестовых данных не затирает старые посты, каждый запуск добавляет 10 новых.

- **Динамическое название сайта:**
  - Название и описание сайта берутся из Django-модели SiteSettings (через API `/api/v1/site-settings`).
  - В Header и Footer всегда актуальное название из админки.

- **Архитектура:**
  - Бэкенд: Django 5, PostgreSQL, DRF, кастомная модель пользователя, сериализаторы, JWT, OpenAPI.
  - Фронтенд: Next.js, Tailwind, отдельные компоненты, строгая типизация, SSR/SSG, кастомные хуки.
  - Тесты: Pytest (бэкенд), Jest/RTL (фронтенд), покрытие >80%.
  - CI/CD: Docker, GitHub Actions, pre-commit хуки.

- **Локализация:**
  - Весь интерфейс и даты — на русском языке.

- **SEO и доступность:**
  - Семантическая верстка, уникальные мета-теги, sitemap.xml, robots.txt, оптимизация изображений (WebP, lazy), aria-атрибуты.

## Структура репозитория
- `frontend/` — Next.js 14, Tailwind CSS, компоненты, страницы, сервисы, тесты, README.md
- `backend/` — Django 5, DRF, приложения (blog, users, analytics, contact), миграции, тесты
- `.github/` — CI/CD (GitHub Actions)
- `docker/` — Dockerfile, docker-compose для локального и продакшн запуска
- `docs/UX_UI_STYLE_GUIDE.txt` — [UX/UI STYLE GUIDE](docs/UX_UI_STYLE_GUIDE.txt) (pixel-perfect, типографика, сетка, цвета, компоненты)

## Запуск проекта

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # заполнить переменные
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Docker (всё сразу)
```bash
docker-compose up --build
```

### Генерация тестовых данных
```bash
python backend/manage.py generate_test_data
```
- Каждый запуск добавляет 10 новых постов с полным набором блоков и изображений.
- Старые посты не затираются.

## Тесты
- **Backend:** pytest, pytest-django
- **Frontend:** Jest, React Testing Library
- Покрытие тестами не менее 80%.
- Тесты запускаются автоматически через pre-commit и CI.

## Проверка стиля
- **Python:** black, isort, flake8
- **JS/TS:** eslint, prettier

## Документация
- [Frontend README](frontend/README.md)
- [Backend README](backend/README.md) *(если есть)*
- OpenAPI/Swagger: `/api/v1/schema/` (Django)
- [UX/UI STYLE GUIDE](docs/UX_UI_STYLE_GUIDE.txt)

## Основные фичи
- Pixel-perfect, SSR/SSG, адаптивность, SEO, aria, уникальные мета-теги
- Masonry/blog-grid, анимация поиска в меню, кастомные шрифты
- JWT, REST API, структурированные ошибки, версионирование
- CI/CD, pre-commit, code review, Conventional Commits

## Быстрый старт

1. Установите зависимости:
   - backend: `pip install -r requirements.txt`
   - frontend: `npm install`
2. Запустите бэкенд: `python manage.py runserver`
3. Запустите фронтенд: `npm run dev`
4. Сгенерируйте тестовые данные: `python backend/manage.py generate_test_data`

## Структура кода
- `frontend/src/app/page.tsx` — главная страница, SSR, пагинация, рендеринг постов.
- `frontend/src/components/pagination/` — компонент и стили пагинации.
- `frontend/src/components/blog-post-preview/` — превью поста.
- `frontend/src/components/footer/` — динамический футер.
- `backend/config/models.py` — SiteSettings (название и описание сайта).
- `backend/blog/management/commands/generate_test_data.py` — генерация тестовых постов.

## Стандарты и гайдлайны
- Все стили и архитектура соответствуют [UX/UI STYLE GUIDE](docs/UX_UI_STYLE_GUIDE.txt).
- Pixel-perfect соответствие Read WP.
- Код покрыт тестами, проходит линтеры и CI.

## FAQ / Типичные проблемы
- **Ошибка миграций:** Проверьте настройки .env и выполните `python manage.py migrate`.
- **Не отображаются изображения:** Проверьте настройки MEDIA_URL и MEDIA_ROOT в Django, убедитесь, что сервер отдаёт media-файлы.
- **Проблемы с генерацией тестовых данных:** Убедитесь, что есть интернет для скачивания изображений, и директория media/posts/ доступна для записи.
- **Проблемы с запуском фронтенда:** Проверьте, что все зависимости установлены (`npm install`).
- **Вопросы:** musson@support.ru

## Лицензия и контакты
- MIT License
- Вопросы: musson@support.ru

---

Для доработок и новых фич — см. [CONTRIBUTING.md] или обращайтесь к разработчикам.
