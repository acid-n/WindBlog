"use client";

import React from "react";
import Link from "next/link";

/**
 * Заглушка для страницы черновиков
 * Для успешной сборки на ARM64 заменили компонент на заглушку
 */

const DraftsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Администрирование - черновики</h1>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <p className="text-yellow-700">
          <strong>Примечание:</strong> Панель администрирования недоступна в этой версии сборки для ARM64.
          Пожалуйста, используйте административный интерфейс Django на бэкенде.
        </p>
      </div>
      
      <p className="mb-4">
        Административный интерфейс Django доступен по адресу:
      </p>
      
      <a 
        href="/admin" 
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-6"
      >
        Django Admin
      </a>
      
      <div className="mt-8">
        <Link 
          href="/"
          className="text-blue-600 hover:underline"
        >
          ← Вернуться на главную
        </Link>
      </div>
    </div>
  );
};

export default DraftsPage;
