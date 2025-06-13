# Документация страницы создания/редактирования постов

## Содержание
1. [Общее описание](#общее-описание)
2. [Структура страниц](#структура-страниц)
3. [Формы и валидация](#формы-и-валидация)
4. [UI-компоненты](#ui-компоненты)
5. [API-взаимодействие](#api-взаимодействие)
6. [Процесс создания поста](#процесс-создания-поста)
7. [Процесс редактирования поста](#процесс-редактирования-поста)
8. [Работа с тегами](#работа-с-тегами)
9. [Настройки SEO](#настройки-seo)
10. [Лучшие практики](#лучшие-практики)

## Общее описание

Данная документация описывает страницы создания и редактирования постов в блоге, построенном на базе Next.js (фронтенд) и Django (бэкенд). Страницы предоставляют полный функционал для управления контентом блога через административный интерфейс.

### Ключевые особенности:

- Редактор контента на основе Tiptap (WYSIWYG)
- Управление метаданными поста (заголовок, описание, SEO)
- Система тегирования контента
- Настройки SEO и Sitemap
- Механизмы валидации данных
- Возможность сохранения черновика или публикации

## Структура страниц

### Файловая структура

Страницы создания и редактирования постов находятся в следующих директориях проекта:

```
/frontend/src/app/admin/create-post/page.tsx     # Страница создания поста
/frontend/src/app/admin/edit-post/[slug]/page.tsx # Страница редактирования поста
```

Основные компоненты, используемые на этих страницах:

```
/frontend/src/components/tiptap-editor/index.tsx  # Редактор контента на базе Tiptap
/frontend/src/components/image-uploader/          # Компонент загрузки изображений
```

### Архитектура страницы создания поста

Страница создания поста (`create-post/page.tsx`) организована следующим образом:

1. **Client Component** - страница использует "use client" директиву для клиентского рендеринга
2. **Состояние и хуки**:
   - Использует React Hook Form для управления формой
   - Применяет Zod для валидации данных
   - Содержит состояния для управления постом, тегами, загрузкой и ошибками
3. **Основные секции UI**:
   - Форма с метаданными (заголовок, описание, слаг)
   - Редактор контента Tiptap
   - Секция тегов
   - Настройки SEO и Sitemap
   - Кнопки для сохранения черновика/публикации

### Архитектура страницы редактирования поста

Страница редактирования поста (`edit-post/[slug]/page.tsx`) имеет схожую структуру:

1. **Защищенный маршрут** - обернута в `ProtectedRoute` для проверки авторизации
2. **Динамический параметр** - использует параметр `[slug]` для определения редактируемого поста
3. **Загрузка данных** - при монтировании компонента загружает данные поста по slug
4. **Предзаполненная форма** - форма заполняется данными существующего поста
5. **Обработка обновлений** - сохраняет изменения через API с методом PATCH

### Общая структура компонентов формы

Обе страницы имеют схожую структуру формы:

```jsx
<form onSubmit={handleSubmit(performSaveOrPublish)}>
  {/* Метаданные поста */}
  <section className="mb-8">
    <h2>Основная информация</h2>
    {/* Поля для заголовка, описания, slug */}
  </section>
  
  {/* Теги */}
  <section className="mb-8">
    <h2>Теги</h2>
    {/* Чекбоксы для выбора тегов */}
  </section>
  
  {/* Настройки SEO */}
  <section className="mb-8">
    <h2>Настройки SEO</h2>
    {/* Поля для sitemap и SEO */}
  </section>
  
  {/* Редактор контента */}
  <section className="mb-8">
    <h2>Основной контент поста</h2>
    <TiptapEditor />
  </section>
  
  {/* Кнопки действий */}
  <div className="mt-8 flex justify-end space-x-4">
    {/* Кнопки сохранения/публикации */}
  </div>
</form>
```

## Формы и валидация

### Модель данных

Для страниц создания и редактирования постов используется единый интерфейс данных формы:

```typescript
interface PostFormData {
  title: string;           // Заголовок поста
  slug?: string;           // URL-идентификатор (опционально, генерируется автоматически)
  description: string;     // Краткое описание/аннотация
  body: JSONContent;      // Содержимое в формате Tiptap JSON
  is_published: boolean;   // Флаг публикации
  sitemap_include: boolean;// Включение в sitemap
  sitemap_priority: number;// Приоритет в sitemap (0.0-1.0)
  sitemap_changefreq: string; // Частота изменений в sitemap
  tags: number[];         // Массив ID выбранных тегов
}
```

### Схема валидации

Валидация данных осуществляется с помощью библиотеки Zod:

```typescript
const MAX_TITLE_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 160;

const postSchema = z.object({
  title: z
    .string()
    .min(1, "Заголовок обязателен")
    .max(
      MAX_TITLE_LENGTH,
      `Заголовок не должен превышать ${MAX_TITLE_LENGTH} символов`,
    ),
  slug: z.string().optional(), // Слаг генерируется автоматически
  description: z
    .string()
    .min(1, "Описание обязательно")
    .max(
      MAX_DESCRIPTION_LENGTH,
      `Описание не должно превышать ${MAX_DESCRIPTION_LENGTH} символов`,
    ),
  body: z.custom<JSONContent>().refine(
    (val) => val !== undefined && val !== null, 
    { message: "Body is required" }
  ),
  is_published: z.boolean(),
  sitemap_include: z.boolean(),
  sitemap_priority: z.number().min(0).max(1),
  sitemap_changefreq: z.string(),
  tags: z.array(z.number()),
});
```

### Управление формой

Для управления формой используется библиотека React Hook Form с Zod валидатором:

```typescript
const {
  control,
  handleSubmit,
  watch,
  setValue,
  formState: { errors },
} = useForm<PostFormData>({
  resolver: zodResolver(postSchema),
  defaultValues: {
    title: "",
    slug: "",
    description: "",
    body: { type: "doc", content: [] },
    is_published: false,
    sitemap_include: true,
    sitemap_priority: 0.5,
    sitemap_changefreq: "monthly",
    tags: [],
  },
});
```

### Автоматическая генерация слага

Слаг генерируется автоматически на основе заголовка с помощью библиотеки slugify:

```typescript
// Наблюдение за изменением заголовка
const title = watch("title");

// Эффект для автоматического создания слага при изменении заголовка
useEffect(() => {
  if (title) {
    const generatedSlug = slugify(title, {
      lower: true,      // Преобразование в нижний регистр
      strict: true,     // Строгое преобразование
      locale: "ru",     // Локализация для корректной транслитерации
    });
    setValue("slug", generatedSlug);
  }
}, [title, setValue]);
```

## UI-компоненты

### Компонент TiptapEditor

Основной компонент редактирования контента поста использует библиотеку Tiptap для WYSIWYG-редактирования:

```typescript
interface TiptapEditorProps {
  content: unknown; // Начальное содержимое (JSON или HTML)
  onChange: (content: unknown) => void; // Функция обратного вызова при изменении
  editable?: boolean; // Флаг редактируемости
}
```

Основные возможности редактора:

1. **Форматирование текста**:
   - Жирный, курсив, подчеркнутый, зачеркнутый текст
   - Заголовки (H1-H4)
   - Списки (маркированные и нумерованные)
   - Цитаты
   - Выравнивание текста (по левому краю, по центру, по правому краю, по ширине)

2. **Расширенные возможности**:
   - Вставка и редактирование изображений
   - Создание галерей из нескольких изображений
   - Вставка и форматирование таблиц
   - Вставка блоков кода с подсветкой синтаксиса
   - Создание ссылок

3. **Панель инструментов**:
```jsx
<div className="flex flex-wrap gap-1 mb-2 border-b pb-2">
  {/* Блок форматирования текста */}
  <MenuButton
    onClick={() => editor.chain().focus().toggleBold().run()}
    disabled={!editor.can().chain().focus().toggleBold().run()}
    isActive={editor.isActive("bold")}
    title="Полужирный"
  >
    <FaBold />
  </MenuButton>
  
  {/* Другие кнопки форматирования... */}
  
  {/* Блок вставки изображений/медиа */}
  <div className="border-l pl-2 ml-2">
    <MenuButton
      onClick={() => setIsImageModalOpen(true)}
      title="Вставить изображение"
    >
      <FaImage />
    </MenuButton>
  </div>
</div>
```

### Компонент ImageUploader

Компонент для загрузки изображений:

```typescript
interface ImageUploaderProps {
  label?: string;  // Текст метки
  multiple?: boolean; // Флаг множественной загрузки
  onUploadComplete: (url: string | string[]) => void; // Обработчик завершения загрузки
  cropMode?: "avatar" | "thumbnail" | "content"; // Режим обрезки
}
```

Функциональность компонента:
1. Загрузка файлов через диалоговое окно
2. Загрузка через drag-and-drop
3. Предварительный просмотр изображений
4. Обрезка изображений перед загрузкой
5. Индикация прогресса загрузки

### Управление тегами

Интерфейс выбора тегов представлен в виде набора чекбоксов:

```jsx
<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
  {allTags.map((tag) => (
    <div key={tag.id} className="flex items-center">
      <input
        type="checkbox"
        id={`tag-${tag.id}`}
        className="checkbox-style"
        checked={selectedTagIds.includes(tag.id)}
        onChange={() => handleTagChange(tag.id)}
      />
      <label
        htmlFor={`tag-${tag.id}`}
        className="ml-2 text-sm text-gray-700"
      >
        {tag.name}
      </label>
    </div>
  ))}
</div>
```

### Настройки SEO и Sitemap

Раздел настроек SEO включает следующие элементы:

```jsx
<section className="mb-8 p-4 bg-gray-50 rounded-md">
  <h2 className="text-xl font-semibold mb-4">Настройки SEO и Sitemap</h2>
  
  {/* Включение в sitemap */}
  <div className="mb-4">
    <input
      type="checkbox"
      id="sitemap_include"
      className="checkbox-style"
      checked={post.sitemap_include}
      onChange={(e) =>
        setPost((prev) => ({
          ...prev,
          sitemap_include: e.target.checked,
        }))
      }
    />
    <label
      htmlFor="sitemap_include"
      className="ml-2 text-sm text-gray-700"
    >
      Включить в Sitemap
    </label>
  </div>
  
  {/* Приоритет в Sitemap */}
  <div className="mb-4">
    <label htmlFor="sitemap_priority" className="label-style">
      Приоритет (0.0 - 1.0)
    </label>
    <input
      type="number"
      step="0.1"
      min="0"
      max="1"
      name="sitemap_priority"
      id="sitemap_priority"
      value={(post.sitemap_priority ?? 0.5)}
      onChange={(e) =>
        setPost((prev) => ({
          ...prev,
          sitemap_priority: parseFloat(e.target.value),
        }))
      }
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
    />
  </div>
  
  {/* Частота изменений */}
  <div>
    <label htmlFor="sitemap_changefreq" className="label-style">
      Частота изменений
    </label>
    <select
      name="sitemap_changefreq"
      id="sitemap_changefreq"
      value={(post.sitemap_changefreq ?? "monthly")}
      onChange={(e) =>
        setPost((prev) => ({
          ...prev,
          sitemap_changefreq: e.target.value,
        }))
      }
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
    >
      <option value="always">Всегда</option>
      <option value="hourly">Ежечасно</option>
      <option value="daily">Ежедневно</option>
      <option value="weekly">Еженедельно</option>
      <option value="monthly">Ежемесячно</option>
      <option value="yearly">Ежегодно</option>
      <option value="never">Никогда</option>
    </select>
  </div>
</section>
```

## API-взаимодействие

### Структура API-клиента

Для взаимодействия с бэкендом используется специальный API-клиент с механизмом аутентификации через JWT-токены:

```typescript
// Обертка над fetch для автоматической работы с токенами
fetchWithAuth = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  // Получаем текущие токены из localStorage
  let currentAccessToken = localStorage.getItem("accessToken");
  const currentRefreshToken = localStorage.getItem("refreshToken");
  
  // Логика для проверки, обновления и использования токенов
  // ...
  
  // Добавляем токен в заголовки
  const headers = new Headers(options.headers);
  if (currentAccessToken) {
    headers.set("Authorization", `Bearer ${currentAccessToken}`);
  }
  
  // Выполняем запрос с токеном
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  return response;
};
```

### Эндпоинты API

Основные эндпоинты для работы с постами:

```typescript
// Создание поста
const createPost = async (postData) => {
  const url = buildApiUrl("/api/v1/posts/");
  const response = await fetchWithAuth(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  });
  return response.json();
};

// Получение поста по slug
const getPost = async (slug) => {
  const url = buildApiUrl(`/api/v1/posts/${slug}/`);
  const response = await fetchWithAuth(url);
  return response.json();
};

// Обновление поста
const updatePost = async (slug, postData) => {
  const url = buildApiUrl(`/api/v1/posts/${slug}/`);
  const response = await fetchWithAuth(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  });
  return response.json();
};

// Получение всех тегов
const getAllTags = async () => {
  const url = buildApiUrl("/api/v1/tags/");
  const response = await fetchWithAuth(url);
  return response.json();
};
```

### Обработка ошибок API

При взаимодействии с API используется обработка ошибок:

```typescript
try {
  const response = await fetchWithAuth(url, options);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Ошибка при выполнении запроса");
  }
  // Обработка успешного ответа
} catch (error) {
  console.error("API Error:", error);
  setError(error.message || "Произошла ошибка при взаимодействии с сервером");
  // Дополнительная обработка ошибки
}
```

## Процесс создания поста

### Инициализация формы

При загрузке страницы создания поста выполняются следующие шаги:

1. **Инициализация состояния**:
   ```typescript
   const initialPostState = {
     title: "",
     slug: "",
     description: "",
     body: { type: "doc", content: [] }, // Пустой TipTap JSON
     is_published: false,
     sitemap_include: true,
     sitemap_priority: 0.5,
     sitemap_changefreq: "monthly",
     tags: [],
   };
   ```

2. **Загрузка списка тегов**:
   ```typescript
   useEffect(() => {
     const fetchTags = async () => {
       try {
         const tagsData = await getAllTags();
         setAllTags(tagsData);
       } catch (error) {
         console.error("Ошибка при загрузке тегов:", error);
         setError("Не удалось загрузить теги");
       }
     };
     
     fetchTags();
   }, []);
   ```

### Процесс сохранения/публикации

Процесс сохранения или публикации поста включает следующие шаги:

1. **Сбор данных формы**:
   ```typescript
   const performSaveOrPublish = async (data: PostFormData) => {
     setIsLoadingPageContent(true);
     setError(null);
     
     // Определяем, это публикация или черновик
     const isPublishing = document.activeElement?.textContent?.includes("Опубликовать");
     
     try {
       // Подготавливаем данные для отправки на сервер
       const postData = {
         ...data,
         body: editorContent, // Контент из редактора Tiptap
         is_published: isPublishing,
         tags: selectedTagIds, // ID выбранных тегов
       };
       
       // Отправка данных на сервер
       const response = await createPost(postData);
       
       // Обработка успешного ответа
       setSaveSuccessMessage(isPublishing 
         ? "Пост успешно опубликован!" 
         : "Черновик сохранен");
         
       // Редирект на страницу поста при публикации
       if (isPublishing) {
         setTimeout(() => {
           router.push(`/posts/${response.slug}`);
         }, 1500);
       }
     } catch (error) {
       console.error("Ошибка при сохранении поста:", error);
       setError(error.message || "Не удалось сохранить пост");
     } finally {
       setIsLoadingPageContent(false);
     }
   };
   ```

2. **Автоматическая инвалидация кеша**:
   После создания поста происходит ревалидация кеша для обновления данных на всех связанных страницах:
   ```typescript
   // Запрос на ревалидацию кеша Next.js
   await fetch(`/api/revalidate?tag=posts&secret=${process.env.NEXT_PUBLIC_REVALIDATION_TOKEN}`);
   ```

## Процесс редактирования поста

### Загрузка данных существующего поста

При открытии страницы редактирования выполняется загрузка данных поста по slug:

```typescript
useEffect(() => {
  const fetchPost = async () => {
    if (!params.slug) return;
    
    setIsLoadingPageContent(true);
    setError(null);
    
    try {
      // Запрос данных поста по slug
      const postData = await getPost(params.slug);
      
      // Обновление состояния формы загруженными данными
      setPost(postData);
      
      // Установка выбранных тегов
      if (postData.tags && Array.isArray(postData.tags)) {
        setSelectedTagIds(postData.tags.map((tag) => tag.id));
      }
      
      // Установка содержимого редактора
      if (postData.body) {
        setEditorContent(postData.body);
      }
      
      // Заполнение формы данными
      reset({
        title: postData.title || "",
        slug: postData.slug || "",
        description: postData.description || "",
        body: postData.body || { type: "doc", content: [] },
        is_published: postData.is_published || false,
        sitemap_include: postData.sitemap_include ?? true,
        sitemap_priority: postData.sitemap_priority ?? 0.5,
        sitemap_changefreq: postData.sitemap_changefreq || "monthly",
        tags: postData.tags?.map((tag) => tag.id) || [],
      });
    } catch (error) {
      console.error("Ошибка при загрузке поста:", error);
      setError("Не удалось загрузить данные поста");
    } finally {
      setIsLoadingPageContent(false);
    }
  };
  
  if (user) {
    fetchPost();
  }
}, [params.slug, user, reset]);
```

### Сохранение изменений

Процесс сохранения изменений поста:

```typescript
const onSubmit: SubmitHandler<PostFormData> = async (data) => {
  setIsLoadingPageContent(true);
  setError(null);
  
  try {
    // Подготовка данных для обновления
    const updateData = {
      ...data,
      body: editorContent, // Содержимое из редактора Tiptap
      tags: selectedTagIds, // ID выбранных тегов
    };
    
    // Отправка запроса на обновление
    await updatePost(params.slug, updateData);
    
    // Успешное обновление
    setSaveSuccessMessage("Изменения сохранены");
    
    // Ревалидация кеша
    await fetch(`/api/revalidate?tag=posts&slug=${params.slug}&secret=${process.env.NEXT_PUBLIC_REVALIDATION_TOKEN}`);
  } catch (error) {
    console.error("Ошибка при обновлении поста:", error);
    setError(error.message || "Не удалось обновить пост");
  } finally {
    setIsLoadingPageContent(false);
  }
};
```

## Работа с тегами

### Структура данных тегов

В системе тегирования постов используется следующая структура данных:

```typescript
interface Tag {
  id: number;        // Уникальный идентификатор тега
  name: string;      // Название тега
  slug: string;      // URL-идентификатор тега
  description?: string; // Опциональное описание тега
  post_count?: number;  // Количество связанных постов (для статистики)
}
```

### Загрузка и отображение тегов

Процесс загрузки тегов происходит при инициализации страницы:

```typescript
// Функция загрузки всех тегов
const fetchAllTags = async () => {
  try {
    const url = buildApiUrl("/api/v1/tags/");
    const response = await fetchWithAuth(url);
    
    if (!response.ok) {
      throw new Error("Ошибка при загрузке тегов");
    }
    
    const tagsData = await response.json();
    setAllTags(tagsData);
  } catch (error) {
    console.error("Ошибка при загрузке тегов:", error);
    setError("Не удалось загрузить список тегов");
  }
};
```

Теги отображаются в интерфейсе в виде группы чекбоксов для выбора:

```jsx
<section className="mb-8">
  <h2 className="text-xl font-semibold mb-4">Теги</h2>
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
    {allTags.map((tag) => (
      <div key={tag.id} className="flex items-center">
        <input
          type="checkbox"
          id={`tag-${tag.id}`}
          className="checkbox-style"
          checked={selectedTagIds.includes(tag.id)}
          onChange={() => handleTagChange(tag.id)}
        />
        <label
          htmlFor={`tag-${tag.id}`}
          className="ml-2 text-sm text-gray-700"
        >
          {tag.name}
        </label>
      </div>
    ))}
  </div>
</section>
```

### Механизм выбора тегов

Логика обработки выбора тегов реализована через функцию переключения:

```typescript
const handleTagChange = (tagId: number) => {
  setSelectedTagIds((prevSelected) => {
    // Если ID уже выбран - удаляем его, иначе добавляем
    if (prevSelected.includes(tagId)) {
      return prevSelected.filter((id) => id !== tagId);
    } else {
      return [...prevSelected, tagId];
    }
  });
};
```

При отправке данных поста выбранные теги преобразуются в массив ID и передаются на сервер в составе данных поста.

## Настройки SEO

### Структура данных SEO

Для управления настройками SEO и Sitemap в форме поста используются следующие поля:

```typescript
interface SEOSettings {
  sitemap_include: boolean;     // Включать ли страницу в sitemap
  sitemap_priority: number;     // Приоритет страницы (от 0.0 до 1.0)
  sitemap_changefreq: string;   // Частота изменений (daily, weekly, monthly и т.д.)
  meta_description?: string;    // Мета-описание для поисковых систем
  meta_keywords?: string;       // Ключевые слова для мета-тегов
}
```

### UI для настройки SEO

Интерфейс настройки SEO представлен в виде отдельной секции формы:

```jsx
<section className="mb-8 p-4 bg-gray-50 rounded-md">
  <h2 className="text-xl font-semibold mb-4">Настройки SEO и Sitemap</h2>
  
  {/* Включение в sitemap */}
  <div className="mb-4 flex items-center">
    <input
      type="checkbox"
      id="sitemap_include"
      checked={post.sitemap_include}
      onChange={(e) => {
        setPost((prev) => ({
          ...prev,
          sitemap_include: e.target.checked,
        }));
      }}
      className="mr-2"
    />
    <label htmlFor="sitemap_include">
      Включить страницу в sitemap
    </label>
  </div>
  
  {/* Приоритет в sitemap */}
  <div className="mb-4">
    <label htmlFor="sitemap_priority" className="label-style">
      Приоритет страницы (0.0 - 1.0)
    </label>
    <input
      type="number"
      id="sitemap_priority"
      min="0"
      max="1"
      step="0.1"
      value={post.sitemap_priority}
      onChange={(e) => {
        setPost((prev) => ({
          ...prev,
          sitemap_priority: parseFloat(e.target.value),
        }));
      }}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
    />
  </div>
  
  {/* Частота изменений */}
  <div>
    <label htmlFor="sitemap_changefreq" className="label-style">
      Частота изменений
    </label>
    <select
      id="sitemap_changefreq"
      value={post.sitemap_changefreq || "monthly"}
      onChange={(e) => {
        setPost((prev) => ({
          ...prev,
          sitemap_changefreq: e.target.value,
        }));
      }}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
    >
      <option value="always">Всегда</option>
      <option value="hourly">Ежечасно</option>
      <option value="daily">Ежедневно</option>
      <option value="weekly">Еженедельно</option>
      <option value="monthly">Ежемесячно</option>
      <option value="yearly">Ежегодно</option>
      <option value="never">Никогда</option>
    </select>
  </div>
</section>
```

### Ревалидация кеша и обновление SEO

После сохранения или обновления поста вызывается API ревалидации кеша Next.js для обеспечения актуальности SEO данных:

```typescript
// Запрос на ревалидацию кеша после создания поста
await fetch(
  `/api/revalidate?tag=posts&secret=${process.env.NEXT_PUBLIC_REVALIDATION_TOKEN}`
);

// Запрос на ревалидацию кеша после обновления конкретного поста
await fetch(
  `/api/revalidate?tag=posts&slug=${params.slug}&secret=${process.env.NEXT_PUBLIC_REVALIDATION_TOKEN}`
);
```

Это обеспечивает обновление статических страниц и sitemap.xml с актуальными настройками SEO после внесения изменений.

## Лучшие практики

### Оптимизация формы и UX

1. **Предотвращение случайной потери данных**:
   - Использование состояния `isDirty` из React Hook Form для отслеживания изменений
   - Предупреждение пользователя при попытке закрыть страницу с несохраненными изменениями

2. **Оптимизация работы с изображениями**:
   - Компрессия изображений перед загрузкой
   - Предварительный просмотр и обрезка изображений перед сохранением
   - Индикаторы прогресса загрузки

3. **Управление состоянием загрузки**:
   - Блокировка кнопок и полей ввода во время отправки данных
   - Индикация процесса загрузки данных через спиннеры и скелетоны
   - Тост-уведомления о результате операций

### Безопасность

1. **Защита маршрутов**:
   ```jsx
   // Компонент защиты маршрутов администратора
   export default function ProtectedRoute({ children }) {
     const { user, isLoading } = useUser();
     const router = useRouter();
     
     useEffect(() => {
       if (!isLoading && !user) {
         router.push("/login");
       }
     }, [user, isLoading, router]);
     
     if (isLoading) {
       return <LoadingSpinner />;
     }
     
     return user ? <>{children}</> : null;
   }
   ```

2. **Валидация данных**:
   - Двойная валидация на клиенте и сервере
   - Использование Zod для создания строгих схем валидации
   - Очистка HTML-контента от потенциально опасных скриптов

### Производительность и масштабируемость

1. **Оптимизация редактора контента**:
   - Отложенная загрузка компонентов редактора
   - Разделение на подкомпоненты для уменьшения перерисовок
   - Оптимизация работы с большими объемами текста

2. **Кеширование и ревалидация**:
   - Использование Next.js On-Demand Revalidation API
   - Точечная инвалидация кеша только для изменившихся страниц
   - Стратегия стейл-вайл-ревалидейт для быстрой загрузки страниц

3. **Мониторинг и отладка**:
   - Структурированное логгирование ошибок
   - Система обнаружения и отчетов о проблемах
   - Анализ производительности отрисовки компонентов через React Developer Tools
