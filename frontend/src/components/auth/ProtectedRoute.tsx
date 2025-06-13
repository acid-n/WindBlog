"use client";

import { useEffect, ReactNode, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { jwtDecode } from "jwt-decode";

interface ProtectedRouteProps {
  children: ReactNode;
}

// Интерфейс для JWT токена
interface DecodedJwt {
  user_id: number;
  exp: number;
  [key: string]: any;
}

/**
 * Компонент для защиты роутов, требующих авторизации.
 * Обеспечивает доступ к защищенным страницам только авторизованным пользователям.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, refreshToken } = useAuth();
  const router = useRouter();
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [manualAuthCheck, setManualAuthCheck] = useState(false);
  const [manualUser, setManualUser] = useState<{ id: number } | null>(null);
  const manualCheckRef = useRef(false);
  
  // Диагностическая функция для записи состояния аутентификации
  const logAuthStatus = useCallback(() => {
    console.log(
      `[ProtectedRoute] Статус: isLoading=${isLoading}, user=${Boolean(user)}, manualUser=${Boolean(manualUser)}, tokens=${Boolean(localStorage.getItem("accessToken"))}`
    );
  }, [isLoading, user, manualUser]);

  // Ручная проверка наличия токенов без ожидания загрузки AuthContext
  useEffect(() => {
    // Предотвращаем повторную проверку
    if (manualCheckRef.current) return;
    manualCheckRef.current = true;
    
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      try {
        const decoded = jwtDecode<DecodedJwt>(accessToken);
        // Проверка на истечение токена
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (decoded.exp > currentTime) {
          // Токен действителен, создаем временного пользователя
          setManualUser({ id: decoded.user_id });
          console.log(`[ProtectedRoute] Создан временный пользователь ID: ${decoded.user_id}`);
        } else {
          // Токен истек, пробуем обновить
          console.log('[ProtectedRoute] Токен истек, запрашиваем обновление');
          // Запрашиваем обновление токена через контекст авторизации
          refreshToken();
        }
      } catch (e) {
        console.error('[ProtectedRoute] Ошибка при проверке токена:', e);
      }
    }
    setManualAuthCheck(true);
  }, [refreshToken]);

  // Основная логика защиты маршрута и редиректа
  useEffect(() => {
    logAuthStatus();
    
    // Пропускаем, если загрузка еще идет или уже была попытка редиректа
    if (isLoading || redirectAttempted) return;
    
    // Если у нас есть пользователь в контексте или временный пользователь - всё в порядке
    if (user || manualUser) return;
    
    // Если нет пользователя и ручная проверка завершена - нужен редирект
    if (manualAuthCheck && !user && !manualUser) {
      setRedirectAttempted(true);
      const currentPath = window.location.pathname;
      console.log(`[ProtectedRoute] Перенаправление на страницу входа с путем: ${currentPath}`); 
      
      // Используем программную навигацию для сохранения контекста
      router.push(`/login?next=${encodeURIComponent(currentPath)}`);
    }
    
  }, [user, isLoading, redirectAttempted, manualUser, manualAuthCheck, logAuthStatus]);

  // Показываем индикатор загрузки, пока проверяем аутентификацию
  if (isLoading && !manualUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  // Если нет ни пользователя в контексте, ни временного пользователя - показываем страницу авторизации
  if (!user && !manualUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 max-w-md mx-auto bg-white rounded-lg shadow-md">
          <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-4V7a3 3 0 00-3-3H7a3 3 0 00-3 3v4h10z" />
          </svg>
          <h2 className="text-2xl font-bold mb-2">Требуется авторизация</h2>
          <p className="text-gray-600 mb-6">Для доступа к этой странице необходимо войти в систему.</p>
          <button 
            onClick={() => router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Перейти к входу
          </button>
        </div>
      </div>
    );
  }

  // Если пользователь авторизован (в контексте или временный) - показываем защищенное содержимое
  return <>{children}</>;
}
