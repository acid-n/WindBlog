#!/bin/bash
# Скрипт для запуска тестов в изолированном Docker-окружении

# Останавливаем выполнение скрипта при ошибке
set -e

# Цвета для вывода
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
NC="\033[0m" # No Color

echo -e "${GREEN}Запуск тестов в изолированном Docker-окружении...${NC}"
echo "=========================================================="

# Проверка наличия Docker
if ! command -v docker >/dev/null 2>&1; then
    echo -e "${RED}Ошибка: Docker не найден. Установите Docker и повторите попытку.${NC}"
    exit 1
fi

# Сборка тестового образа
echo -e "${YELLOW}Сборка тестового образа...${NC}"
docker-compose -f $(dirname "$0")/docker-compose.test.yml build backend_test

# Проверка существования директории для отчетов
if [ ! -d "../backend/coverage_data" ]; then
    echo -e "${YELLOW}Создание директории для отчетов о покрытии...${NC}"
    mkdir -p ../backend/coverage_data
fi

# Запуск тестов
echo -e "${GREEN}Запуск тестов...${NC}"

# Запускаем тесты с сохранением статуса выхода
docker-compose -f $(dirname "$0")/docker-compose.test.yml run backend_test
TEST_STATUS=$?

# Вывод информации о расположении отчетов
echo "=========================================================="

if [ $TEST_STATUS -eq 0 ]; then
    echo -e "${GREEN}Тесты успешно завершены!${NC}"
    echo -e "${GREEN}Отчеты о покрытии доступны в директории:${NC} ../backend/coverage_data/"
    echo -e "${GREEN}HTML-отчет:${NC} ../backend/coverage_data/html/index.html"
else
    echo -e "${RED}Тесты завершились с ошибками.${NC}"
    echo -e "${YELLOW}Проверьте вывод выше для получения подробной информации.${NC}"
fi

# Возвращаем статус выполнения тестов
exit $TEST_STATUS
