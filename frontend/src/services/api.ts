/**
 * API-сервис для работы с backend (REST, JWT, обработка ошибок).
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface ApiErrorFormat {
  error: string; // Обычно строка-ключ ошибки, например, "validation_error" или "not_found"
  message: string; // Человекочитаемое сообщение
  details?: Record<string, any>; // Опционально: детали ошибки, например, ошибки полей при валидации
}

interface FetchServiceOptions extends RequestInit {
  isPublic?: boolean; // Если true, не будет пытаться добавить JWT токен
  revalidate?: number | false; // Для Next.js кеширования, false для отключения
}

/**
 * Основная функция для выполнения запросов к API.
 * Поддерживает JWT, Next.js кеширование и структурированную обработку ошибок.
 */
async function fetchService<T>(
  endpoint: string,
  options: FetchServiceOptions = {}
): Promise<T> {
  const { isPublic = false, revalidate = 60, ...fetchOptions } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };

  if (!isPublic && typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const requestOptions: RequestInit = {
    ...fetchOptions,
    headers,
  };

  // Добавляем опции кеширования Next.js, если revalidate не false
  if (typeof revalidate === 'number') {
    (requestOptions as any).next = { ...((requestOptions as any).next || {}), revalidate };
  }

  const url = `${API_BASE_URL}/${endpoint.startsWith('/') ? endpoint.substring(1) : endpoint}`;
  // console.log(`Fetching API: ${url}`, requestOptions);

  try {
    const res = await fetch(url, requestOptions);

    if (!res.ok) {
      let errorPayload: ApiErrorFormat = {
        error: `http_error_${res.status}`,
        message: res.statusText || "An unknown API error occurred",
      };
      try {
        const errorJson = await res.json();
        // Предполагаем, что бэкенд возвращает { error: "...", message: "...", details: "..." } или { detail: "..." } (DRF стиль)
        errorPayload.error = errorJson.error || errorJson.detail || errorPayload.error;
        errorPayload.message = errorJson.message || errorJson.detail || errorPayload.message;
        if (errorJson.details) errorPayload.details = errorJson.details;
      } catch (e) {
        // Не удалось распарсить JSON ошибки, оставляем HTTP статус/текст
      }
      console.error(`API Error (${url}): ${res.status} ${res.statusText}`, errorPayload);
      throw errorPayload; // Выбрасываем структурированную ошибку
    }

    if (res.status === 204) {
      return null as T; // Для No Content ответов
    }

    return await res.json() as T;
  } catch (error) {
    // Если ошибка уже ApiErrorFormat, просто перебрасываем ее
    if (error && typeof (error as ApiErrorFormat).error === 'string' && typeof (error as ApiErrorFormat).message === 'string') {
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

import type { Post, Tag, PaginatedPostsResponse, Rating } from "@/types/blog";

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
export async function fetchPosts(page: number = 1): Promise<PaginatedPostsResponse> {
  return fetchService<PaginatedPostsResponse>(`posts/?page=${page}`, { isPublic: true });
}

/**
 * Получить пост по slug.
 */
export async function fetchPost(slug: string): Promise<Post> {
  return fetchService<Post>(`posts/${slug}/`, { isPublic: true });
}

/**
 * Получить пагинированный список тегов.
 * @param page Номер страницы
 */
export async function fetchTags(page: number = 1): Promise<PaginatedTagsResponse> {
  return fetchService<PaginatedTagsResponse>(`tags/?page=${page}`, { isPublic: true });
}

/**
 * Получить список постов по тегу (slug).
 */
export async function fetchPostsByTag(slug: string): Promise<Post[]> {
  return fetchService<Post[]>(`tags/${slug}/posts/`, { isPublic: true });
}

/**
 * Получить пост по ID (для коротких ссылок).
 */
export async function fetchPostById(id: string): Promise<Post> {
  // console.log(`API: Запрос поста по ID ${id}`);
  // const response = await fetchService<Post>(`posts/${id}/by-id/`, { isPublic: true });
  // console.log(`API: Получен пост ${response.title} (ID: ${response.id})`);
  // return response;
  // Эндпоинт /by-id/ был в PostViewSet, но он ожидал slug как ID. Стандартный get по slug уже есть.
  // Если нужен поиск по числовому ID, то на бэкенде нужен другой эндпоинт или фильтр.
  // Пока закомментирую, так как его логика была спорной и дублирующей.
  throw new Error('fetchPostById is deprecated or needs backend adjustment for ID lookup.');
}

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
export async function fetchArchiveMonthsSummary(year: number): Promise<MonthSummary[]> {
  return fetchService<MonthSummary[]>(`archive/${year}/summary/`, { isPublic: true });
}

/**
 * Получить дневную сводку архива для года/месяца (день, кол-во постов).
 * @param year Год
 * @param month Месяц (1-12)
 */
export async function fetchArchiveDaysSummary(year: number, month: number): Promise<DaySummary[]> {
  const monthPadded = month.toString();
  return fetchService<DaySummary[]>(`archive/${year}/${monthPadded}/summary/`, { isPublic: true });
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
export async function searchPosts(query: string, page: number = 1): Promise<PaginatedPostsResponse> {
  return fetchService<PaginatedPostsResponse>(`posts/?search=${encodeURIComponent(query)}&page=${page}`, { isPublic: true });
}

// Пример функции, требующей аутентификации (если появится такая необходимость)
// export async function submitPostRating(postId: number, score: number): Promise<Rating> {
//   return fetchService<Rating>(`posts/${postId}/rate/`, {
//     method: 'POST',
//     body: JSON.stringify({ score }),
//     isPublic: false, // Этот запрос требует JWT
//     revalidate: 0, // Не кешировать ответ на POST запрос (или false)
//   });
// }

// Для получения настроек сайта (используется в Header, данные не чувствительные)
export interface SiteSettingsData {
    site_title: string;
    site_description: string;
    // добавьте другие поля, если они есть
}
export async function fetchSiteSettings(): Promise<SiteSettingsData> {
    return fetchService<SiteSettingsData>('site-settings', { isPublic: true, revalidate: 3600 }); // Кешируем на час
}
