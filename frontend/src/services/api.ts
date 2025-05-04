/**
 * API-сервис для работы с backend (REST, JWT, обработка ошибок).
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1/";

export interface ApiError {
  error: string;
  message: string;
}

/**
 * Выполняет запрос к API с поддержкой JWT и обработкой ошибок.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    let error: ApiError;
    try {
      error = await res.json();
    } catch {
      error = { error: "unknown", message: "Unknown error" };
    }
    throw error;
  }
  return res.json();
}

import type { Post, Tag } from "@/types/blog";

/**
 * Получить список постов блога.
 */
export async function fetchPosts(): Promise<Post[]> {
  return apiFetch<Post[]>("posts/");
}

/**
 * Получить пост по slug.
 */
export async function fetchPost(slug: string): Promise<Post> {
  return apiFetch<Post>(`posts/${slug}/`);
}

/**
 * Получить список всех тегов.
 */
export async function fetchTags(): Promise<Tag[]> {
  return apiFetch<Tag[]>("tags/");
}

/**
 * Получить список постов по тегу (slug).
 */
export async function fetchPostsByTag(slug: string): Promise<Post[]> {
  return apiFetch<Post[]>(`tags/${slug}/posts/`);
}
