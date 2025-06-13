/**
 * Утилиты для работы с аутентификацией и JWT-токенами
 */
import { jwtDecode } from "jwt-decode";

interface JwtToken {
  exp: number;
  [key: string]: any;
}

/**
 * Проверяет, истек ли срок действия JWT-токена
 * @param token JWT-токен для проверки
 * @param bufferSeconds Буфер в секундах до истечения срока (по умолчанию 60с)
 * @returns true, если токен истек или недействителен, иначе false
 */
export function isTokenExpired(token: string | null, bufferSeconds = 60): boolean {
  if (!token) return true;
  try {
    const decoded: JwtToken = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime + bufferSeconds;
  } catch (error) {
    console.error("Ошибка декодирования токена:", error);
    return true; // Считаем истекшим, если не можем декодировать
  }
}

/**
 * Получает заголовки авторизации с актуальным токеном
 * @returns Объект с заголовками авторизации
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window === "undefined") {
    return {}; // На сервере нет локального хранилища
  }
  
  let currentAccessToken = localStorage.getItem("accessToken");
  const currentRefreshToken = localStorage.getItem("refreshToken");

  // Проверяем, истек ли токен и есть ли refresh токен для обновления
  if (isTokenExpired(currentAccessToken) && currentRefreshToken) {
    // Пробуем обновить токен
    currentAccessToken = await refreshToken(currentRefreshToken);
  }

  return currentAccessToken 
    ? { Authorization: `Bearer ${currentAccessToken}` } 
    : {};
}

/**
 * Обновляет access-токен с помощью refresh-токена
 * @param refreshToken Refresh-токен для обновления access-токена
 * @returns Новый access-токен или null в случае ошибки
 */
export async function refreshToken(refreshToken: string): Promise<string | null> {
  try {
    // Используем динамический URL с учетом Docker-окружения
    const baseUrl = typeof window !== "undefined" 
        ? window.location.origin 
        : "http://backend:8000";
    const refreshUrl = `${baseUrl}/api/token/refresh/`;

    const response = await fetch(refreshUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      console.error("Ошибка при обновлении токена:", response.status);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.access;
    // Сохраняем новый access-токен
    if (newAccessToken) {
      localStorage.setItem("accessToken", newAccessToken);
      // Если сервер вернул новый refresh-токен, сохраняем и его
      if (data.refresh) {
        localStorage.setItem("refreshToken", data.refresh);
      }
      return newAccessToken;
    }
    return null;
  } catch (error) {
    console.error("Ошибка при запросе обновления токена:", error);
    return null;
  }
}
