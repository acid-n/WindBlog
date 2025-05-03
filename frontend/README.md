# MUSSON Blog Frontend

Фронтенд реализован на **Next.js 14** (App Router) с использованием **Tailwind CSS** и анимаций через **Framer Motion**. Дизайн и структура полностью соответствуют MUSSON UX/UI STYLE GUIDE и оригиналу Read WP.

## Основные технологии
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS (строго стандартные утилиты)
- Framer Motion (анимации)
- ESLint, Prettier
- React Testing Library, Jest (тесты)

## Структура
- `src/components/` — атомарные и сложные компоненты (каждый в своей папке)
- `src/app/` — страницы (SSG/SSR)
- `src/services/` — работа с API
- `src/types/` — типы данных
- `tailwind.config.js` — кастомизация темы

## Стилизация
- Только Tailwind CSS, кастомные классы запрещены
- Шрифты: Coustard, Lora, UnifrakturMaguntia
- Цвета: #333, #444, #CE6607, #A35208
- Masonry/blog-grid, большие отступы, адаптивность
- aria-атрибуты, семантика, доступность

## Навигация
- Header, Footer, меню строго по Read WP
- Анимация поиска в меню через Framer Motion

## Запуск
```bash
cd frontend
npm install
npm run dev
```

## Тесты
```bash
npm run test
```

## Проверка стиля
```bash
npm run lint
npm run format
```

## API
- Все запросы идут через `/api/v1/` (проксирование на backend)
- JWT-аутентификация

## Контакты
- Для вопросов: musson@support.ru
