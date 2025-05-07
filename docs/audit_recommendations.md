# План внедрения рекомендаций по аудиту кода

Этот документ содержит план действий по улучшению кодовой базы проекта, основанный на результатах аудита.

## Приоритет 0: Новые критические ошибки из логов (Требуют немедленного внимания)

1.  **✅ [ВЫПОЛНЕНО] Frontend: Исправить ошибки `params should be awaited` на страницах архива.**
    *   **Проблема:** Логи показывали `Error: Route "/archive/[year]" used params.year. params should be awaited before using its properties.` (и аналогично для `month`). Это было связано с изменениями в Next.js 15, требующими асинхронного доступа к `params`.
    *   **Решение (07.08.2024, обновлено 08.08.2024):** Во всех затронутых файлах страниц архива (`archive/[year]/page.tsx`, `archive/[year]/[month]/page.tsx`, `archive/[year]/[month]/[day]/page.tsx`) параметр `params` в пропсах компонента был типизирован как `Promise`, и перед использованием его значение извлекалось с помощью `await`. Например: `async ({ params: paramsPromise }) => { const params = await paramsPromise; ... }`. Это соответствует рекомендациям Next.js 15. Окончательная стабилизация была достигнута после полной очистки кэшей фронтенда (`.next`, `node_modules`) и переустановки зависимостей.
        *   **Затронутые файлы:**
            *   `frontend/src/app/archive/[year]/page.tsx`
            *   `frontend/src/app/archive/[year]/[month]/page.tsx`
            *   `frontend/src/app/archive/[year]/[month]/[day]/page.tsx`

2.  **✅ [ВЫПОЛНЕНО] Frontend: Исправить ошибку Tailwind CSS `Cannot apply unknown utility class: mt-16`.**
    *   **Проблема:** В логах периодически появлялась ошибка `[Error: Cannot apply unknown utility class: mt-16]`. Также, при попытках изменения конфигурации PostCSS и `globals.css` возникали более общие проблемы с применением стилей Tailwind (например, `bg-white`) и ошибки сборки CSS.
    *   **Решение (07.08.2024, обновлено 08.08.2024):** Проблема была окончательно решена после выполнения следующих шагов:
        1.  Создан файл конфигурации `frontend/tailwind.config.ts` с корректными путями к контенту.
        2.  Подтверждено, что `frontend/postcss.config.js` должен использовать плагин `\'@tailwindcss/postcss\': {}`
        3.  Подтверждено, что импорт Tailwind в `frontend/src/app/globals.css` через `@import \"tailwindcss\";` является корректным.
        4.  Выполнена полная очистка кэшей фронтенда (удаление папок `.next` и `node_modules`) и переустановка зависимостей (`npm install`).
        После этих действий ошибки, связанные с неприменением утилит Tailwind (включая `mt-16`, `bg-white`) и ошибки сборки CSS, перестали наблюдаться. Диагностический шаг с добавлением классов в `safelist` был отменен.

## Приоритет 1: Основные критические исправления

1.  **✅ [ВЫПОЛНЕНО (Бэкенд + Фронтенд)] Frontend: SEO — Настройка `sitemap.xml` и `robots.txt` (Инструкция 006)**
    *   **Цель:** Реализовать генерацию `robots.txt` и `sitemap.xml`, управляемую из админ-панели Django, используя гибридный подход.
    *   **Бэкенд (Выполнено 07.08.2024):**
        *   Создано приложение `seo`, модели `RobotsRule`, `GlobalSEOSettings`.
        *   Модель `Post` расширена SEO-полями.
        *   Настроена админка Django.
        *   Реализована view и URL `/robots.txt` для генерации Django.
        *   API для постов (`PostViewSet`) расширен для поддержки `?for_sitemap=true`.
        *   URL `/sitemap.xml` в Django удален/закомментирован.
    *   **Фронтенд (Выполнено 07.08.2024):**
        *   Файл `frontend/src/app/robots.ts` удален (или подтверждено его отсутствие).
        *   Создан файл `frontend/src/app/sitemap.ts`, который:
            *   Генерирует записи для статических страниц.
            *   Делает запрос к API Django (`/api/v1/posts/?for_sitemap=true`) для получения данных постов (включая SEO-атрибуты) и добавляет их в sitemap.
            *   Делает запрос к API Django (`/api/v1/tags/`) для получения тегов и добавляет их в sitemap.
    *   **Деплоймент (Осталось сделать):**
        *   Настроить веб-сервер/прокси (Nginx и т.п.) так, чтобы запросы к `/robots.txt` перенаправлялись на бэкенд Django, а запросы к `/sitemap.xml` (и остальные) - на фронтенд Next.js.

2.  **✅ [ВЫПОЛНЕНО] Backend: Команда запуска Docker в Production (Инструкция 005)**
    *   **Действия:**
        *   В `backend/Dockerfile` заменена строка `CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]` на `CMD ["gunicorn", "--bind", "0.0.0.0:8000", "config.wsgi:application"]`.
        *   Добавлен `gunicorn` в файл `backend/requirements.in` и пересобран `backend/requirements.txt`.
        *   В `backend/Dockerfile` добавлен шаг `RUN python manage.py collectstatic --noinput` для сбора статики.

