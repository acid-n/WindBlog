import path from 'path';
import { recursiveReadDir } from 'next/dist/lib/recursive-readdir';
// polyfill для утилит Next
import { TextEncoder, TextDecoder } from 'util';

// @ts-expect-error polyfill
global.TextEncoder = TextEncoder as unknown as typeof global.TextEncoder;
// @ts-expect-error polyfill
global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;

// Next internals ожидают глобальный класс Request
(global as any).Request = class {};

const { isReservedPage } = require('next/dist/build/utils');

/**
 * Проверяем, что маршрут sitemap существует в единственном экземпляре
 * и нет конфликтующих путей.
 */
test('sitemap route is unique', async () => {
  const appDir = path.join(process.cwd(), 'src', 'app');
  const files = await recursiveReadDir(appDir, { relativePathnames: false });
  const routeFiles = files.filter(f => /(?:route\.ts|page\.(?:ts|tsx))$/.test(f));
  const routes = routeFiles
    .map(f => {
      const rel = path
        .relative(appDir, f)
        .replace(/\\/g, '/');
      return (
        '/' +
        rel
          .replace(/\/route\.ts$/, '')
          .replace(/(?:\/|^)page\.(?:ts|tsx)$/, '')
          .replace(/\/index$/, '')
      );
    })
    .filter(r => !isReservedPage(r));

  const sitemapRoutes = routes.filter(r => r === '/sitemap');
  expect(new Set(routes).size).toBe(routes.length);
  expect(sitemapRoutes).toHaveLength(1);
});
