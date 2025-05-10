"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import TiptapEditor from "@/components/tiptap-editor";
import { Post, Tag } from "@/types/blog";
import { useAuth } from "@/contexts/AuthContext";
import slugify from "slugify";
import { fetchWithAuth } from "@/services/apiClient";
import ImageUploader from "@/components/image-uploader";
import { TrashIcon } from "@heroicons/react/24/outline";

const processImageUrlsInJson = (node: unknown, mediaUrl: string): unknown => {
  if (Array.isArray(node)) {
    return node.map((item) => processImageUrlsInJson(item, mediaUrl));
  }
  if (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    (node as any).type === "image" &&
    "attrs" in node &&
    (node as any).attrs &&
    (node as any).attrs.src
  ) {
    const newNode = { ...node } as any;
    if (newNode.attrs.src.startsWith("/media/")) {
      newNode.attrs.src = `${mediaUrl}${newNode.attrs.src}`;
    }
    if ((node as any).content) {
      newNode.content = processImageUrlsInJson((node as any).content, mediaUrl);
    }
    return newNode;
  }
  if (typeof node === "object" && node !== null) {
    return { ...node };
  }
  return node;
};

const EditPostPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const slug = params?.slug as string;
  const [post, setPost] = useState<Post | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [isLoadingPageContent, setIsLoadingPageContent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState<any | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(
    null,
  );
  const successMessageTimerRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_DESC_LENGTH = 160;
  const latestUploadedImagePathRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (successMessageTimerRef.current) {
        clearTimeout(successMessageTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?next=/admin/edit-post/" + slug);
      return;
    }

    const fetchAllTags = async () => {
      try {
        const djangoApiUrl =
          process.env.NEXT_PUBLIC_DJANGO_API_URL ||
          "http://localhost:8000/api/v1";
        const response = await fetchWithAuth(`${djangoApiUrl}/tags/?limit=200`);
        if (!response.ok) throw new Error("Failed to fetch tags for editing");
        const data: { results: Tag[] } = await response.json();
        setAllTags(data.results || []);
      } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
        console.error("Error fetching tags for editing:", e);
      }
    };

    if (user && slug) {
      fetchAllTags();
      const fetchPostToEdit = async () => {
        setIsLoadingPageContent(true);
        setError(error ?? "");
        setSaveSuccessMessage(null);
        try {
          const djangoApiUrl =
            process.env.NEXT_PUBLIC_DJANGO_API_URL ||
            "http://localhost:8000/api/v1";
          const response = await fetchWithAuth(
            `${djangoApiUrl}/posts/${slug}/`,
          );
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
              console.error(
                "Ошибка парсинга JSON ответа с ошибкой:",
                jsonError,
              );
            }
            throw new Error(errorDetail);
          }
          const data: Post = await response.json();
          setPost(data);
          if (data.tags_details) {
            setSelectedTagIds(data.tags_details.map((tag) => tag.id));
          }
          if (data.image) {
            latestUploadedImagePathRef.current = data.image;
          }
          const djangoMediaUrl =
            process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL || "http://localhost:8000";
          const processedBody = processImageUrlsInJson(
            data.body,
            djangoMediaUrl,
          );
          setEditorContent(processedBody);
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          console.error("Error fetching post:", e);
          setError(errorMessage);
          setPost(null);
        } finally {
          setIsLoadingPageContent(false);
        }
      };
      fetchPostToEdit();
    }
  }, [slug, user, authLoading, router]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    if (!post) return;
    const { name, value, type } = e.target;
    const val =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    let newSlug = post.slug;
    if (name === "title" && !post.slug) {
      newSlug = slugify(value, { lower: true, strict: true, locale: "ru" });
    }

    setPost({
      ...post,
      [name]: val,
      slug: name === "title" ? newSlug : post.slug,
    });

    if (name === "slug") {
      setPost({ ...post, slug: value });
    }

    if (name !== "title" && name !== "slug") {
      setPost({ ...post, [name]: val });
    }
  };

  const handleTagChange = (tagId: number) => {
    setSelectedTagIds((prevSelectedTagIds) =>
      prevSelectedTagIds.includes(tagId)
        ? prevSelectedTagIds.filter((id) => id !== tagId)
        : [...prevSelectedTagIds, tagId],
    );
  };

  const handleSave = async (publishAction: "save_draft" | "publish") => {
    if (!post || !editorContent || !user) {
      setError(
        "Невозможно сохранить пост: пользователь не аутентифицирован или нет данных.",
      );
      return;
    }
    setIsLoadingPageContent(true);
    setError(error ?? "");
    setSaveSuccessMessage(null);
    if (successMessageTimerRef.current)
      clearTimeout(successMessageTimerRef.current);

    console.log(
      "[EditPostPage PRE-SAVE DEBUG] Current post.image state:",
      post?.image,
    );

    let imagePathForSave: string | null = null;
    const imageSource =
      latestUploadedImagePathRef.current ??
      (typeof post.image === "string" ? post.image : null);
    console.log(
      "[EditPostPage PRE-SAVE DEBUG] Image source for save (from ref or post.image):",
      imageSource,
    );

    if (typeof imageSource === "string" && imageSource.trim() !== "") {
      let path = imageSource.trim();
      const knownPostUploadPrefix = "posts/uploads/";

      const postsUploadsIndex = path.lastIndexOf(knownPostUploadPrefix);
      if (postsUploadsIndex !== -1) {
        path = path.substring(postsUploadsIndex);
      } else {
        try {
          const url = new URL(path);
          path = url.pathname;
        } catch {
          // Оставляем path как есть, если это не полный валидный URL (может быть уже относительным путем или мусором)
        }

        if (path.startsWith("/media/")) {
          path = path.substring("/media/".length);
        } else if (path.startsWith("media/")) {
          path = path.substring("media/".length);
        }

        while (path.startsWith("/")) {
          path = path.substring(1);
        }
      }

      if (path.includes("://")) {
        console.error(
          `[EditPostPage SAVE ERROR] Очищенный путь все еще содержит '://': '${path}'. Исходный: '${imageSource}'`,
        );
        path = "";
      } else if (
        path.toLowerCase().startsWith("http:") &&
        !path.toLowerCase().startsWith("http://")
      ) {
        console.error(
          `[EditPostPage SAVE ERROR] Очищенный путь выглядит как некорректная ссылка http:/...: '${path}'. Исходный: '${imageSource}'`,
        );
        path = "";
      } else if (path.length === 0) {
        path = "";
      } else if (path.length > 255) {
        console.error(
          `[EditPostPage SAVE ERROR] Очищенный путь слишком длинный (${path.length} символов): '${path}'. Исходный: '${imageSource}'`,
        );
        path = "";
      }
      imagePathForSave = path;
    }

    console.log(
      "[EditPostPage FINAL DEBUG] imagePathForSave перед включением в postDataToSave:",
      imagePathForSave,
    );
    console.log(
      `[EditPostPage FINAL DEBUG] Длина imagePathForSave: ${imagePathForSave?.length}`,
    );

    const postDataToSave: any = {
      ...post,
      image: imagePathForSave,
      body: editorContent,
      first_published_at: post.first_published_at
        ? new Date(post.first_published_at).toISOString()
        : null,
      sitemap_priority: (post as any).sitemap_priority
        ? parseFloat(String((post as any).sitemap_priority))
        : 0.5,
      tags: selectedTagIds,
      is_published: publishAction === "publish",
      published_at:
        publishAction === "publish" ? new Date().toISOString() : null,
    };
    delete postDataToSave.tags_details;

    console.log(
      "[EditPostPage DEBUG] Data being sent to backend (postDataToSave):",
      JSON.stringify(postDataToSave, null, 2),
    );
    console.log(
      `[EditPostPage DEBUG] Length of title: ${postDataToSave.title?.length}`,
    );
    console.log(
      `[EditPostPage DEBUG] Length of slug: ${postDataToSave.slug?.length}`,
    );
    console.log(
      `[EditPostPage DEBUG] Length of image path: ${postDataToSave.image?.length}`,
    );
    console.log(
      `[EditPostPage DEBUG] Length of description: ${postDataToSave.description?.length}`,
    );

    try {
      const djangoApiUrl =
        process.env.NEXT_PUBLIC_DJANGO_API_URL ||
        "http://localhost:8000/api/v1";
      const response = await fetchWithAuth(
        `${djangoApiUrl}/posts/${post.slug}/`,
        {
          method: "PUT",
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

      const updatedPost = await response.json();
      setSaveSuccessMessage(
        "Пост успешно сохранен! Запуск ревалидации кэша...",
      );
      successMessageTimerRef.current = setTimeout(
        () => setSaveSuccessMessage(null),
        5000,
      );

      window.scrollTo({ top: 0, behavior: "smooth" });

      const revalidateSecret = process.env.NEXT_PUBLIC_REVALIDATE_SECRET_TOKEN;
      if (!revalidateSecret) {
        console.warn(
          "NEXT_PUBLIC_REVALIDATE_SECRET_TOKEN не доступен на клиенте. Пропуск шага ревалидации.",
        );
        setTimeout(() => {
          if (updatedPost && updatedPost.slug) {
            router.push(`/posts/${updatedPost.slug}`);
          }
        }, 1500);
      } else {
        console.log(
          "Запуск ревалидации после обновления поста (используя revalidatePath)...",
        );
        const pathsToRevalidate = ["/blog", "/"];
        if (updatedPost && updatedPost.slug) {
          pathsToRevalidate.push(`/posts/${updatedPost.slug}`);
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
            setTimeout(() => {
              if (updatedPost && updatedPost.slug) {
                router.push(`/posts/${updatedPost.slug}`);
              }
            }, 3000);
          });
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error("Error saving post:", e);
      setError(errorMessage);
    } finally {
      setIsLoadingPageContent(false);
    }
  };

  const handleDeletePost = async () => {
    if (
      window.confirm(
        "Вы уверены, что хотите удалить этот пост? Это действие необратимо.",
      )
    ) {
      try {
        setIsLoadingPageContent(true);
        setError(error ?? "");
        const djangoApiUrl =
          process.env.NEXT_PUBLIC_DJANGO_API_URL ||
          "http://localhost:8000/api/v1";
        const response = await fetchWithAuth(`${djangoApiUrl}/posts/${slug}/`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.detail || `Ошибка сервера: ${response.status}`,
          );
        }

        const revalidateSecret =
          process.env.NEXT_PUBLIC_REVALIDATE_SECRET_TOKEN;
        if (revalidateSecret) {
          const pathsToRevalidate = ["/blog", "/"];
          await Promise.all(
            pathsToRevalidate.map((path) =>
              fetch(
                `/api/revalidate?path=${encodeURIComponent(path)}&secret=${revalidateSecret}`,
              ),
            ),
          );
        }

        router.push("/");
      } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
        console.error("Ошибка при удалении поста:", e);
        setError(e instanceof Error ? e.message : "Не удалось удалить пост.");
        setIsLoadingPageContent(false);
      }
    }
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      return date.toLocaleString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      console.error("Date formatting error:", e);
      return "Invalid Date";
    }
  };

  if (authLoading)
    return <p className="text-center py-10">Проверка аутентификации...</p>;
  if (!user && !authLoading) {
    return (
      <p className="text-center py-10">
        Для доступа к этой странице необходимо войти в систему.
      </p>
    );
  }
  if (isLoadingPageContent && !post && !error && user)
    return <p className="text-center py-10">Загрузка данных поста...</p>;
  if (error && !isLoadingPageContent)
    return <p className="text-center py-10 text-red-500">Ошибка: {error}</p>;
  if (!post && !isLoadingPageContent && !error)
    return <p className="text-center py-10">Пост не найден.</p>;
  if (!post) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        Редактировать пост: {post.title}
      </h1>
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

      <section className="mb-8 p-4 border rounded-md shadow-sm bg-white">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">
          Основные данные
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="label-style">
              Заголовок
            </label>
            <input
              type="text"
              name="title"
              id="title"
              value={post.title || ""}
              onChange={handleInputChange}
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="slug" className="label-style">
              URL (слаг)
            </label>
            <input
              type="text"
              name="slug"
              id="slug"
              value={post.slug || ""}
              onChange={handleInputChange}
              className="input-field"
            />
          </div>
          {post.shortlink &&
            (post.shortlink.full_url || post.shortlink.url) && (
              <div className="mt-6">
                <label htmlFor="shortlinkDisplay" className="label-style">
                  Короткая ссылка
                </label>
                <input
                  type="text"
                  name="shortlinkDisplay"
                  id="shortlinkDisplay"
                  value={
                    post.shortlink.full_url ||
                    `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}${post.shortlink.url}`
                  }
                  readOnly
                  className="input-field bg-gray-100 cursor-not-allowed"
                />
              </div>
            )}
          <div className="md:col-span-2">
            <ImageUploader
              label="Основное изображение (анонс)"
              initialImageUrl={post?.image}
              onUploadComplete={(uploadedUrl) => {
                if (post) {
                  console.log(
                    "[EditPostPage DEBUG] ImageUploader onUploadComplete. Uploaded URL:",
                    uploadedUrl,
                  );
                  console.log(
                    "[EditPostPage DEBUG] ImageUploader onUploadComplete. Current post.image BEFORE setPost:",
                    post.image,
                  );
                  setPost((prevPost) =>
                    prevPost ? { ...prevPost, image: uploadedUrl } : null,
                  );
                  latestUploadedImagePathRef.current = uploadedUrl;
                  console.log(
                    "[EditPostPage DEBUG] ImageUploader onUploadComplete. latestUploadedImagePathRef.current SET TO:",
                    latestUploadedImagePathRef.current,
                  );
                }
              }}
            />
            <p className="mt-1 text-xs text-gray-500">
              Изображение будет автоматически обрезано до соотношения сторон
              ~3:1 (например, 1200x400 пикселей).
            </p>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="description" className="label-style">
              Описание (аннотация)
            </label>
            <textarea
              name="description"
              id="description"
              value={post.description || ""}
              onChange={handleInputChange}
              rows={3}
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {post.description?.length || 0} / {MAX_DESC_LENGTH}
            </p>
          </div>
        </div>
      </section>

      {allTags.length > 0 && (
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
      )}

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
                  ? new Date(post.first_published_at).toISOString().slice(0, 16)
                  : ""
              }
              onChange={handleInputChange}
              className="input-field"
            />
          </div>
          <div className="md:col-start-2">
            <label className="label-style">Дата последнего обновления</label>
            <p className="mt-1 text-sm text-gray-600 h-10 flex items-center px-3 border border-gray-200 rounded-md bg-gray-50">
              {formatDate(post.updated_at)}
            </p>
          </div>
          <div>
            <label className="label-style">Дата создания</label>
            <p className="mt-1 text-sm text-gray-600 h-10 flex items-center px-3 border border-gray-200 rounded-md bg-gray-50">
              {formatDate(post.created_at)}
            </p>
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
              checked={(post as any).sitemap_include || false}
              onChange={handleInputChange}
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
              value={
                (post as any).sitemap_priority === null ? "" : (post as any).sitemap_priority
              }
              onChange={handleInputChange}
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="sitemap_changefreq" className="label-style">
              Частота изменений
            </label>
            <select
              name="sitemap_changefreq"
              id="sitemap_changefreq"
              value={(post as any).sitemap_changefreq || "monthly"}
              onChange={handleInputChange}
              className="input-field"
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
        <h2 className="text-2xl font-semibold mb-3">Основной контент поста</h2>
        <TiptapEditor
          content={editorContent}
          onChange={(newContent) => setEditorContent(newContent)}
        />
      </section>

      <div className="mt-8 flex justify-between items-center">
        <div>
          <button
            type="button"
            onClick={handleDeletePost}
            disabled={isLoadingPageContent}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50 flex items-center"
          >
            <TrashIcon className="h-5 w-5 mr-2" />
            Удалить пост
          </button>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => handleSave("save_draft")}
            disabled={isLoadingPageContent}
            className="px-6 py-2.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            Сохранить черновик
          </button>
          <button
            onClick={() => handleSave("publish")}
            disabled={isLoadingPageContent}
            className="px-6 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoadingPageContent
              ? (post as any)?.is_published
                ? "Обновление..."
                : "Публикация..."
              : (post as any)?.is_published
                ? "Обновить пост"
                : "Опубликовать"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .input-field {
          margin-top: 0.25rem;
          display: block;
          width: 100%;
          padding-left: 0.75rem;
          padding-right: 0.75rem;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          border-width: 1px;
          border-color: #d1d5db;
          border-radius: 0.375rem;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          background-color: white;
          color: #111827;
          line-height: 1.5;
        }
        .input-field:focus {
          outline: 2px solid transparent;
          outline-offset: 2px;
          --tw-ring-color: #4f46e5;
          box-shadow: var(--tw-ring-inset) 0 0 0
            calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);
          border-color: #6366f1;
        }
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

export default EditPostPage;
