## Этап 2. Инициализация бэкенда

**Цели:**
- Создать Django-проект и основные приложения.
- Настроить окружение, подключение к БД, базовые настройки безопасности.

**Детальные шаги:**
1. Создание Django-проекта  
   В папке backend:  
   `django-admin startproject config .`

2. Создание основных приложений  
   Приложения по областям:  
   `python manage.py startapp blog`
   `python manage.py startapp users`
   `python manage.py startapp api`
   `python manage.py startapp analytics`
   `python manage.py startapp contact`

3. Настройка переменных окружения  
   - Создать `.env` с настройками (SECRET_KEY, DEBUG, DB, EMAIL и т.д.).
   - Использовать python-dotenv для загрузки переменных.
   - Для секретов использовать .env и не хранить их в git.

4. Настройка подключения к PostgreSQL  
   - В settings.py прописать параметры подключения из .env.
   - Проверить доступность БД (можно через docker-compose для локальной БД).

5. Настройка базовых middleware и приложений  
   - Подключить rest_framework, drf_spectacular, corsheaders, django.contrib.admin и т.д.
   - Настроить CORS (разрешить localhost:3000 для фронта).

6. Настройка статики и медиа  
   - MEDIA_ROOT, MEDIA_URL, STATIC_ROOT, STATIC_URL.
   - Для dev — использовать django runserver, для prod — WhiteNoise или S3.

7. Настройка pre-commit хуков  
   - Установить и активировать pre-commit: `pre-commit install`

8. Инициализация миграций  
   - Выполнить: `python manage.py makemigrations` и `python manage.py migrate`

9. Создание суперпользователя  
   - Выполнить: `python manage.py createsuperuser`

10. Документирование  
    - Описать структуру backend и основные команды в README.md.

**Рекомендации:**
- Использовать docker-compose для локального запуска PostgreSQL.
- Для секретов использовать .env и не хранить их в git.
- Вести README.md и CHANGELOG.md с самого начала.
