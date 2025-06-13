#!/bin/bash
# Скрипт для запуска тестов с использованием настроек для тестовой среды

# Цвета для вывода
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
NC="\033[0m" # No Color

echo -e "${GREEN}Запуск тестов локально...${NC}"
echo "=========================================================="

# Установка переменных окружения для тестов
export DJANGO_SETTINGS_MODULE=config.settings_test
export DJANGO_SECRET_KEY=insecure-test-key-for-testing-only
export DJANGO_DEBUG=True

# Использование SQLite для локальных тестов
export DB_ENGINE=sqlite

# Проверка доступности директории для отчетов о покрытии
if [ ! -d "coverage_data" ]; then
    echo -e "${YELLOW}Создание директории для отчетов о покрытии...${NC}"
    mkdir -p coverage_data/html
fi

echo -e "${GREEN}Запуск тестов с измерением покрытия...${NC}"

# Запуск тестов с покрытием
python3 -m pytest \
    --cov=blog \
    --cov-report=xml:coverage_data/coverage.xml \
    --cov-report=html:coverage_data/html \
    --cov-report=term-missing

TEST_STATUS=$?

if [ $TEST_STATUS -eq 0 ]; then
    echo -e "${GREEN}Тесты успешно завершены!${NC}"
    echo -e "${GREEN}Отчеты о покрытии доступны в директории:${NC} coverage_data/"
    echo -e "${GREEN}HTML-отчет:${NC} coverage_data/html/index.html"
else
    echo -e "${RED}Тесты завершились с ошибками.${NC}"
    echo -e "${YELLOW}Проверьте вывод выше для получения подробной информации.${NC}"
fi

# Возвращаем статус выполнения тестов
exit $TEST_STATUS
