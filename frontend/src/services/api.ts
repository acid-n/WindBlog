/**
 * API-сервис для работы с backend (REST, JWT, обработка ошибок).
 * 
 * Централизованная точка доступа к API с поддержкой JWT-аутентификации,
 * кэширования Next.js и унифицированной обработкой ошибок.
 */

import { getAuthHeaders } from "@/utils/auth";

// Определение базового URL с учетом контекста выполнения
// В Docker контейнерах нужно использовать имя сервиса вместо localhost
export const API_BASE_URL = (() => {
  // Для запросов из браузера
  if (typeof window !== "undefined") {
    // Используем origin для запросов из браузера - так работает прокси
    return `${window.location.origin}/api/v1`;
  }
  // Для SSR запросов из Next.js
  return "http://backend:8000/api/v1";
})();

// Функция для построения корректных URL API
export const buildApiUrl = (path: string): string => {
  // Удаляем лишние слеши в начале пути
  const normalizedPath = path.startsWith("/") ? path.substring(1) : path;
  return `${API_BASE_URL}/${normalizedPath}`;
};

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

  // Добавляем заголовки авторизации для защищенных запросов
  if (!isPublic && typeof window !== "undefined") {
    // Используем общую логику аутентификации из utils/auth
    const authHeaders = await getAuthHeaders();
    Object.assign(headers, authHeaders);
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

  // Используем функцию buildApiUrl для формирования корректного URL
  const url = buildApiUrl(endpoint);
  // console.log(`Fetching API: ${url}`, requestOptions);

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
  return fetchService<PaginatedPostsResponse>(`posts/?page=${page}`, {
    isPublic: true,
  });
}

/**
 * Получить пост по slug.
 */
export async function fetchPost(slug: string): Promise<Post> {
  return fetchService<Post>(`posts/${slug}/`, {
    isPublic: true,
    tags: ["posts", `post-${slug}`],
    cache: "no-store",
  });
}

/**
 * Получить пагинированный список тегов.
 * @param page Номер страницы
 */
export async function fetchTags(
  page: number = 1,
): Promise<PaginatedTagsResponse> {
  return fetchService<PaginatedTagsResponse>(`tags/?page=${page}`, {
    isPublic: true,
  });
}

/**
 * Получить список постов по тегу (slug).
 */
export async function fetchPostsByTag(slug: string): Promise<Post[]> {
  // Всегда возвращаем свежие данные (без кеша)
  return fetchService<Post[]>(`tags/${slug}/posts/`, { isPublic: true, revalate: 0, cache: 'no-store' } as any);
}

/**
 * Универсальный fetcher для SWR (использует fetchService).
 * Пример использования: useSWR(['/api/tags', slug], fetcher)
 */
export const fetcher = async <T>(...args: any[]): Promise<T> => {
  // args: [endpoint, ...params]
  if (typeof args[0] === 'string' && args.length === 1) {
    return fetchService<T>(args[0]);
  }
  // Если ключ массив: ['/api/tags', slug] -> endpoint = `/api/tags/${slug}`
  if (Array.isArray(args[0])) {
    const [base, param] = args[0];
    return fetchService<T>(`${base}/${param}`);
  }
  throw new Error('Некорректный ключ для fetcher');
};

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
  return fetchService<YearSummary[]>("archive/summary/", { isPublic: true });
}

/**
 * Получить месячную сводку архива для года (месяц, кол-во постов).
 * @param year Год
 */
export async function fetchArchiveMonthsSummary(
  year: number,
): Promise<MonthSummary[]> {
  return fetchService<MonthSummary[]>(`archive/${year}/summary/`, {
    isPublic: true,
  });
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
  return fetchService<DaySummary[]>(`archive/${year}/${monthPadded}/summary/`, {
    isPublic: true,
  });
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
  return fetchService<PaginatedPostsResponse>(endpoint, { isPublic: true });
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
  return fetchService<PaginatedPostsResponse>(
    `posts/?search=${encodeURIComponent(query)}&page=${page}`,
    { isPublic: true },
  );
}

/**
 * Интерфейс для настроек сайта, получаемых из API
 */
export interface SiteSettingsData {
  site_title: string;
  site_description: string;
  // добавьте другие поля, если они есть
}
export async function fetchSiteSettings(): Promise<SiteSettingsData> {
  return fetchService<SiteSettingsData>("site-settings", {
    isPublic: true,
    revalate: 3600,
  }); // Кешируем на час
}
