// Универсальная функция для получения публичного URL к медиа-файлу
export function getClientMediaUrl(src: string): string {
  if (!src) return src;

  const publicBase = process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL || 'http://localhost:8000/media/';
  if (/^https?:\/\//.test(src)) return src;
  let clean = src;
  // Если путь начинается с /media/, убираем этот префикс
  if (clean.startsWith('/media/')) clean = clean.substring('/media/'.length);
  // Если путь уже содержит домен медиа, возвращаем как есть
  if (src.startsWith(publicBase)) return src;
  // Если clean содержит слэш в начале — убираем
  clean = clean.replace(/^\/+/, '');
  return (publicBase.endsWith('/') ? publicBase : publicBase + '/') + clean;
}
