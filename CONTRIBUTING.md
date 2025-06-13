# Руководство по разработке WindBlog

## Содержание

1. [Настройка окружения разработки](#настройка-окружения-разработки)
2. [Структура проекта](#структура-проекта)
3. [Процесс разработки](#процесс-разработки)
4. [Стиль кода и инструменты](#стиль-кода-и-инструменты)
5. [Тестирование](#тестирование)
6. [Документация](#документация)

## Настройка окружения разработки

### Локальная настройка

1. Клонировать репозиторий:
   ```bash
   git clone https://github.com/username/windblog.git
   cd windblog
   ```

2. Создать и активировать виртуальное окружение:
   ```bash
   python -m venv venv
   source venv/bin/activate  # для Linux/Mac
   venv\Scripts\activate  # для Windows
   ```

3. Установить зависимости:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. Настроить переменные окружения:
   ```bash
   cp docker/.env.example docker/.env
   # Отредактировать .env с актуальными настройками
   ```

5. Применить миграции:
   ```bash
   cd backend
   python manage.py migrate
   ```

6. Запустить сервер разработки:
   ```bash
   python manage.py runserver
   ```

### Настройка с Docker

Смотрите инструкции в [docker/README.md](docker/README.md).

## Структура проекта

### Бэкенд (Django)

```
backend/
├── blog/                    # Основное приложение блога
│   ├── migrations/          # Миграции базы данных
│   ├── models.py            # Модели данных
│   ├── serializers/         # Модульные сериализаторы
│   ├── services/            # Сервисный слой (бизнес-логика)
│   ├── tests/               # Тесты
│   │   ├── services/        # Тесты сервисного слоя
│   │   └── integration/     # Интеграционные тесты
│   ├── urls.py              # Маршруты API
│   └── views/               # Представления API
├── config/                  # Настройки проекта
└── requirements.txt         # Зависимости Python
```

### Фронтенд (Next.js)

```
frontend/
├── components/              # React-компоненты
├── pages/                   # Страницы Next.js
├── public/                  # Статические файлы
└── styles/                  # CSS-стили
```

## Процесс разработки

### Ветвление

Мы используем следующую структуру ветвей:
- `main` - стабильная версия (production)
- `develop` - ветка разработки
- `feature/имя-функциональности` - ветки для новых функций
- `bugfix/имя-бага` - ветки для исправления ошибок

### Рабочий процесс

1. Создать ветку для новой функциональности:
   ```bash
   git checkout -b feature/название-функциональности
   ```

2. Внести изменения, следуя стандартам кода проекта.

3. Запустить тесты:
   ```bash
   cd backend
   python manage.py test
   ```

4. Запустить pre-commit хуки перед коммитом:
   ```bash
   pre-commit run --all-files
   ```

5. Создать коммит с осмысленным сообщением:
   ```bash
   git commit -m "Добавлена функциональность X для решения задачи Y"
   ```

6. Отправить изменения в репозиторий:
   ```bash
   git push origin feature/название-функциональности
   ```

7. Создать pull request в ветку `develop`.

## Стиль кода и инструменты

### Python/Django

Мы следуем [PEP 8](https://pep8.org/) с небольшими модификациями:
- Максимальная длина строки: 88 символов (black)
- Сортировка импортов с isort
- Статическая проверка типов с mypy

Инструменты настроены в конфигурационных файлах:
- `.flake8` - настройки flake8
- `pyproject.toml` - настройки black и isort
- `mypy.ini` - настройки mypy

### JavaScript/TypeScript

- ESLint и Prettier для форматирования
- TypeScript для строгой типизации

### Pre-commit хуки

Для установки pre-commit хуков:

```bash
pip install pre-commit
pre-commit install
```

## Тестирование

### Backend

```bash
# Запуск всех тестов
cd backend
python manage.py test

# Запуск тестов с покрытием
./run_coverage.sh

# Запуск конкретного теста
python manage.py test blog.tests.services.test_rating_service
```

### Frontend

```bash
cd frontend
npm test
```

## Документация

### API

API документация доступна по адресу `/api/docs/` при запущенном сервере.

### Исходный код

Все функции, классы и методы должны иметь docstring в формате [Google Style](https://google.github.io/styleguide/pyguide.html#38-comments-and-docstrings).

Пример:
```python
def some_function(arg1: str, arg2: int) -> bool:
    """
    Краткое описание функции.
    
    Подробное описание функции, которое может занимать несколько строк
    и объяснять детали реализации или использования.
    
    Args:
        arg1: Описание первого аргумента
        arg2: Описание второго аргумента
    
    Returns:
        Описание возвращаемого значения
    
    Raises:
        ValueError: Описание случая, когда возникает исключение
    """
    # Реализация
    pass
```
