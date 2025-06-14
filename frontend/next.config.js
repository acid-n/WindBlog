/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Игнорируем ошибки типов в CI
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/**", // ИЗМЕНЕНО: Разрешаем все пути на localhost:8000
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/media/**",
      },
      // Если в будущем изображения будут на другом хосте в продакшене, его нужно будет добавить сюда
      // например, для статики на CDN или объектного хранилища
    ],
  },
  async rewrites() {
    return [
      {
        source: '/media/:path*',
        destination: 'http://localhost:8000/media/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
