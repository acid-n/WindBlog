"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TiptapEditor from "@/components/tiptap-editor";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { JSONContent } from "@tiptap/react";
import { Post, Tag } from "@/types/blog";
import { useAuth } from "@/contexts/AuthContext";
import slugify from "slugify";
import { fetchWithAuth, buildApiUrl } from "@/services/apiClient";
import ImageUploader from "@/components/image-uploader";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Схема валидации с учетом максимальной длины
const MAX_TITLE_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 160;

// Интерфейс для формы редактирования поста
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
  body: z.custom<JSONContent>().refine((val) => val !== undefined && val !== null, { message: "Body is required" }), // Для TipTap JSONContent
  is_published: z.boolean(),
  sitemap_include: z.boolean(),
  sitemap_priority: z.number().min(0).max(1),
  sitemap_changefreq: z.string(),
  tags: z.array(z.number()),
});

const EditPostPage = ({ params }: { params: { slug: string } }) => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

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
    body: { type: "doc", content: [] },
    is_published: false,
    sitemap_include: true,
    sitemap_priority: 0.5,
    sitemap_changefreq: "monthly",
    tags: [],
  };

  const [post, setPost] = useState<Partial<PostExtended>>(initialPostState);
  const [allTags, setAllTags] = useState<Tag[]>([]); // Для списка всех тегов
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]); // Для ID выбранных тегов
  const [isLoadingPageContent, setIsLoadingPageContent] = useState(true); // Начинаем с загрузки контента
  const [error, setError] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState<JSONContent>(
    initialPostState.body as JSONContent,
  );
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const successMessageTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Состояния для загрузчика изображений
  const [imagePreview] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
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

  // Загрузка данных поста для редактирования
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('Пользователь не авторизован, перенаправляем на страницу входа');
      router.push(`/login?next=/admin/edit-post/${params.slug}`); // Редирект, если не авторизован
      return;
    }

    // Загрузка поста по slug
    const fetchPost = async () => {
      if (!params.slug) {
        console.error('Отсутствует slug поста');
        return;
      }
      
      if (!user) {
        console.error('Пользователь не авторизован при попытке загрузить пост');
        return;
      }
      
      try {
        setIsLoadingPageContent(true);
        setError(null);
        
        // Добавляем логирование для отладки
        console.log(`Загружаем пост по slug: ${params.slug}`);
        
        const apiUrl = buildApiUrl(`posts/${params.slug}/`);
        console.log(`URL для загрузки поста: ${apiUrl}`);
        
        // Явно добавляем токен авторизации в заголовки
        const token = localStorage.getItem("accessToken");
        console.log(`Токен доступен: ${Boolean(token)}`);
        
        const headers = new Headers();
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        headers.set('Content-Type', 'application/json');
        
        const response = await fetchWithAuth(apiUrl, {
          headers,
          credentials: 'include',
        });
        
        if (!response.ok) {
          const responseText = await response.text();
          console.error(`Ошибка загрузки поста: ${response.status}`, responseText);
          throw new Error(`Ошибка загрузки поста: ${response.status}`);
        }
        
        const postData: PostExtended = await response.json();
        setPost(postData);
        setEditorContent(postData.body as JSONContent);
        
        // Устанавливаем значения формы с корректной типизацией
        reset({
          title: postData.title || "",
          slug: postData.slug || "",
          description: postData.description || "",
          body: postData.body as JSONContent,
          is_published: postData.is_published || false,
          sitemap_include: postData.sitemap_include || true,
          sitemap_priority: postData.sitemap_priority || 0.5,
          sitemap_changefreq: postData.sitemap_changefreq || "monthly",
          tags: postData.tags?.map(tag => {
            if (typeof tag === 'object' && tag !== null) {
              // Безопасное приведение типа
              const tagObj = tag as { id?: number };
              return tagObj.id || 0;
            }
            return typeof tag === 'number' ? tag : 0;
          }).filter(id => id > 0) || [],
        });
        
        // Устанавливаем выбранные теги с корректной типизацией
        if (postData.tags && Array.isArray(postData.tags)) {
          const tagIds = postData.tags.map(tag => {
            // Используем безопасную типизацию для тегов
            if (typeof tag === 'object' && tag !== null) {
              // Проверяем наличие свойства id через безопасное приведение типов
              const tagObj = tag as { id?: number };
              return tagObj.id || 0;
            } else if (typeof tag === 'number') {
              return tag;
            }
            return 0;
          }).filter(id => id > 0); // Фильтруем невалидные id
          setSelectedTagIds(tagIds);
        }
      } catch (e) {
        console.error("Ошибка при загрузке поста:", e);
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Неизвестная ошибка при загрузке поста");
        }
      } finally {
        setIsLoadingPageContent(false);
      }
    };

    // Загрузка всех тегов
    const fetchAllTags = async () => {
      try {
        // Добавляем логирование для отладки
        console.log(`Загружаем теги`);
        
        const apiUrl = buildApiUrl('tags/');
        console.log(`URL для загрузки тегов: ${apiUrl}`);
        
        // Явно добавляем токен авторизации в заголовки
        const token = localStorage.getItem("accessToken");
        console.log(`Токен доступен для загрузки тегов: ${Boolean(token)}`);
        
        const headers = new Headers();
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        headers.set('Content-Type', 'application/json');
        
        const response = await fetchWithAuth(apiUrl, {
          headers,
          credentials: 'include',
        });
        
        if (!response.ok) {
          const responseText = await response.text();
          console.error(`Ошибка загрузки тегов: ${response.status}`, responseText);
          throw new Error(`Ошибка загрузки тегов: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Успешно загружены теги:`, data.results ? data.results.length : 0);
        setAllTags(data.results || []); // Используем results для пагинированного ответа
      } catch (err) {
        console.error("Ошибка при загрузке тегов:", err);
        setError("Не удалось загрузить список тегов");
      }
    };

    if (user) {
      fetchPost();
      fetchAllTags();
    }
  }, [user, authLoading, params.slug, router, reset]);

  // Обработка изменения тегов
  const handleTagChange = (tagId: number) => {
    setSelectedTagIds((prevSelectedTagIds) =>
      prevSelectedTagIds.includes(tagId)
        ? prevSelectedTagIds.filter((id) => id !== tagId)
        : [...prevSelectedTagIds, tagId],
    );
  };

  // Функция сохранения изменений поста
  const performSaveOrPublish: SubmitHandler<PostFormData> = async (data: PostFormData) => {
    if (!editorContent || !user) {
      setError(
        "Невозможно сохранить пост: пользователь не аутентифицирован или нет основного контента.",
      );
      setIsLoadingPageContent(false);
      return;
    }
    if (!data.title || !data.slug) {
      setError(
        "Заголовок и URL (слаг) обязательны для заполнения.",
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
      sitemap_priority: (post.sitemap_priority ?? 0.5)
        ? parseFloat(String(post.sitemap_priority ?? 0.5))
        : 0.5,
      sitemap_include: (post.sitemap_include ?? true),
      sitemap_changefreq: (post.sitemap_changefreq ?? "monthly"),
      tags: selectedTagIds,
      image: post.image,
    };

    try {
      // Используем buildApiUrl для корректного формирования URL API
      
      // Используем PUT для обновления существующего поста
      const response = await fetchWithAuth(buildApiUrl(`posts/${params.slug}/`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postDataToSave),
      });

      if (!response.ok) {
        let errorDetail = `HTTP ошибка: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && typeof errorData === "object") {
            if (errorData.detail) {
              errorDetail = String(errorData.detail);
            } else if (errorData.message) {
              errorDetail = String(errorData.message);
            } else {
              const fieldErrors = Object.entries(errorData)
                .map(([key, value]) => {
                  const messages = Array.isArray(value)
                    ? value.join(", ")
                    : String(value);
                  return `${key}: ${messages}`;
                })
                .join("; ");
              if (fieldErrors) errorDetail = fieldErrors;
              else errorDetail = JSON.stringify(errorData);
            }
          } else if (errorData) {
            errorDetail = String(errorData);
          }
        } catch (jsonError) {
          console.error("Ошибка парсинга JSON ответа с ошибкой:", jsonError);
        }
        throw new Error(errorDetail);
      }

      const updatedPostData: Post = await response.json();
      
      setSaveSuccessMessage("Пост успешно обновлен! Запуск ревалидации кэша...");
      successMessageTimerRef.current = setTimeout(
        () => setSaveSuccessMessage(null),
        5000,
      );

      window.scrollTo({ top: 0, behavior: "smooth" });

      // Ревалидация кэша
      const revalidateSecret = process.env.NEXT_PUBLIC_REVALIDATE_SECRET_TOKEN;
      if (!revalidateSecret) {
        console.warn(
          "NEXT_PUBLIC_REVALIDATE_SECRET_TOKEN не доступен на клиенте. Пропуск шага ревалидации.",
        );
        // Редирект даже если нет секрета
        setTimeout(() => {
          if ((updatedPostData as Partial<PostExtended>)?.slug) {
            if ((updatedPostData as Partial<PostExtended>)?.is_published) {
              router.push(`/posts/${(updatedPostData as Partial<PostExtended>)?.slug}`);
            } else {
              router.push(`/admin/drafts`);
            }
          }
        }, 1500);
      } else {
        const pathsToRevalidate = ["/blog", "/"]; 
        if (updatedPostData && (updatedPostData as Partial<PostExtended>).slug && (updatedPostData as Partial<PostExtended>).is_published) {
          pathsToRevalidate.push(`/posts/${(updatedPostData as Partial<PostExtended>).slug}`);
        }

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
            .then((data) => console.log(`Результат ревалидации ${path}:`, data))
            .catch((err) =>
              console.error(`Ошибка при ревалидации ${path}:`, err),
            ),
        );

        Promise.all(revalidationPromises)
          .then(() => {
            setSaveSuccessMessage("Пост обновлен. Кэш обновлен.");
          })
          .catch(() => {
            setSaveSuccessMessage(
              "Пост обновлен, но были ошибки при обновлении кэша.",
            );
          })
          .finally(() => {
            // Редирект после завершения всех запросов на ревалидацию
            setTimeout(() => {
              if (updatedPostData?.slug) {
                if ((updatedPostData as Partial<PostExtended>).is_published) {
                  router.push(`/posts/${(updatedPostData as Partial<PostExtended>).slug}`);
                } else {
                  router.push(`/admin/drafts`);
                }
              }
            }, 3000);
          });
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error("Ошибка обновления поста:", e);
        setError(e.message);
      } else {
        setError("Неизвестная ошибка");
      }
    } finally {
      setIsLoadingPageContent(false);
    }
  };

  // Функция для обработки завершения загрузки изображения
  const handleImageUploadComplete = useCallback((url: string | string[]) => {
    const uploadedUrl = Array.isArray(url) ? url[0] : url;
    console.log("Изображение успешно загружено, URL:", uploadedUrl);
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
  
  if (isLoadingPageContent && !error)
    return <p className="text-center py-10">Загрузка поста...</p>;
  
  if (error && !isLoadingPageContent && !saveSuccessMessage)
    return <p className="text-center py-10 text-red-500">Ошибка: {error}</p>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Редактирование поста: {params.slug}</h1>
      
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
                {titleValue?.length || 0}/{MAX_TITLE_LENGTH}
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
                  rows={3}
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
                {descriptionValue?.length || 0}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Изображение поста (обложка)
            </label>
            <ImageUploader
              onUploadComplete={handleImageUploadComplete}
              initialImageUrl={post.image}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Теги
            </label>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => {
                // Проверяем, что tag имеет свойство id
                if (!tag || typeof tag.id !== 'number') return null;
                
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagChange(tag.id)}
                    className={`px-3 py-1 rounded-full text-sm ${selectedTagIds.includes(tag.id) ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-4">
            <Controller
              name="is_published"
              control={control}
              render={({ field }) => (
                <div className="flex items-center">
                  <input
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    id="is_published"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={field.value}
                  />
                  <label
                    htmlFor="is_published"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Опубликовать пост
                  </label>
                </div>
              )}
            />
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Содержание поста</h2>
          <div className="prose max-w-none">
            <TiptapEditor
              content={editorContent}
              onChange={(content) => setEditorContent(content as JSONContent)}
              editable={true}
            />
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">SEO настройки</h2>
          
          <div className="mb-4">
            <Controller
              name="sitemap_include"
              control={control}
              render={({ field }) => (
                <div className="flex items-center">
                  <input
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    id="sitemap_include"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={field.value}
                  />
                  <label
                    htmlFor="sitemap_include"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Включить в Sitemap
                  </label>
                </div>
              )}
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="sitemap_priority"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Приоритет в Sitemap (0.0 - 1.0)
            </label>
            <Controller
              name="sitemap_priority"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  id="sitemap_priority"
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base py-2 px-3"
                />
              )}
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="sitemap_changefreq"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Частота изменений
            </label>
            <Controller
              name="sitemap_changefreq"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  id="sitemap_changefreq"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base py-2 px-3"
                >
                  <option value="always">Всегда</option>
                  <option value="hourly">Ежечасно</option>
                  <option value="daily">Ежедневно</option>
                  <option value="weekly">Еженедельно</option>
                  <option value="monthly">Ежемесячно</option>
                  <option value="yearly">Ежегодно</option>
                  <option value="never">Никогда</option>
                </select>
              )}
            />
          </div>
        </section>

        <div className="flex justify-between">
          <Link
            href={`/posts/${params.slug}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Отмена
          </Link>
          <button
            type="submit"
            disabled={isLoadingPageContent}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isLoadingPageContent ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isLoadingPageContent ? "Сохранение..." : "Сохранить изменения"}
          </button>
        </div>
      </form>
    </div>
  );
};

// Оборачиваем страницу в компонент защиты роутов
const ProtectedEditPostPage = ({ params }: { params: { slug: string } }) => {
  return (
    <ProtectedRoute>
      <EditPostPage params={params} />
    </ProtectedRoute>
  );
};

export default ProtectedEditPostPage;
