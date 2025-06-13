#!/bin/bash

# Скрипт для комплексной проверки безопасности проекта WindBlog
# Проверяет зависимости Python и JavaScript, настройки Django, и выполняет статический анализ кода

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

HAS_ERROR=false

echo -e "${BLUE}=== Комплексная проверка безопасности проекта WindBlog ===${NC}"
echo

# Проверка наличия необходимых инструментов
echo -e "${YELLOW}Проверка наличия инструментов безопасности...${NC}"

# Safety для Python
if ! command -v safety &> /dev/null; then
    echo -e "${YELLOW}Safety не установлен. Устанавливаем...${NC}"
    pip install safety
fi

# Bandit для Python
if ! command -v bandit &> /dev/null; then
    echo -e "${YELLOW}Bandit не установлен. Устанавливаем...${NC}"
    pip install bandit
fi

# npm audit для JavaScript
if ! command -v npm &> /dev/null; then
    echo -e "${RED}ВНИМАНИЕ: npm не установлен. Пропускаем проверку JavaScript зависимостей.${NC}"
fi

# Проверка зависимостей Python на уязвимости
echo -e "\n${BLUE}=== Проверка Python зависимостей на уязвимости ===${NC}"
SAFETY_OUTPUT=$(safety check -r backend/requirements.txt 2>&1) || {
    echo -e "${RED}Обнаружены уязвимости в Python зависимостях!${NC}"
    echo "$SAFETY_OUTPUT"
    HAS_ERROR=true
}

# Анализ кода на наличие уязвимостей с помощью Bandit
echo -e "\n${BLUE}=== Статический анализ кода на наличие уязвимостей ===${NC}"
BANDIT_OUTPUT=$(bandit -r backend/blog -x "*/tests/*,*/migrations/*" -f txt 2>&1) || {
    echo -e "${RED}Обнаружены потенциальные уязвимости в коде!${NC}"
    echo "$BANDIT_OUTPUT"
    HAS_ERROR=true
}

# Проверка JavaScript зависимостей, если npm доступен
if command -v npm &> /dev/null && [ -f "frontend/package.json" ]; then
    echo -e "\n${BLUE}=== Проверка JavaScript зависимостей на уязвимости ===${NC}"
    (cd frontend && npm audit --production) || {
        echo -e "${RED}Обнаружены уязвимости в JavaScript зависимостях!${NC}"
        HAS_ERROR=true
    }
fi

# Проверка настроек безопасности Django
echo -e "\n${BLUE}=== Проверка настроек безопасности Django ===${NC}"

# Проверка SECRET_KEY
echo -e "${YELLOW}Проверка SECRET_KEY...${NC}"
if grep -r "SECRET_KEY = " backend/config/settings.py | grep -v "os\.getenv\|os\.environ\.get" > /dev/null; then
    echo -e "${RED}ВНИМАНИЕ: SECRET_KEY жестко прописан в коде!${NC}"
    HAS_ERROR=true
else
    echo -e "${GREEN}OK: SECRET_KEY хранится в переменных окружения${NC}"
fi

# Проверка DEBUG
echo -e "${YELLOW}Проверка DEBUG...${NC}"
if grep "DEBUG = True" backend/config/settings.py > /dev/null; then
    echo -e "${RED}ВНИМАНИЕ: DEBUG постоянно включен в коде!${NC}"
    HAS_ERROR=true
else
    echo -e "${GREEN}OK: DEBUG не включен явно в коде${NC}"
fi

# Проверка ALLOWED_HOSTS
echo -e "${YELLOW}Проверка ALLOWED_HOSTS...${NC}"
if grep "ALLOWED_HOSTS = \[\]" backend/config/settings.py > /dev/null; then
    echo -e "${RED}ВНИМАНИЕ: ALLOWED_HOSTS пуст!${NC}"
    HAS_ERROR=true
else
    echo -e "${GREEN}OK: ALLOWED_HOSTS настроен${NC}"
fi

# Проверка наличия security middleware
echo -e "${YELLOW}Проверка Security Middleware...${NC}"
if ! grep "blog\.middleware\.SecurityHeadersMiddleware" backend/config/settings.py > /dev/null; then
    echo -e "${RED}ВНИМАНИЕ: Не обнаружен Security Headers Middleware!${NC}"
    HAS_ERROR=true
else
    echo -e "${GREEN}OK: Security Headers Middleware присутствует${NC}"
fi

# Проверка наличия настроек CORS
echo -e "${YELLOW}Проверка настроек CORS...${NC}"
if grep "CORS_ALLOW_ALL_ORIGINS = True" backend/config/settings.py > /dev/null; then
    echo -e "${YELLOW}ВНИМАНИЕ: CORS разрешен для всех источников. В продакшене лучше ограничить.${NC}"
fi

# Проверка на наличие секретов в коде
echo -e "\n${BLUE}=== Проверка на наличие секретов в коде ===${NC}"
SECRETS_FOUND=$(git grep -l "api_key\|password\|token\|secret" -- "*.py" "*.js" "*.ts" "*.tsx" "*.json" "*.yml" "*.yaml" | grep -v "settings\.py\|\.env\.example\|\.env\.sample\|tests\|\.md")

if [ -n "$SECRETS_FOUND" ]; then
    echo -e "${RED}ВНИМАНИЕ: Возможные секреты найдены в следующих файлах:${NC}"
    echo "$SECRETS_FOUND"
    HAS_ERROR=true
else
    echo -e "${GREEN}OK: Секретов не обнаружено в коде${NC}"
fi

# Итоговый результат
if [ "$HAS_ERROR" = true ]; then
    echo -e "\n${RED}=== Проверка завершена. Обнаружены проблемы безопасности! ===${NC}"
    echo -e "${RED}Пожалуйста, устраните найденные проблемы до деплоя в production.${NC}"
    exit 1
else
    echo -e "\n${GREEN}=== Проверка завершена успешно. Критических проблем не обнаружено. ===${NC}"
    exit 0
fi
