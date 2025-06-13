"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode"; // Установим эту библиотеку

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
    console.log('[AuthContext] Начало загрузки аутентификации из localStorage');
    setIsLoading(true);
    
    const initAuth = async () => {
      try {
        const storedAccessToken = localStorage.getItem("accessToken");
        const storedRefreshToken = localStorage.getItem("refreshToken");
        
        console.log(`[AuthContext] Токены в localStorage: accessToken=${Boolean(storedAccessToken)}, refreshToken=${Boolean(storedRefreshToken)}`);

        // Проверяем наличие токенов
        if (!storedAccessToken || !storedRefreshToken) {
          console.log('[AuthContext] Отсутствуют необходимые токены');
          setAccessToken(null);
          setUser(null);
          return;
        }
        
        // Проверяем валидность токена
        try {
          const currentTime = Math.floor(Date.now() / 1000);
          const decodedToken = jwtDecode<DecodedJwt>(storedAccessToken);
          
          // Если токен истек или скоро истечет
          if (decodedToken.exp && decodedToken.exp < currentTime + 300) { // 5 минут запаса
            console.log('[AuthContext] Токен истек или скоро истечет, пытаемся обновить');
            
            // Выполняем обновление токена
            await refreshToken();
            // После обновления проверяем, есть ли новый токен
            const newAccessToken = localStorage.getItem("accessToken");
            if (newAccessToken) {
              const newDecodedToken = jwtDecode<DecodedJwt>(newAccessToken);
              setAccessToken(newAccessToken);
              setUser({
                id: newDecodedToken.user_id,
                email: newDecodedToken.email,
                username: newDecodedToken.username,
              });
              console.log('[AuthContext] Токен успешно обновлен');
            }
          } else {
            // Токен еще действителен
            console.log('[AuthContext] Токен действителен, устанавливаем пользователя');
            setAccessToken(storedAccessToken);
            setUser({
              id: decodedToken.user_id,
              email: decodedToken.email,
              username: decodedToken.username,
            });
          }
        } catch (decodeError) {
          console.error('[AuthContext] Ошибка при декодировании токена:', decodeError);
          // Токен невалидный, пробуем его обновить
          try {
            await refreshToken();
          } catch (refreshError) {
            console.error('[AuthContext] Не удалось обновить токен:', refreshError);
            // В случае ошибки обновления очищаем все токены
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            setAccessToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('[AuthContext] Ошибка при инициализации аутентификации:', error);
        // Очищаем токены при любой ошибке
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
        console.log('[AuthContext] Завершена инициализация аутентификации');
      }
    };
    
    // Вызываем функцию initAuth для инициализации авторизации
    initAuth();
    
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

  // Логика обновления токена с улучшенной обработкой ошибок
  const refreshToken = async () => {
    setIsLoading(true);
    try {
      console.log("[AuthContext] Начало процесса обновления токена...");
      
      const storedRefreshToken = localStorage.getItem("refreshToken");
      if (!storedRefreshToken) {
        console.error("[AuthContext] Refresh токен не найден в localStorage");
        throw new Error("No refresh token found");
      }
      
      // Используем текущий origin для обновления токена
      // Это гарантирует, что запрос будет направлен к тому же серверу, откуда была загружена страница
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://backend:8000';
      const refreshUrl = `${baseUrl}/api/token/refresh/`;
      console.log(`[AuthContext] URL для обновления токена: ${refreshUrl}`);
      
      // Проверяем длину токена перед запросом
      if (storedRefreshToken.length < 10) {
        console.error("[AuthContext] Refresh токен недействителен или слишком короткий");
        throw new Error("Invalid refresh token");
      }
      
      const response = await fetch(refreshUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: storedRefreshToken }),
        // Отключаем кеширование
        cache: "no-store",
      });
      
      console.log(`[AuthContext] Ответ на запрос обновления: ${response.status} ${response.statusText}`);
      
      // Получаем тело ответа в текстовом формате
      const responseText = await response.text();
      let data;
      
      try {
        // Пытаемся распарсить JSON
        data = JSON.parse(responseText);
        console.log("[AuthContext] Успешно получены данные:", {
          hasAccess: Boolean(data.access),
          hasRefresh: Boolean(data.refresh)
        });
      } catch (jsonError) {
        console.error(`[AuthContext] Ошибка парсинга JSON: ${responseText.substring(0, 100)}...`, jsonError);
        throw new Error("Invalid JSON response");
      }
      
      if (!response.ok) {
        console.error("[AuthContext] Ошибка обновления токена:", data);
        throw new Error(`Failed to refresh token: ${response.status}`);
      }
      
      if (data.access) {
        console.log("[AuthContext] Получен новый access токен, сохраняем");
        localStorage.setItem("accessToken", data.access);
        setAccessToken(data.access);
        
        try {
          const decodedToken = jwtDecode<DecodedJwt>(data.access);
          setUser({
            id: decodedToken.user_id,
            email: decodedToken.email,
            username: decodedToken.username,
          });
          console.log(`[AuthContext] Токен успешно декодирован для пользователя: ${decodedToken.username || decodedToken.user_id}`);
        } catch (decodeError) {
          console.error("[AuthContext] Ошибка при декодировании токена:", decodeError);
          // Даже если не смогли декодировать, сохраняем токен
        }
      } else {
        console.error("[AuthContext] Сервер не вернул новый access токен");
        throw new Error("No access token in response");
      }
      
      if (data.refresh) {
        console.log("[AuthContext] Получен новый refresh токен, обновляем");
        localStorage.setItem("refreshToken", data.refresh);
      }
      
      console.log("[AuthContext] Токен успешно обновлен");
    } catch (error) {
      console.error("[AuthContext] Ошибка при обновлении токена:", error);
      // Выполняем выход только при определенных ошибках
      if (error instanceof Error && 
         (error.message.includes("No refresh token found") || 
          error.message.includes("Failed to refresh token"))) {
        console.log("[AuthContext] Выполняем выход из системы из-за ошибки токена");
        logout();
      }
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
