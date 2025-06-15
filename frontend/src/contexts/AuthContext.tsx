"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode"; // Установим эту библиотеку
import { getBackendOrigin } from "@/lib/apiBase";

interface User {
  id: number; // Это будет user_id из токена
  email?: string; // Попытаемся извлечь, если есть
  username?: string; // Попытаемся извлечь, если есть
  // Добавьте другие поля пользователя, если они есть в JWT и нужны
}

interface DecodedJwt {
  token_type: string;
  exp: number;
  iat: number;
  jti: string;
  user_id: number;
  email?: string; // Добавляем опционально
  username?: string; // Добавляем опционально
  // Могут быть и другие стандартные или кастомные поля
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (access: string, refresh: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Изначально true, пока не проверим токены

  useEffect(() => {
    // При загрузке приложения пытаемся загрузить токены из localStorage
    setIsLoading(true);
    try {
      const storedAccessToken = localStorage.getItem("accessToken");
      // Пока не используем, но храним

      if (storedAccessToken) {
        const decodedToken = jwtDecode<DecodedJwt>(storedAccessToken); // Декодируем токен
        // Проверка на истечение срока действия токена (опционально здесь, т.к. сервер все равно проверит)
        // const currentTime = Date.now() / 1000;
        // if (decodedToken.exp < currentTime) { ... }
        setAccessToken(storedAccessToken);
        setUser({
          id: decodedToken.user_id,
          email: decodedToken.email,
          username: decodedToken.username,
        });
      }
    } catch (error) {
      console.error("Error loading auth state from localStorage:", error);
      // Если ошибка (например, невалидный токен), очищаем хранилище
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (access: string, refresh: string) => {
    setIsLoading(true);
    try {
      const decodedToken = jwtDecode<DecodedJwt>(access);
      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);
      setAccessToken(access);
      setUser({
        id: decodedToken.user_id,
        email: decodedToken.email,
        username: decodedToken.username,
      });
    } catch (error) {
      console.error("Error during login (decoding token):", error);
      // Очищаем в случае ошибки
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setAccessToken(null);
      setUser(null);
      throw error; // Пробрасываем ошибку дальше, чтобы форма логина могла ее обработать
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setAccessToken(null);
    setUser(null);
    // Возможно, потребуется перенаправление на главную или страницу входа
    // router.push('/login');
  };

  // Логика обновления токена
  const refreshToken = async () => {
    setIsLoading(true);
    try {
      const storedRefreshToken = localStorage.getItem("refreshToken");
      if (!storedRefreshToken) {
        throw new Error("No refresh token found");
      }
      // Эндпоинт обновления токена (замените на ваш путь, если отличается)
      const response = await fetch(`${getBackendOrigin()}/api/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: storedRefreshToken }),
      });
      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }
      const data = await response.json();
      if (data.access) {
        localStorage.setItem("accessToken", data.access);
        setAccessToken(data.access);
        const decodedToken = jwtDecode<DecodedJwt>(data.access);
        setUser({
          id: decodedToken.user_id,
          email: decodedToken.email,
          username: decodedToken.username,
        });
      }
      if (data.refresh) {
        localStorage.setItem("refreshToken", data.refresh);
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      logout(); // Если не удалось обновить — выходим из аккаунта
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isLoading, login, logout, refreshToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
