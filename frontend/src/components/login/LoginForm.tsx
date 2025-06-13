"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Клиентский компонент формы авторизации
 * Содержит логику для взаимодействия с API авторизации
 */
/**
 * Компонент формы авторизации с поддержкой перенаправления после успешного входа
 * Обрабатывает параметр next для возврата пользователя на изначально запрошенную страницу
 */
interface LoginFormProps {
  nextPath?: string;
}

export default function LoginForm({ nextPath = '/' }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const router = useRouter();
  const { login } = useAuth();
  
  // nextPath приходит из пропсов или используется значение по умолчанию ('/')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    // Проверяем, что поля не пустые
    if (!email || !password) {
      setError("Все поля обязательны для заполнения");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      console.log('Начало процесса авторизации');
      
      // Всегда используем текущий домен, через который пользователь заходит на сайт
      // Это обеспечит правильную работу и в браузере, и в контейнере
      const backendUrl = typeof window !== 'undefined' ? 
        window.location.origin : 
        'http://backend:8000';
      
      const url = `${backendUrl}/api/token/`;
      console.log(`Отправляем запрос на URL: ${url}`);
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ email, password }),
        // Отключаем кэширование
        cache: 'no-store',
        // Позволяем кросс-доменные запросы
        mode: 'cors',
        credentials: 'include',
      });
      
      console.log(`Статус ответа: ${response.status}`);
      
      if (!response.ok) {
        // Аккуратно получаем текст ошибки
        const errorText = await response.text();
        console.error('Текст ошибки:', errorText);
        
        let errorDetail = 'Ошибка авторизации';
        try {
          const errorData = JSON.parse(errorText);
          errorDetail = errorData.detail || errorDetail;
        } catch (e) {
          console.error('Ошибка при парсинге JSON:', e);
        }
        
        throw new Error(errorDetail);
      }
      
      const data = await response.json();
      
      // Сохраняем токены в контексте авторизации
      await login(data.access, data.refresh);
      
      // Перенаправляем на запрошенную страницу или на главную, если next не указан
      // Используем replace вместо push, чтобы не добавлять новых записей в историю браузера
      router.replace(nextPath);
      console.log(`Успешная авторизация. Перенаправление на: ${nextPath}`);
    } catch (err) {
      console.error("Ошибка при авторизации:", err);
      setError(err instanceof Error ? err.message : "Неизвестная ошибка авторизации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center mt-8 py-4">
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full py-2 px-3 text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
              placeholder="your@email.com"
              required
              autoFocus
              autoComplete="email"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
              Пароль
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-2 px-3 text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
              placeholder="Ваш пароль"
              required
              autoComplete="current-password"
            />
          </div>
          
          <div className="flex items-center justify-center">
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
