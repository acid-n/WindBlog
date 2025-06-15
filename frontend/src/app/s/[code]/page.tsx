'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ShortLinkRedirect({ 
  params 
}: { 
  params: { code: string } 
}) {
  const router = useRouter();
  const { code } = params;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function redirectToPost() {
      if (!code) {
        console.error('Отсутствует код короткой ссылки');
        setError('Отсутствует код короткой ссылки');
        setTimeout(() => router.push('/'), 2000);
        return;
      }
      
      try {
        // fetchPostById is deprecated or not implemented.
        setError('Функция коротких ссылок временно недоступна. Пожалуйста, обратитесь к администратору.');
        setTimeout(() => router.push('/'), 2000);
      } catch (error) {
        console.error('Ошибка при перенаправлении короткой ссылки:', error);
        setError('Не удалось найти запрашиваемую страницу');
        setTimeout(() => router.push('/'), 2000);
      }
    }

    redirectToPost();
  }, [code, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Ошибка</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-gray-500">Перенаправление на главную страницу...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="animate-pulse text-center">
        <h1 className="text-2xl font-bold mb-4">Перенаправление...</h1>
        <p className="text-gray-600">Пожалуйста, подождите</p>
      </div>
    </div>
  );
} 