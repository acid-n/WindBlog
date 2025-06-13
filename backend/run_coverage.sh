#!/bin/bash

# Скрипт для запуска тестов с измерением покрытия кода

set -e

# Устанавливаем настройки для тестовой среды
export DJANGO_SETTINGS_MODULE=config.settings_test

# Запуск тестов с pytest и измерением покрытия
echo "Запуск тестов с измерением покрытия..."
python -m pytest --cov=blog --cov-report=term-missing

# Генерация отчета о покрытии
echo "Генерация отчета о покрытии..."
coverage report -m

# Создание HTML-отчета
echo "Создание HTML-отчета о покрытии..."
coverage html

echo "Анализ покрытия завершен. HTML-отчет доступен в директории htmlcov/"
