/** @type {import('next').NextConfig} */
const originalConfig = require('./next.config');

// Конфигурация, полностью отключающая проблемные нативные компоненты
const nextConfig = {
  ...originalConfig,
  // Отключаем минификацию кода с помощью SWC
  swcMinify: false,
  
  // Отключаем оптимизацию шрифтов
  optimizeFonts: false,
  
  // Отключаем экспериментальные функции, требующие нативные модули
  experimental: {
    // Полностью отключаем CSS обработчики, которые используют lightningcss
    css: false,
    
    // Сохраняем другие экспериментальные настройки из оригинальной конфигурации
    ...(originalConfig.experimental || {}),
    
    // Убираем любые возможные использования lightningcss
    optimizeCss: false,
    forceSwcTransforms: false,
  },
  
  // Настройки webpack для замены проблемных модулей
  webpack: (config, { isServer, dev }) => {
    // Сначала применяем кастомные настройки webpack из оригинальной конфигурации, если они есть
    if (typeof originalConfig.webpack === 'function') {
      config = originalConfig.webpack(config, { isServer, dev });
    }
    
    // Добавляем aliases для проблемных модулей
    config.resolve.alias = {
      ...config.resolve.alias,
      // Отключаем lightningcss путем замены его на заглушку
      'lightningcss': require.resolve('./noop-module.js'),
    };
    
    return config;
  },
};

module.exports = nextConfig;
