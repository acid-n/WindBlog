"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import TiptapEditor from "@/components/tiptap-editor";
import { JSONContent } from "@tiptap/react";
import { Post, Tag } from "@/types/blog";
import { useAuth } from "@/contexts/AuthContext";
import slugify from "slugify";
import { fetchWithAuth } from "@/services/apiClient";
import ImageUploader from "@/components/image-uploader";
import { getBackendOrigin } from "@/lib/getBaseUrl";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Схема валидации с учетом максимальной длины
const MAX_TITLE_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 160;

// Интерфейс для формы создания поста
export interface PostFormData {
  title: string;
  slug?: string;
  description: string;
  body: JSONContent;
  is_published: boolean;
  sitemap_include: boolean;
  sitemap_priority: number;
  sitemap_changefreq: string;
  tags: number[];
}

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
  body: z
    .custom<JSONContent>()
    .refine((val) => val !== undefined && val !== null, {
      message: "Body is required",
    }), // Для TipTap JSONContent
  is_published: z.boolean(),
  sitemap_include: z.boolean(),
  sitemap_priority: z.number().min(0).max(1),
  sitemap_changefreq: z.string(),
  tags: z.array(z.number()),
});

const CreatePostPage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Начальное состояние для нового поста
  // Расширяем Post для поддержки нужных полей
  interface PostExtended extends Post {
    is_published?: boolean;
    sitemap_include?: boolean;
    sitemap_priority?: number;
    sitemap_changefreq?: string;
  }

  const initialPostState: Partial<PostExtended> = {
    title: "",
    slug: "",
    description: "",
    body: { type: "doc", content: [] }, // Пустой TipTap JSON по умолчанию
    is_published: false,
    sitemap_include: true,
    sitemap_priority: 0.5,
    sitemap_changefreq: "monthly",
    tags: [], // Это поле теперь будет содержать массив ID выбранных тегов
    // first_published_at будет устанавливаться на бэкенде при первой публикации
  };

  const [post, setPost] = useState<Partial<PostExtended>>(initialPostState);
  const [allTags, setAllTags] = useState<Tag[]>([]); // Для списка всех тегов
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]); // Для ID выбранных тегов
  const [isLoadingPageContent, setIsLoadingPageContent] = useState(false); // Изначально не грузим контент
  const [error, setError] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState<JSONContent>(
    initialPostState.body as JSONContent,
  );
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(
    null,
  );
  const successMessageTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Состояния для загрузчика изображений

  const [imagePreview] = useState<string | null>(null);

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

  const titleValue = watch("title");
  const descriptionValue = watch("description");

  useEffect(() => {
    return () => {
      if (successMessageTimerRef.current) {
        clearTimeout(successMessageTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?next=/admin/create-post"); // Редирект, если не авторизован
      return;
    }
    // Загрузка всех тегов
    const fetchAllTags = async () => {
      try {
        const response = await fetchWithAuth(
          `${getBackendOrigin()}/api/v1/tags/?limit=200`,
        );
        if (!response.ok) throw new Error("Failed to fetch tags");
        const data: { results: Tag[] } = await response.json();
        setAllTags(data.results || []);
      } catch (e: unknown) {
        if (e instanceof Error) {
          console.error("Error fetching tags:", e);
          setError((prevError) =>
            prevError ? `${prevError}; ${e.message}` : e.message,
          );
        }
      }
    };
    if (user) {
      fetchAllTags();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Автоматическая генерация слага из заголовка
    if (titleValue) {
      const generatedSlug = slugify(titleValue, {
        lower: true,
        strict: true,
        locale: "ru",
      });
      // Устанавливаем значение слага в форме, если оно еще не было установлено вручную
      // или если текущее значение слага является результатом предыдущей генерации из старого заголовка.
      // Это позволяет пользователю отредактировать слаг вручную, и он не будет перезаписан.
      // Однако, если пользователь изменит заголовок, слаг должен обновиться.
      // Чтобы точно определить, был ли слаг изменен вручную, нужен дополнительный флаг или сравнение.
      // Пока что, для простоты, будем обновлять слаг всегда при изменении заголовка.
      // Если вы хотите разрешить ручное редактирование слага, которое не перезаписывается,
      // потребуется более сложная логика.
      setValue("slug", generatedSlug, { shouldValidate: true });
    } else {
      // Очищаем слаг, если заголовок пуст
      setValue("slug", "", { shouldValidate: true });
    }
  }, [titleValue, setValue]);

  const handleTagChange = (tagId: number) => {
    setSelectedTagIds((prevSelectedTagIds) =>
      prevSelectedTagIds.includes(tagId)
        ? prevSelectedTagIds.filter((id) => id !== tagId)
        : [...prevSelectedTagIds, tagId],
    );
  };

  const performSaveOrPublish: SubmitHandler<PostFormData> = async (
    data: PostFormData,
  ) => {
    if (!editorContent || !user) {
      setError(
        "Невозможно сохранить пост: пользователь не аутентифицирован или нет основного контента.",
      );
      setIsLoadingPageContent(false);
      return;
    }
    if (!data.title || !data.slug) {
      setError(
        "Заголовок и URL (слаг) обязательны для заполнения (проверка в performSaveOrPublish).",
      );
      setIsLoadingPageContent(false);
      return;
    }

    setIsLoadingPageContent(true);
    setError(null);
    setSaveSuccessMessage(null);
    if (successMessageTimerRef.current)
      clearTimeout(successMessageTimerRef.current);

    const postDataToSave: Record<string, unknown> = {
      title: data.title,
      slug: data.slug,
      description: data.description,
      body: editorContent,

      is_published: data.is_published,

      first_published_at:
        data.is_published && post.first_published_at
          ? new Date(post.first_published_at).toISOString()
          : null,

      sitemap_priority:
        (post.sitemap_priority ?? 0.5)
          ? parseFloat(String(post.sitemap_priority ?? 0.5))
          : 0.5,
      sitemap_include: post.sitemap_include ?? true,
      sitemap_changefreq: post.sitemap_changefreq ?? "monthly",

      tags: selectedTagIds,
      image: post.image,
    };

    delete postDataToSave.id;

    try {
      // Отправляем POST запрос для создания
      const response = await fetchWithAuth(
        `${getBackendOrigin()}/api/v1/posts/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(postDataToSave),
        },
      );

      if (!response.ok) {
        let errorDetail = `HTTP ошибка: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && typeof errorData === "object") {
            // Пытаемся обработать стандартные ошибки Django REST Framework / ValidationError
            if (errorData.detail) {
              errorDetail = String(errorData.detail);
            } else if (errorData.message) {
              // Если есть общее сообщение
              errorDetail = String(errorData.message);
            } else {
              // Если это словарь ошибок по полям (типично для ValidationError)
              const fieldErrors = Object.entries(errorData)
                .map(([key, value]) => {
                  const messages = Array.isArray(value)
                    ? value.join(", ")
                    : String(value);
                  return `${key}: ${messages}`;
                })
                .join("; ");
              if (fieldErrors) errorDetail = fieldErrors;
              else errorDetail = JSON.stringify(errorData); // В крайнем случае
            }
          } else if (errorData) {
            // Если не объект, но что-то есть
            errorDetail = String(errorData);
          }
        } catch (jsonError) {
          console.error("Ошибка парсинга JSON ответа с ошибкой:", jsonError);
          // Если тело ответа не JSON, errorDetail останется `HTTP ошибка: ${response.status}`
        }
        throw new Error(errorDetail);
      }

      const newPostData: Post = await response.json();

      setSaveSuccessMessage("Пост успешно создан! Запуск ревалидации кэша...");
      successMessageTimerRef.current = setTimeout(
        () => setSaveSuccessMessage(null),
        5000,
      );

      window.scrollTo({ top: 0, behavior: "smooth" });

      // --- НАЧАЛО: Обновленный блок ревалидации (используя revalidatePath) ---
      const revalidateSecret = process.env.NEXT_PUBLIC_REVALIDATE_SECRET_TOKEN;
      if (!revalidateSecret) {
        console.warn(
          "NEXT_PUBLIC_REVALIDATE_SECRET_TOKEN не доступен на клиенте. Пропуск шага ревалидации.",
        );
        // Редирект даже если нет секрета
        setTimeout(() => {
          if ((newPostData as Partial<PostExtended>)?.slug) {
            if ((newPostData as Partial<PostExtended>)?.is_published) {
              router.push(
                `/posts/${(newPostData as Partial<PostExtended>)?.slug}`,
              );
            } else {
              router.push(`/admin/drafts`);
            }
          }
        }, 1500);
      } else {
        const pathsToRevalidate = ["/blog", "/"];
        if (
          newPostData &&
          (newPostData as Partial<PostExtended>).slug &&
          (newPostData as Partial<PostExtended>).is_published
        ) {
          pathsToRevalidate.push(
            `/posts/${(newPostData as Partial<PostExtended>).slug}`,
          );
        }
        // pathsToRevalidate.push('/');

        const revalidationPromises = pathsToRevalidate.map((path) =>
          fetch(
            `/api/revalidate?path=${encodeURIComponent(path)}&secret=${revalidateSecret}`,
          )
            .then((res) => {
              if (!res.ok) {
                return res.json().then((err) => Promise.reject(err));
              }
              return res.json();
            })
            .catch((err) =>
              console.error(`Ошибка при ревалидации ${path}:`, err),
            ),
        );

        Promise.all(revalidationPromises)
          .then(() => {
            setSaveSuccessMessage("Пост создан. Кэш обновлен.");
          })
          .catch(() => {
            setSaveSuccessMessage(
              "Пост создан, но были ошибки при обновлении кэша.",
            );
          })
          .finally(() => {
            // Редирект после завершения всех запросов на ревалидацию
            setTimeout(() => {
              if (newPostData?.slug) {
                if ((newPostData as Partial<PostExtended>).is_published) {
                  router.push(
                    `/posts/${(newPostData as Partial<PostExtended>).slug}`,
                  );
                } else {
                  router.push(`/admin/drafts`);
                }
              }
            }, 3000); // Увеличена задержка до 3 секунд
          });
      }
      // --- КОНЕЦ: Обновленный блок ревалидации ---
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error("Error creating post:", e);
        setError(e.message);
      } else {
        setError("Unknown error");
      }
    } finally {
      setIsLoadingPageContent(false);
    }
  };

  // Функция для обработки завершения загрузки изображения
  const handleImageUploadComplete = useCallback((uploadedUrl: string) => {
    setPost((prevPost) => ({
      ...prevPost,
      image: uploadedUrl,
    }));
  }, []);

  if (authLoading)
    return <p className="text-center py-10">Проверка аутентификации...</p>;
  if (!user && !authLoading) {
    return (
      <p className="text-center py-10">
        Для доступа к этой странице необходимо войти в систему.
      </p>
    );
  }
  // Состояние загрузки страницы здесь не так актуально, как при редактировании
  // if (isLoadingPageContent && !post && !error && user) return <p>Загрузка...</p>;
  if (error && !isLoadingPageContent && !saveSuccessMessage)
    return <p className="text-center py-10 text-red-500">Ошибка: {error}</p>;
  // if (!post && !isLoadingPageContent && !error) return <p>Пост не найден.</p>; // Неактуально для создания
  // if (!post) return null; // post всегда будет (initialPostState)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Создать новый пост</h1>
      {saveSuccessMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {saveSuccessMessage}
        </div>
      )}
      {error && !saveSuccessMessage && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(performSaveOrPublish)} className="space-y-6">
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Основные данные</h2>

          <div className="mb-4">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Заголовок <span className="text-red-500">*</span>
            </label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  id="title"
                  type="text"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base py-2 px-3 transition-colors duration-150 ease-in-out ${
                    errors.title ? "border-red-500" : ""
                  }`}
                  maxLength={MAX_TITLE_LENGTH}
                />
              )}
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>
                {errors.title ? (
                  <p className="text-red-500">{errors.title.message}</p>
                ) : (
                  "\u00A0"
                )}
              </span>
              <span>
                {titleValue.length}/{MAX_TITLE_LENGTH}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="slug"
              className="block text-sm font-medium text-gray-700"
            >
              URL (слаг) <span className="text-red-500">*</span>
            </label>
            <Controller
              name="slug"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  id="slug"
                  type="text"
                  className={`mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base py-2 px-3 transition-colors duration-150 ease-in-out ${
                    errors.slug ? "border-red-500" : ""
                  }`}
                  placeholder="генерируется из заголовка"
                  readOnly
                />
              )}
            />
            {errors.slug && (
              <p className="mt-1 text-xs text-red-500">{errors.slug.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Описание (аннотация) <span className="text-red-500">*</span>
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  id="description"
                  rows={4}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base py-2 px-3 transition-colors duration-150 ease-in-out ${
                    errors.description ? "border-red-500" : ""
                  }`}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                />
              )}
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>
                {errors.description ? (
                  <p className="text-red-500">{errors.description.message}</p>
                ) : (
                  "\u00A0"
                )}
              </span>
              <span>
                {descriptionValue.length}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="main_image"
              className="block text-sm font-medium text-gray-700"
            >
              Основное изображение (анонс)
            </label>
            <ImageUploader
              label="Загрузить изображение"
              initialImageUrl={imagePreview}
              onUploadComplete={handleImageUploadComplete}
            />
          </div>
        </section>

        <section className="mb-8 p-4 border rounded-md shadow-sm bg-white">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Теги</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allTags.map((tag) => (
              <div key={tag.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`tag-${tag.id}`}
                  name={`tag-${tag.id}`}
                  checked={selectedTagIds.includes(tag.id)}
                  onChange={() => handleTagChange(tag.id)}
                  className="checkbox-style"
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

        <section className="mb-8 p-4 border rounded-md shadow-sm bg-white">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Даты</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="first_published_at" className="label-style">
                Дата первой публикации
              </label>
              <input
                type="datetime-local"
                name="first_published_at"
                id="first_published_at"
                value={
                  post.first_published_at
                    ? new Date(post.first_published_at)
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  setPost((prev) => ({
                    ...prev,
                    first_published_at: e.target.value,
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base py-2 px-3 transition-colors duration-150 ease-in-out bg-white text-gray-900 leading-normal"
                disabled={!(post.is_published ?? false)}
              />
              {!(post.is_published ?? false) && (
                <p className="text-xs text-gray-500 mt-1">
                  Установится автоматически при установке флага
                  &quot;Опубликовано&quot; и сохранении, если не задано.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="mb-8 p-4 border rounded-md shadow-sm bg-white">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">
            Настройки Sitemap
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="sitemap_include"
                id="sitemap_include"
                checked={!!(post.sitemap_include ?? true)}
                onChange={(e) =>
                  setPost((prev) => ({
                    ...prev,
                    sitemap_include: e.target.checked,
                  }))
                }
                className="checkbox-style"
              />
              <label
                htmlFor="sitemap_include"
                className="ml-2 block text-sm text-gray-900"
              >
                Включить в Sitemap
              </label>
            </div>
            <div>
              <label htmlFor="sitemap_priority" className="label-style">
                Приоритет (0.0-1.0)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                name="sitemap_priority"
                id="sitemap_priority"
                value={post.sitemap_priority ?? 0.5 ?? 0.5}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPost((prev) => ({
                    ...prev,
                    sitemap_priority: parseFloat(e.target.value),
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base py-2 px-3 transition-colors duration-150 ease-in-out bg-white text-gray-900 leading-normal"
              />
            </div>
            <div>
              <label htmlFor="sitemap_changefreq" className="label-style">
                Частота изменений
              </label>
              <select
                name="sitemap_changefreq"
                id="sitemap_changefreq"
                value={(post.sitemap_changefreq ?? "monthly") || "monthly"}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setPost((prev) => ({
                    ...prev,
                    sitemap_changefreq: e.target.value as string,
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base py-2 px-3 transition-colors duration-150 ease-in-out bg-white text-gray-900 leading-normal"
              >
                <option value="always">Always</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="never">Never</option>
              </select>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">
            Основной контент поста
          </h2>
          <TiptapEditor
            content={editorContent}
            onChange={(content) => setEditorContent(content as JSONContent)}
          />
        </section>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleSubmit(performSaveOrPublish)}
            disabled={isLoadingPageContent}
            className="px-6 py-2.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Сохранить черновик
          </button>
          <button
            type="button"
            onClick={handleSubmit(performSaveOrPublish)}
            disabled={isLoadingPageContent}
            className="px-6 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingPageContent ? "Публикация..." : "Опубликовать"}
          </button>
        </div>
      </form>

      <style jsx>{`
        .label-style {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.25rem;
        }
        .checkbox-style {
          height: 1rem;
          width: 1rem;
          color: #4f46e5;
          border-color: #d1d5db;
          border-radius: 0.25rem;
        }
        .checkbox-style:focus {
          --tw-ring-color: #4f46e5;
          box-shadow: var(--tw-ring-inset) 0 0 0
            calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
        }
      `}</style>
    </div>
  );
};

export default CreatePostPage;
