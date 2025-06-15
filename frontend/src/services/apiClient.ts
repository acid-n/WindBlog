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

// Функция для обновления токена
const refreshToken = async (
  currentRefreshToken: string,
): Promise<string | null> => {
  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000/api/v1";
    const refreshUrl = `${apiUrl.replace("/v1", "")}/token/refresh/`;

    const response = await fetch(refreshUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: currentRefreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Token refresh failed:", data);
      // Возможно, стоит удалить токены из localStorage здесь
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return null;
    }

    const newAccessToken = data.access;
    // Иногда сервер возвращает и новый refresh токен, обрабатываем это
    const newRefreshToken = data.refresh;
    if (newAccessToken) {
      localStorage.setItem("accessToken", newAccessToken);
      if (newRefreshToken) {
        localStorage.setItem("refreshToken", newRefreshToken);
      }
      return newAccessToken;
    }
    return null;
  } catch (error) {
    console.error("Error during token refresh request:", error);
    return null;
  }
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
    if (!currentRefreshToken) {
      // Тут можно вызвать logout из AuthContext или просто выбросить ошибку/редирект
      window.location.href = "/login"; // Простой редирект
      throw new Error("Требуется аутентификация");
    }

    // 2. Пытаемся обновить токен
    currentAccessToken = await refreshToken(currentRefreshToken);

    if (!currentAccessToken) {
      // Аналогично - logout или редирект
      window.location.href = "/login";
      throw new Error("Сессия истекла, пожалуйста, войдите снова");
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
        window.location.href = "/login";
        throw new Error("Неверный токен или недостаточно прав");
      }
      return retryResponse; // Возвращаем ответ второй попытки
    } else {
      // Если и первый раз рефреш не удался - logout
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
      throw new Error("Неверный токен или недостаточно прав");
    }
  }

  return response;
};
