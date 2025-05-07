# MUSSON Blog Frontend

Фронтенд-приложение для MUSSON Blog, реализованное на **Next.js 14** (с использованием App Router), **TypeScript** и **Tailwind CSS**. Анимации выполнены с помощью **Framer Motion**. Цель — максимальное соответствие MUSSON UX/UI STYLE GUIDE и теме Read WP.

## Ключевые технологии
- **Framework:** Next.js 14 (App Router)
- **Язык:** TypeScript
- **Стилизация:** Tailwind CSS, CSS Modules (для компонентно-специфичных стилей, часто с `@apply` из Tailwind)
- **Анимации:** Framer Motion
- **Тестирование:** Jest, React Testing Library
- **Линтинг и форматирование:** ESLint, Prettier (интегрированы с pre-commit хуками)
- **Работа с API:** Кастомный сервис в `src/services/api.ts` с поддержкой JWT и кеширования Next.js.

## Структура директорий (основное)
- `src/app/` — Маршруты и страницы приложения (Server Components и Client Components).
- `src/components/` — Переиспользуемые React-компоненты (каждый в своей папке с `index.tsx` и опциональным `styles.module.css`).
- `src/services/` — Логика взаимодействия с бэкенд API.
- `src/types/` — Определения TypeScript типов.
- `public/` — Статические ассеты.
- `next.config.ts` — Конфигурация Next.js (включая `rewrites` для проксирования API и `images.remotePatterns` для `next/image`).
- `tailwind.config.js` — Конфигурация и кастомизация Tailwind CSS (шрифты, цвета).
- `jest.config.js` и `jest.setup.js` — Конфигурация для Jest.

## Стилизация
- **Основной подход:** Утилитарные классы Tailwind CSS.
- **Компонентные стили:** Для более сложных или специфичных стилей используются CSS Modules (`*.module.css`) в папках компонентов. В них часто применяется директива `@apply` для использования утилит Tailwind.
- **Шрифты:** Lora, Coustard (подключены через `next/font` и CSS переменные), UnifrakturMaguntia.
- **Адаптивность:** Реализована с помощью breakpoint-ов Tailwind CSS.
- **Доступность (Accessibility):** Внимание уделяется семантической верстке и использованию ARIA-атрибутов где это необходимо.

## Запуск в режиме разработки
```bash
cd frontend
npm install # Установить зависимости, если не установлены
npm run dev
```
Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000).
API запросы будут проксироваться на бэкенд (по умолчанию `http://localhost:8000/api/v1/`).

## Линтинг и форматирование
Для проверки кода используются ESLint и Prettier. Они также настроены для автоматического запуска через pre-commit хуки.
```bash
cd frontend
npm run lint       # Запустить ESLint
# npm run format   # Если есть отдельный скрипт для Prettier (обычно Prettier интегрирован в lint или запускается pre-commit)
```

## Тестирование
Используются Jest и React Testing Library. Тесты находятся рядом с компонентами (например, `component.test.tsx`).
```bash
cd frontend
npm test          # Запустить все тесты
npm run test:watch # Запустить тесты в watch-режиме
```
Отчет о покрытии тестами генерируется при запуске `npm test -- --coverage` (также настроено в CI).

## Сборка для продакшена
```bash
cd frontend
npm run build
```
Эта команда создает оптимизированную сборку приложения в папке `.next`.

## Взаимодействие с API
- Все запросы к бэкенду инкапсулированы в функциях сервиса `src/services/api.ts`.
- Используется переменная окружения `NEXT_PUBLIC_API_URL` для определения базового URL API (по умолчанию `http://localhost:8000/api/v1` для локального запуска Next.js, или `http://backend:8000/api/v1` при запуске в Docker-сети).
- Поддерживается отправка JWT токенов для защищенных эндпоинтов.

## Важные замечания
- Для корректной работы `next/image` с изображениями с бэкенда, в `next.config.ts` настроены `images.remotePatterns`.
- Мета-теги для SEO генерируются с помощью функции `generateMetadata` в файлах страниц.

## Контакты
- По вопросам и предложениям: musson@support.ru
