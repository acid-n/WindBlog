import { jwtDecode } from "jwt-decode";

// Утилита для проверки времени жизни токена (с небольшим запасом)
const isTokenExpired = (token: string | null, bufferSeconds = 60): boolean => {
  if (!token) return true;
  try {
    const decoded: { exp: number } = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime + bufferSeconds;
  } catch (error) {
    console.error("Error decoding token for expiry check:", error);
    return true; // Считаем истекшим, если не можем декодировать
  }
};

// Функция для обновления токена с дополнительным логированием
const refreshToken = async (
  currentRefreshToken: string,
): Promise<string | null> => {
  try {
    // Используем ту же функцию buildApiUrl для корректного формирования URL обновления токена
    // с учетом Docker-окружения
    const refreshUrl = `${API_BASE_URL}/api/token/refresh/`;
    
    console.log(`[Auth] Попытка обновления токена по URL: ${refreshUrl}`);

    // Проверяем, что refresh токен присутствует и валидный
    if (!currentRefreshToken || currentRefreshToken.length < 10) {
      console.error("[Auth] Refresh токен недействителен или слишком короткий");
      return null;
    }

    const response = await fetch(refreshUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: currentRefreshToken }),
      // Отключаем кеширование
      cache: "no-store",
    });

    // Логируем детали ответа
    console.log(`[Auth] Ответ на обновление токена: ${response.status} ${response.statusText}`);

    const responseText = await response.text();
    let data;
    
    try {
      // Пробуем распарсить JSON
      data = JSON.parse(responseText);
    } catch (jsonError) {
      console.error(`[Auth] Ошибка парсинга JSON: ${responseText}`, jsonError);
      return null;
    }

    if (!response.ok) {
      console.error("[Auth] Ошибка обновления токена:", data);
      // Очищаем токены при ошибке
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return null;
    }

    const newAccessToken = data.access;
    // Иногда сервер возвращает и новый refresh токен, обрабатываем это
    const newRefreshToken = data.refresh;
    
    if (newAccessToken) {
      console.log("[Auth] Получен новый access токен");
      localStorage.setItem("accessToken", newAccessToken);
      
      if (newRefreshToken) {
        console.log("[Auth] Получен новый refresh токен");
        localStorage.setItem("refreshToken", newRefreshToken);
      }
      return newAccessToken;
    }
    console.error("[Auth] Токен не получен от сервера");
    return null;
  } catch (error) {
    console.error("[Auth] Ошибка при обновлении токена:", error);
    return null;
  }
};

// Определение базового URL с учетом контекста выполнения (без /api/v1)
// В Docker контейнерах нужно использовать имя сервиса вместо localhost
const API_BASE_URL = (() => {
  // Для запросов из браузера
  if (typeof window !== "undefined") {
    // Используем origin для запросов из браузера - так работает прокси
    return window.location.origin;
  }
  // Для SSR запросов из Next.js
  return "http://backend:8000";
})();

// Функция для построения корректных URL API
export const buildApiUrl = (path: string): string => {
  // Удаляем лишние слеши в начале пути
  const normalizedPath = path.startsWith("/") ? path.substring(1) : path;
  
  // Дополнительное логирование для отладки в консоли
  console.debug(`[API] Строим URL для пути: ${normalizedPath}`);
  
  let result: string;
  
  // Проверяем разные варианты пути
  if (normalizedPath === 'api/token/refresh/' || 
      normalizedPath === 'api/token/refresh' || 
      normalizedPath === 'api/token/' ||
      normalizedPath === 'api/token') {
    // Специальный случай для токенов - убедиться, что используем правильный заголовочный слеш
    result = `${API_BASE_URL}/${normalizedPath}`;
  } else if (normalizedPath.startsWith("api/v1/")) {
    result = `${API_BASE_URL}/${normalizedPath}`;
  } else if (normalizedPath.startsWith("api/")) {
    result = `${API_BASE_URL}/${normalizedPath}`;
  } else {
    // Если путь не содержит api/, добавляем api/v1/
    result = `${API_BASE_URL}/api/v1/${normalizedPath}`;
  }
  
  console.debug(`[API] Сформирован URL: ${result}`);
  return result;
};

// Обертка над fetch для автоматической работы с токенами
export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  let currentAccessToken = localStorage.getItem("accessToken");
  const currentRefreshToken = localStorage.getItem("refreshToken");

  // 1. Проверяем, истек ли текущий access токен
  if (isTokenExpired(currentAccessToken)) {
    console.log("Access token expired or missing, attempting refresh...");
    
    // Если нет refresh токена, просто выбрасываем ошибку без редиректа
    if (!currentRefreshToken) {
      console.log("No refresh token available. Authentication required.");
      // Удаляем локальные токены
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      // Возвращаем 401 для правильной обработки в компоненте
      return new Response(JSON.stringify({ detail: "Требуется аутентификация" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Пытаемся обновить токен
    try {
      currentAccessToken = await refreshToken(currentRefreshToken);

      if (!currentAccessToken) {
        console.log("Refresh token failed. Authentication required.");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        // Возвращаем 401 для правильной обработки в компоненте
        return new Response(JSON.stringify({ detail: "Сессия истекла, пожалуйста, войдите снова" }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      console.log("Token refreshed successfully.");
    } catch (error) {
      console.error("Error during token refresh:", error);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return new Response(JSON.stringify({ detail: "Ошибка обновления токена" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 3. Добавляем актуальный токен в заголовки
  const headers = new Headers(options.headers);
  if (currentAccessToken) {
    headers.set("Authorization", `Bearer ${currentAccessToken}`);
  }

  // 4. Выполняем оригинальный запрос
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // 5. (Опционально) Проверяем, не вернул ли сервер 401 даже с (вроде бы) валидным токеном
  // Это может случиться, если токен отозван на сервере или есть другие проблемы
  if (response.status === 401) {
    console.warn(
      "Received 401 Unauthorized even after potential token refresh.",
    );
    // Повторная попытка обновления токена или сразу logout/редирект
    const refreshedAgain = await refreshToken(currentRefreshToken!); // Пробуем еще раз на всякий случай
    if (refreshedAgain) {
      headers.set("Authorization", `Bearer ${refreshedAgain}`);
      const retryResponse = await fetch(url, { ...options, headers });
      if (retryResponse.status === 401) {
        // Если и вторая попытка не удалась - точно logout
        console.error("Still 401 after second refresh attempt. Logging out.");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        
        // Вместо жесткого редиректа возвращаем ответ с 401
        return new Response(JSON.stringify({ detail: "Сессия истекла, требуется повторная авторизация" }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return retryResponse; // Возвращаем ответ второй попытки
    } else {
      // Если и первый раз рефреш не удался - logout
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      
      // Вместо жесткого редиректа возвращаем ответ с 401
      return new Response(JSON.stringify({ detail: "Ошибка обновления токена, требуется повторная авторизация" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return response;
};
