/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Настройки изображений, универсальные для любой архитектуры
  images: {
    domains: ['localhost', 'backend'],
    unoptimized: true, // Важно для совместимости с ARM64
    remotePatterns: [
      // Для локальной разработки
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/media/**",
      },
      // Для работы внутри Docker (SSR и клиент)
      {
        protocol: "http",
        hostname: "backend",
        port: "8000",
        pathname: "/media/**",
      },
    ],
  },
  // Улучшенные правила перенаправления для более точной маршрутизации API-запросов
  async rewrites() {
    // Определяем базовый URL для бэкенда в зависимости от окружения
    // В Docker контейнерах нужно использовать имя сервиса вместо localhost
    const backendUrl = (() => {
      // Для SSR в Docker-контейнере
      if (process.env.DOCKER_ENV) {
        return "http://backend:8000";
      }
      // Для локальной разработки
      return "http://localhost:8000";
    })();
    
    console.log(`Backend API URL: ${backendUrl}`);
    
    return [
      // Перенаправление запросов JWT-токенов для авторизации
      {
        source: '/api/token/:path*',
        destination: `${backendUrl}/api/token/:path*`,
      },
      // Перенаправление корневого пути токенов
      {
        source: '/api/token',
        destination: `${backendUrl}/api/token/`,
      },
      // Обработка логов - добавляем отдельное правило
      {
        source: '/api/v1/logs',
        destination: `${backendUrl}/api/v1/logs/`,
      },
      {
        source: '/api/v1/logs/:path*',
        destination: `${backendUrl}/api/v1/logs/:path*`,
      },
      // Специальное правило для запросов к постам
      {
        source: '/api/v1/posts/:slug',
        destination: `${backendUrl}/api/v1/posts/:slug/`,
      },
      // Правила для тегов
      {
        source: '/api/v1/tags',
        destination: `${backendUrl}/api/v1/tags/`,
      },
      {
        source: '/api/v1/tags/:path*',
        destination: `${backendUrl}/api/v1/tags/:path*`,
      },
      // Обработка всех остальных запросов с сегментом v1
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
      // Медиа-файлы
      {
        source: '/media/:path*',
        destination: `${backendUrl}/media/:path*`,
      },
      // Важно: пути редактирования и создания постов НЕ перенаправляются на бэкенд,
      // они обрабатываются на фронтенде в Next.js приложении
      {
        source: '/admin/edit-post/:path*',
        destination: '/admin/edit-post/:path*',
      },
      {
        source: '/admin/create-post',
        destination: '/admin/create-post',
      },
      {
        source: '/admin/drafts',
        destination: '/admin/drafts',
      },
      // Перенаправление остальных запросов админки на Django
      {
        source: '/admin/:path*',
        has: [
          {
            type: 'header',
            key: 'accept',
            value: '(?!text/html).*',
          },
        ],
        destination: 'http://backend:8000/admin/:path*',
      },
      // Перенаправление корневого пути админки Django
      {
        source: '/admin',
        has: [
          {
            type: 'header',
            key: 'accept',
            value: '(?!text/html).*',
          },
        ],
        destination: 'http://backend:8000/admin/',
      },
    ];
  },
  // Отключаем оптимизации, которые могут вызывать проблемы на ARM64
  swcMinify: false,
  optimizeFonts: false,
  // Отключение экспериментальных функций
  experimental: {
    // ServerActions доступны по умолчанию в Next.js 14, не нужно явно указывать
    optimizeCss: false,
    serverComponentsExternalPackages: [],
  }
};

module.exports = nextConfig;
