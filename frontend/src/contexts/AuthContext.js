"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

// Создаем контекст аутентификации
const AuthContext = createContext();

// Экспортируем хук для использования контекста
export const useAuth = () => useContext(AuthContext);

// Провайдер аутентификации
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Инициализация при загрузке
  useEffect(() => {
    // Проверяем наличие сохраненного пользователя в localStorage
    const checkLoggedIn = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (storedUser && token) {
          // Здесь можно добавить запрос к API для проверки действительности токена
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Ошибка при проверке аутентификации:', error);
        // Очищаем localStorage при ошибке
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    // Запускаем проверку только на клиенте
    if (typeof window !== 'undefined') {
      checkLoggedIn();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Функция для входа пользователя
  const login = async (credentials) => {
    try {
      setIsLoading(true);
      
      // Здесь будет запрос к API для аутентификации
      // const response = await fetch('/api/v1/auth/login/', {...});
      
      // Временная имитация успешного ответа для демонстрации
      const mockUser = {
        id: 1,
        username: 'demo_user',
        email: 'user@example.com',
      };
      
      // Сохраняем пользователя и токен в localStorage
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('token', 'demo_token');
      
      setUser(mockUser);
      return { success: true };
    } catch (error) {
      console.error('Ошибка при входе:', error);
      return { 
        success: false, 
        error: error.message || 'Произошла ошибка при входе' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для выхода пользователя
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  // Значение контекста
  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
