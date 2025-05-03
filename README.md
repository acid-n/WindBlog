# MUSSON Blog — Fullstack (Next.js + Django)

## Описание

Полноценный блог-проект:
- **Frontend:** Next.js 14 (App Router), Tailwind CSS, Framer Motion, строгий MUSSON UX/UI STYLE GUIDE, визуал и анимации как в Read WP.
- **Backend:** Django 5, Django REST Framework, PostgreSQL, JWT, кастомная модель пользователя, админка, API v1.
- **CI/CD:** Docker, GitHub Actions, pre-commit, автотесты, деплой.

## Структура репозитория
- `frontend/` — Next.js 14, Tailwind CSS, компоненты, страницы, сервисы, тесты, README.md
- `backend/` — Django 5, DRF, приложения (blog, users, analytics, contact), миграции, тесты
- `.github/` — CI/CD (GitHub Actions)
- `docker/` — Dockerfile, docker-compose для локального и продакшн запуска

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

## Тесты
- **Backend:** pytest, pytest-django
- **Frontend:** Jest, React Testing Library

## Проверка стиля
- **Python:** black, isort, flake8
- **JS/TS:** eslint, prettier

## Документация
- [Frontend README](frontend/README.md)
- [Backend README](backend/README.md) *(если есть)*
- OpenAPI/Swagger: `/api/v1/schema/` (Django)

## Основные фичи
- SSR/SSG, адаптивность, SEO, aria, уникальные мета-теги
- Masonry/blog-grid, анимация поиска в меню, кастомные шрифты
- JWT, REST API, структурированные ошибки, версионирование
- CI/CD, pre-commit, code review, Conventional Commits

## Лицензия и контакты
- MIT License
- Вопросы: musson@support.ru
