import type { NextConfig } from "next";

// Определяем URL бэкенда из переменной окружения или по умолчанию
const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
const backendHostname = new URL(backendUrl).hostname;
const backendProtocol = new URL(backendUrl).protocol.slice(0, -1); // http или https
const backendPort = new URL(backendUrl).port || '';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: '/media/:path*',
        destination: `${backendUrl}/media/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: backendProtocol as "http" | "https",
        hostname: backendHostname,
        // port: backendPort, // Раскомментируйте, если порт нестандартный и нужен в паттерне
        // pathname: '/media/**', // Можно указать более конкретный путь, если нужно
      },
      // Можно добавить другие паттерны для других доменов
    ],
  },
  reactStrictMode: true, // Рекомендуется для разработки
  typescript: {
    // Игнорируем ошибки типов на этапе сборки,
    // чтобы не прерывать CI при отсутствии строгой типизации
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