3.  **✅ [ВЫПОЛНЕНО] Frontend: Устранение использования `any` (Инструкция 001)**
    *   **Действия:**
        *   В `frontend/src/components/post-body/index.tsx`:
            *   Для `data: any;` и `img: any` были определены и применены точные типизированные интерфейсы (`TextBlockData`, `ImageBlockData`, `GalleryImage`, `AnyBlock` и т.д.).
        *   Проверены все файлы `.tsx`, найденные поиском `catch (e: any)` (в основном, файлы страниц в `frontend/src/app/`). В большинстве случаев блоки `catch` уже были исправлены на `catch (e: unknown)` с корректной обработкой ошибок или были исправлены в процессе. Функции `generateMetadata` в этих файлах либо отсутствовали, либо уже имели корректные блоки `catch`.

4.  **✅ [ЧАСТИЧНО ВЫПОЛНЕНО] CI/CD: Реализация деплоя и Dockerfile для Frontend (Инструкция 005)**
    *   **Действия:**
        *   Создан `frontend/Dockerfile` для сборки (`npm run build`) и запуска (`npm run start`) Next.js приложения с использованием многоэтапной сборки и `node:18-alpine`.
        *   В `.github/workflows/ci.yml`:
            *   Раскомментированы и настроены шаги для `Set up Docker Buildx` и `Login to Yandex Container Registry` (с использованием секрета `YC_SA_JSON_KEY_FOR_CR`).
            *   Раскомментированы и настроены шаги `Build and push backend image` и `Build and push frontend image` с тегированием (`latest` и `github.sha`) и кэшированием. Использован плейсхолдер `<YOUR_REGISTRY_ID_PLACEHOLDER>` для ID реестра.
            *   Шаг `Deploy to Yandex Cloud` дополнен установкой YC CLI, аутентификацией (с использованием секретов `YC_SA_JSON_KEY_FOR_DEPLOY`, `YC_CLOUD_ID`, `YC_FOLDER_ID`) и плейсхолдерами для реальных команд деплоя.
    *   **Оставшиеся задачи для пользователя:**
        *   Создать и настроить GitHub Secrets: `YC_SA_JSON_KEY_FOR_CR`, `YC_SA_JSON_KEY_FOR_DEPLOY`, `YC_CLOUD_ID`, `YC_FOLDER_ID` и другие необходимые для переменных окружения контейнеров.
        *   Заменить плейсхолдер `<YOUR_REGISTRY_ID_PLACEHOLDER>` в `.github/workflows/ci.yml` на реальный ID Yandex Container Registry.
        *   Реализовать конкретные команды деплоя в шаге `Deploy to Yandex Cloud` в `.github/workflows/ci.yml`.

5.  **✅ [ВЫПОЛНЕНО] Backend: Логика коротких ссылок (Согласованность)**
    *   **Действия:**
        *   В `backend/blog/serializers.py`, метод `get_shortlink` в `PostSerializer` изменен для использования поля `code` из связанного объекта `ShortLink`.
        *   В `backend/blog/models.py`, в модели `ShortLink`, реализована автоматическая генерация уникального значения для поля `code` (8 символов, буквы+цифры) при сохранении нового объекта. Поле `code` сделано `editable=False`.
        *   В `backend/config/urls.py`, функция `shortlink_redirect` (используемая для URL `/s/<code>/`) упрощена: теперь она ищет `ShortLink` только по `code` и редиректит на `post.get_absolute_url()` или на главную страницу фронтенда в случае ошибки/отсутствия.
        *   Созданы и применены миграции для модели `ShortLink`.

## Приоритет 2: Улучшения и рефакторинг

1.  **✅ [ВЫПОЛНЕНО] Frontend: Устранение использования `any` (Инструкция 001)**
    *   **Действия:**
        *   В `frontend/src/components/post-body/index.tsx`:
            *   Для `data: any;` и `img: any` были определены и применены точные типизированные интерфейсы (`TextBlockData`, `ImageBlockData`, `GalleryImage`, `AnyBlock` и т.д.).
        *   Проверены все файлы `.tsx`, найденные поиском `catch (e: any)` (в основном, файлы страниц в `frontend/src/app/`). В большинстве случаев блоки `catch` уже были исправлены на `catch (e: unknown)` с корректной обработкой ошибок или были исправлены в процессе. Функции `generateMetadata` в этих файлах либо отсутствовали, либо уже имели корректные блоки `catch`.

2.  **✅ [ВЫПОЛНЕНО] Frontend: Устранение использования `any` (Инструкция 001)**
    *   **Действия:**
        *   В `frontend/src/components/post-body/index.tsx`:
            *   Для `data: any;` и `img: any` были определены и применены точные типизированные интерфейсы (`TextBlockData`, `ImageBlockData`, `GalleryImage`, `AnyBlock` и т.д.).
        *   Проверены все файлы `.tsx`, найденные поиском `catch (e: any)` (в основном, файлы страниц в `frontend/src/app/`). В большинстве случаев блоки `catch` уже были исправлены на `catch (e: unknown)` с корректной обработкой ошибок или были исправлены в процессе. Функции `generateMetadata` в этих файлах либо отсутствовали, либо уже имели корректные блоки `catch`.