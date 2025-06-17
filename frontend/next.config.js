/** @type {import('next').NextConfig} */
const nextConfig = (() => {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
  const url = new URL(backendUrl);
  const backendHostname = url.hostname;
  const backendProtocol = url.protocol.slice(0, -1);

  return {
    async rewrites() {
      return [
        {
          source: "/api/v1/:path*",
          destination: `${backendUrl}/api/v1/:path*`,
        },
        {
          source: "/media/:path*",
          destination: `${backendUrl}/media/:path*`,
        },
        {
          source: "/sitemap.xml",
          destination: "/sitemap",
        },
      ];
    },
    images: {
      remotePatterns: [
        {
          /** @type {'http' | 'https'} */
          protocol: backendProtocol,
          hostname: backendHostname,
          // port: process.env.BACKEND_PORT,
          // pathname: '/media/**',
        },
      ],
    },
    reactStrictMode: true,
    typescript: {
      // Игнорируем ошибки типов на этапе сборки для стабильности CI
      ignoreBuildErrors: true,
    },
  };
})();

module.exports = nextConfig;
