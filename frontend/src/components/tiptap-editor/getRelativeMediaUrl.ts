// Возвращает относительный путь для next/image или любых публичных запросов через прокси
export function getRelativeMediaUrl(src: string): string {
  if (!src) return src;
  if (src.startsWith('/media/')) return src;
  // Если абсолютный URL нашего бэка
  const matches = src.match(/\/media\/.*$/);
  if (matches) return matches[0];
  return src;
}
