#!/bin/bash
set -e

# Скрипт для универсальной сборки Next.js на любой архитектуре
# Работает как на x86_64, так и на ARM64, даже с проблемными нативными модулями

echo "🚀 Запуск универсальной сборки Next.js для любой архитектуры"

# 1. Настройка среды
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=4096"

# Отключение проблемных нативных модулей
export NEXT_PRIVATE_IGNORE_LIGHTNINGCSS=1
export NEXT_DISABLE_LIGHTNINGCSS=1

# 2. Создаем оптимизированную конфигурацию Next.js
echo "📝 Создаем оптимизированную конфигурацию Next.js для совместимости с ARM64..."

cat > next.config.js << 'EOL'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
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
    unoptimized: true, // Важно для статического экспорта
  },
  async rewrites() {
    return [
      {
        source: '/media/:path*',
        destination: 'http://localhost:8000/media/:path*',
      },
    ];
  },

  // Для статического экспорта
  output: 'export',
  
  // Отключаем проблемные оптимизации
  swcMinify: false,
  optimizeFonts: false,
  
  // Отключаем функционал, требующий nativeModules
  experimental: {
    serverActions: false,
    serverComponentsExternalPackages: [],
    optimizeCss: false,
    forceSwcTransforms: false,
    // Нет упоминания css: false, т.к. это вызывает предупреждения в Next.js 14
  },
  
  // Переопределение загрузчиков webpack для отключения проблемных модулей
  webpack: (config, { isServer, dev }) => {
    // Добавляем alias для проблемных модулей
    config.resolve.alias = {
      ...config.resolve.alias,
      // Отключаем lightningcss путем замены его на заглушку
      'lightningcss': require.resolve('../noop-module.js'),
    };
    
    return config;
  },
};

module.exports = nextConfig;
EOL

# 3. Создаем простую заглушку для noop-модуля
if [ ! -f noop-module.js ]; then
  echo "📝 Создаем универсальную заглушку для нативных модулей..."
  cat > noop-module.js << 'EOL'
/**
 * Универсальная заглушка для нативных модулей
 * Работает с любыми проблемными нативными модулями в Next.js
 */

// Обработчик всех возможных вызовов функций
const noopHandler = {
  get: (target, prop) => {
    // Возвращаем функцию-заглушку для любого вызова метода
    if (typeof prop === 'string') {
      return (...args) => {
        // Для методов transform, bundle, compile возвращаем объект с code
        if (['transform', 'bundle', 'compile'].includes(prop)) {
          return { code: '', map: null, warnings: [] };
        }
        // Для других методов возвращаем пустой объект
        return {};
      };
    }
    return undefined;
  }
};

// Создаем прокси-объект, который обрабатывает все обращения к модулю
module.exports = new Proxy({}, noopHandler);
EOL
fi

# 4. Создаем совместимую конфигурацию PostCSS
echo "📝 Создаем совместимую конфигурацию PostCSS..."
cat > postcss.config.js << 'EOL'
module.exports = {
  plugins: {
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOL

# 5. Запуск сборки Next.js
echo "🏗️ Запуск сборки Next.js..."
npm run build

echo "✅ Сборка успешно завершена! Статические файлы находятся в папке 'out'"
echo "🌐 Для локального тестирования: npx serve out"
echo "🐳 Для запуска в Docker: docker-compose up frontend"
