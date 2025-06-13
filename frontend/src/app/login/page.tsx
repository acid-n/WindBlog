"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import LoginForm from "@/components/login/LoginForm";

/**
 * Клиентский компонент страницы авторизации 
 * защищенный от циклических редиректов
 */
function LoginPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  
  // Получаем параметр next для перенаправления после авторизации
  let nextPath = searchParams?.get('next') || '/';
  
  // Если next содержит /admin/login, исправляем на /admin
  if (nextPath.includes('/admin/login')) {
    nextPath = '/admin';
  }
  
  // Если пользователь уже авторизован, сразу перенаправляем на запрошенную страницу
  useEffect(() => {
    if (!isLoading && user && !redirectAttempted) {
      setRedirectAttempted(true);
      console.log(`Пользователь уже авторизован, перенаправление на: ${nextPath}`);
      
      // Используем нативный редирект вместо router.replace для более надежного перенаправления
      window.location.href = nextPath;
    }
  }, [user, isLoading, nextPath, redirectAttempted]);

  // Показываем индикатор загрузки во время проверки авторизации
  if (isLoading || redirectAttempted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Проверка авторизации...</p>
        </div>
      </div>
    );
  }
  
  // Если пользователь не авторизован, показываем форму входа
  return <LoginForm nextPath={nextPath} />;
}

export default LoginPage;
