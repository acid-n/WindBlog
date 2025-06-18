/**
 * API-сервис для работы с backend (REST, JWT, обработка ошибок).
 */
// Базовый URL API; может быть переопределён в .env.local
import { getBaseUrl, fetchJson } from "@/lib/getBaseUrl";

const USE_MOCK_DATA = process.env.USE_MOCK_DATA === "true";

export interface ApiErrorFormat {
  error: string; // Обычно строка-ключ ошибки, например, "valation_error" или "not_found"
  message: string; // Человекочитаемое сообщение
  details?: Record<string, unknown>; // Опционально: детали ошибки, например, ошибки полей при валидации
}

interface FetchServiceOptions extends RequestInit {
  isPublic?: boolean; // Если true, не будет пытаться добавить JWT токен
  revalate?: number | false; // Для Next.js кеширования, false для отключения
  tags?: string[]; // Добавляем опцию для тегов
}

/**
 * Основная функция для выполнения запросов к API.
 * Поддерживает JWT, Next.js кеширование и структурированную обработку ошибок.
 */
async function fetchService<T>(
  endpoint: string,
  options: FetchServiceOptions = {},
): Promise<T> {
  const { isPublic = false, revalate = 60, tags, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!isPublic && typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const nextOptions: { revalate?: number | false; tags?: string[] } = {};
  if (typeof revalate === "number" || revalate === false) {
    nextOptions.revalate = revalate;
  }
  if (tags && tags.length > 0) {
    nextOptions.tags = tags;
  }

  const requestOptions: RequestInit = {
    ...fetchOptions,
    headers,
    next: nextOptions,
  };

  const url = `${getBaseUrl()}/${endpoint.startsWith("/") ? endpoint.substring(1) : endpoint}`;

  try {
    const res = await fetch(url, requestOptions);

    if (!res.ok) {
      const errorPayload: ApiErrorFormat = {
        error: `http_error_${res.status}`,
        message: res.statusText || "An unknown API error occurred",
      };
      try {
        const errorJson = await res.json();
        // Предполагаем, что бэкенд возвращает { error: "...", message: "...", details: "..." } или { detail: "..." } (DRF стиль)
        errorPayload.error =
          errorJson.error || errorJson.detail || errorPayload.error;
        errorPayload.message =
          errorJson.message || errorJson.detail || errorPayload.message;
        if (errorJson.details) errorPayload.details = errorJson.details;
      } catch {
        // Не удалось распарсить JSON ошибки, оставляем HTTP статус/текст
      }
      console.error(
        `API Error (${url}): ${res.status} ${res.statusText}`,
        errorPayload,
      );
      throw errorPayload; // Выбрасываем структурированную ошибку
    }

    if (res.status === 204) {
      return null as T; // Для No Content ответов
    }

    return (await res.json()) as T;
  } catch (error) {
    // Если ошибка уже ApiErrorFormat, просто перебрасываем ее
    if (
      error &&
      typeof (error as ApiErrorFormat).error === "string" &&
      typeof (error as ApiErrorFormat).message === "string"
    ) {
      throw error;
    }
    // Иначе, это может быть сетевая ошибка или другая проблема
    console.error("Network or other fetch error:", error);
    throw {
      error: "network_error",
      message: (error as Error).message || "A network error occurred",
    } as ApiErrorFormat;
  }
}

import type { Post, Tag, PaginatedPostsResponse } from "@/types/blog";

// Добавляем тип для пагинированного ответа тегов
export interface PaginatedTagsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Tag[];
}

/**
 * Получить пагинированный список постов блога.
 * @param page Номер страницы
 */
export async function fetchPosts(
  page: number = 1,
): Promise<PaginatedPostsResponse> {
  if (USE_MOCK_DATA) {
    return {
      count: 0,
      next: null,
      previous: null,
      results: [],
    };
  }
  try {
    return await fetchService<PaginatedPostsResponse>(`posts/?page=${page}`, {
      isPublic: true,
    });
  } catch (e) {
    if (USE_MOCK_DATA) {
      return {
        count: 0,
        next: null,
        previous: null,
        results: [],
      };
    }
    throw e;
  }
}

/**
 * Получить пост по slug.
 */
export async function fetchPost(slug: string): Promise<Post> {
  if (USE_MOCK_DATA) {
    return {
      id: 0,
      title: "mock",
      slug,
      body: "",
      tags_details: [],
    } as Post;
  }
  try {
    return await fetchService<Post>(`posts/${slug}/`, {
      isPublic: true,
      tags: ["posts", `post-${slug}`],
      cache: "no-store",
    });
  } catch (e) {
    if (USE_MOCK_DATA) {
      return {
        id: 0,
        title: "mock",
        slug,
        body: "",
        tags_details: [],
      } as Post;
    }
    throw e;
  }
}

/**
 * Получить пагинированный список тегов.
 * @param page Номер страницы
 */
