# MUSSON Blog — Frontend (Next.js, TypeScript)

[⬅️ Назад к корневому README](../README.md)

---

## Описание

Фронтенд-приложение MUSSON Blog реализовано на **Next.js 15.3.1** (App Router), **TypeScript** и **Tailwind CSS**. Анимации — с помощью **Framer Motion**. Строгая типизация, pixel-perfect дизайн (Read WP), все типовые ошибки устранены.

---

## Архитектура и особенности

- **Типизация:** TypeScript, строгие интерфейсы (Post, Tag, PaginatedPostsResponse и др.)
- **Редактор:** Tiptap Editor с кастомными расширениями, поддержка изображений, строгая обработка JSONContent
- **API:** Запросы инкапсулированы в сервисах (`src/services/api.ts`), поддержка JWT, обработка ошибок, кэширование
- **SEO:** generateMetadata, OpenGraph, динамическая sitemap.xml
- **Тесты:** Jest, React Testing Library, покрытие >80%
- **CI/CD:** pre-commit хуки, автолинтинг, автотесты
- **Деплой:** Netlify/Vercel/Docker

---

## Структура директорий

- `src/app/` — Маршруты и страницы (Server/Client Components)
- `src/components/` — Переиспользуемые React-компоненты (каждый в своей папке)
- `src/services/` — Вся логика работы с API
- `src/types/` — TypeScript типы
- `public/` — Статические ассеты
- `next.config.ts` — Конфиг Next.js (rewrites, images.remotePatterns)
- `tailwind.config.ts` — Конфиг Tailwind CSS

---

## Быстрый старт

```bash
cd frontend
npm install
npm run dev
```
Приложение будет доступно на http://localhost:3000

---

## Тесты и линтинг

```bash
npm run lint       # ESLint
npm test          # Все тесты (Jest)
npm run test:watch # Watch-режим
```

Отчёт о покрытии: `npm test -- --coverage`

---

## Сборка для продакшена

```bash
npm run build
```

---

## Взаимодействие с API

- Все запросы к backend инкапсулированы в сервисах (`src/services/api.ts`)
- Используется переменная окружения `NEXT_PUBLIC_API_URL` (по умолчанию http://localhost:8000/api/v1)
- Поддерживается JWT для защищённых эндпоинтов
- Пример структуры ответа:

```ts
export interface PaginatedPostsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Post[];
}
```

---

## Полезные ссылки
- [Backend API OpenAPI/Swagger](http://localhost:8000/api/schema/)
- [UX/UI STYLE GUIDE](../docs/UX_UI_STYLE_GUIDE.txt)
- [Backend README](../backend/README.md)

---

## FAQ
- **Как добавить компонент?**  
  В `src/components/`, следуйте style guide и типизации.
- **Как писать тесты?**  
  Используйте Jest/RTL, см. примеры рядом с компонентами.
- **Как деплоить?**  
  Netlify/Vercel или Docker (см. корневой README).

---

## Контакты
- Issues: [github.com/your-org/your-repo/issues](https://github.com/your-org/your-repo/issues)


Фронтенд-приложение для MUSSON Blog, реализованное на **Next.js 15.3.1** (с использованием App Router), **TypeScript** и **Tailwind CSS**. Анимации выполнены с помощью **Framer Motion**. Цель — максимальное соответствие MUSSON UX/UI STYLE GUIDE и теме Read WP.

## Ключевые технологии

- **Framework:** Next.js 15.3.1 (App Router)
- **Язык:** TypeScript (проведена работа по усилению типизации и устранению `any`)
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
- `tailwind.config.ts` — Конфигурация и кастомизация Tailwind CSS (шрифты, цвета).
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
- Файл `sitemap.xml` генерируется динамически с помощью `src/app/sitemap.ts`, который собирает данные со статических страниц и API бэкенда (посты, теги). Файл `robots.txt` обрабатывается бэкендом.
- При использовании Next.js 15+ параметры маршрута (props `params` в компонентах страниц) должны извлекаться с помощью `await` перед использованием их свойств.
- Для сборки и запуска фронтенд-приложения в Docker подготовлен файл `frontend/Dockerfile`.
- При возникновении проблем с применением стилей Tailwind CSS (например, классы не применяются или возникают ошибки сборки CSS), рекомендуется выполнить полную очистку кэшей (удалить папки `.next` и `node_modules`) и переустановить зависимости (`npm install`).

## Контакты

- По вопросам и предложениям: musson@support.ru
