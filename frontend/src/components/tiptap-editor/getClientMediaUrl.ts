// Универсальная функция для получения публичного URL к медиа-файлу
export function getClientMediaUrl(src: string): string {
  if (!src) return src;

  // Удаляем docker-адрес из src, если он вдруг попал в данные
  let clean = src.replace(/^https?:\/\/backend:8000\/media\//, '')
                 .replace(/^https?:\/\/backend:8000\//, '')
                 .replace(/^\/media\//, '');

  const publicBase = process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL || 'http://localhost:8000/media/';
  // Если путь уже содержит домен медиа, возвращаем как есть
  if (src.startsWith(publicBase)) return src;
  // Если clean содержит слэш в начале — убираем
  clean = clean.replace(/^\/+/, '');
  return (publicBase.endsWith('/') ? publicBase : publicBase + '/') + clean;
}