export async function fetchTags(
  page: number = 1,
): Promise<PaginatedTagsResponse> {
  if (USE_MOCK_DATA) {
    return { count: 0, next: null, previous: null, results: [] };
  }
  try {
    return await fetchService<PaginatedTagsResponse>(`tags/?page=${page}`, {
      isPublic: true,
    });
  } catch (e) {
    if (USE_MOCK_DATA) {
      return { count: 0, next: null, previous: null, results: [] };
    }
    throw e;
  }
}

/**
 * Получить список постов по тегу (slug).
 */
export async function fetchPostsByTag(slug: string): Promise<Post[]> {
  if (USE_MOCK_DATA) {
    return [];
  }
  try {
    return await fetchService<Post[]>(`tags/${slug}/posts/`, {
      isPublic: true,
    });
  } catch (e) {
    if (USE_MOCK_DATA) {
      return [];
    }
    throw e;
  }
}

/**
 * Получить пост по ID (для коротких ссылок).
 */
// Функция fetchPostById устарела или требует доработки на бэкенде для поиска по ID.

// --- Типы для API Архива --- //
export interface YearSummary {
  year: number;
  posts_count: number;
}

export interface MonthSummary {
  month: number; // 1-12
  posts_count: number;
}

export interface DaySummary {
  day: number; // 1-31
  posts_count: number;
}

// --- API Функции для Архива --- //

/**
 * Получить годовую сводку архива (год, кол-во постов).
 */
export async function fetchArchiveYearsSummary(): Promise<YearSummary[]> {
  if (USE_MOCK_DATA) {
    return [];
  }
  try {
    return await fetchService<YearSummary[]>("archive/summary/", {
      isPublic: true,
    });
  } catch (e) {
    if (USE_MOCK_DATA) {
      return [];
    }
    throw e;
  }
}

/**
 * Получить месячную сводку архива для года (месяц, кол-во постов).
 * @param year Год
 */
export async function fetchArchiveMonthsSummary(
  year: number,
): Promise<MonthSummary[]> {
  if (USE_MOCK_DATA) {
    return [];
  }
  try {
    return await fetchService<MonthSummary[]>(`archive/${year}/summary/`, {
      isPublic: true,
    });
  } catch (e) {
    if (USE_MOCK_DATA) {
      return [];
    }
    throw e;
  }
}

/**
 * Получить дневную сводку архива для года/месяца (день, кол-во постов).
 * @param year Год
 * @param month Месяц (1-12)
 */
export async function fetchArchiveDaysSummary(
  year: number,
  month: number,
): Promise<DaySummary[]> {
  const monthPadded = month.toString();
  if (USE_MOCK_DATA) {
    return [];
  }
  try {
    return await fetchService<DaySummary[]>(
      `archive/${year}/${monthPadded}/summary/`,
      {
        isPublic: true,
      },
    );
  } catch (e) {
    if (USE_MOCK_DATA) {
      return [];
    }
    throw e;
  }
}

/**
 * Получить пагинированный список постов за конкретный день.
 * @param year Год
 * @param month Месяц (1-12)
 * @param day День (1-31)
 * @param page Номер страницы (по умолчанию 1)
 */
export async function fetchArchivePostsByDate(
  year: number,
  month: number,
  day: number,
  page: number = 1,
): Promise<PaginatedPostsResponse> {
  const monthPadded = month.toString();
  const dayPadded = day.toString();
  const endpoint = `archive/${year}/${monthPadded}/${dayPadded}/?page=${page}`;
  if (USE_MOCK_DATA) {
    return { count: 0, next: null, previous: null, results: [] };
  }
  try {
    return await fetchService<PaginatedPostsResponse>(endpoint, {
      isPublic: true,
    });
  } catch (e) {
    if (USE_MOCK_DATA) {
      return { count: 0, next: null, previous: null, results: [] };
    }
    throw e;
  }
}

/**
 * Искать посты по запросу.
 * @param query Поисковый запрос
 * @param page Номер страницы
 */
export async function searchPosts(
  query: string,
  page: number = 1,
): Promise<PaginatedPostsResponse> {
  if (USE_MOCK_DATA) {
    return { count: 0, next: null, previous: null, results: [] };
  }
  try {
    return await fetchService<PaginatedPostsResponse>(
      `posts/?search=${encodeURIComponent(query)}&page=${page}`,
      { isPublic: true },
    );
  } catch (e) {
    if (USE_MOCK_DATA) {
      return { count: 0, next: null, previous: null, results: [] };
    }
    throw e;
  }
}

// Пример функции, требующей аутентификации (если появится такая необходимость)
// export async function submitPost(postId: number, score: number): Promise<> {
//   return fetchService<>(`posts/${postId}/rate/`, {
//     method: 'POST',
//     body: JSON.stringify({ score }),
//     isPublic: false, // Этот запрос требует JWT
//     revalate: 0, // Не кешировать ответ на POST запрос (или false)
//   });
// }

// Для получения настроек сайта (используется в Header, данные не чувствительные)
import { SITE_SETTINGS_URL } from "@/lib/api";

export interface SiteSettingsData {
  title: string;
  tagline: string;
}

export async function fetchSiteSettings(): Promise<SiteSettingsData> {
  return fetchJson(SITE_SETTINGS_URL, {
    next: { revalidate: 3600 },
  });
}
