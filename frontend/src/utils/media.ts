/**
 * Утилиты для работы с медиа-ресурсами
 */

/**
 * Преобразует относительный или внутренний Docker-путь к медиа-файлу в публичный URL
 * @param src Исходный путь к медиа-файлу (может содержать Docker-пути)
 * @returns Публичный URL для клиентского использования
 */
export function getClientMediaUrl(src: string): string {
  if (!src) return src;

  // Добавляем отладочную информацию
  console.log(`[getClientMediaUrl] Исходный src:`, src);

  // Если это внутренний Docker-путь, нужно преобразовать его в публичный URL
  if (src.startsWith('http://backend:8000/') || src.startsWith('https://backend:8000/')) {
    // Удаляем Docker-префикс и получаем чистый путь
    const cleanPath = src
      .replace(/^https?:\/\/backend:8000\/media\//, '')
      .replace(/^https?:\/\/backend:8000\//, '');
      
    // Формируем абсолютный URL с доменом localhost
    const absoluteUrl = `http://localhost:3000/media/${cleanPath}`;
    console.log(`[getClientMediaUrl] Преобразование Docker-пути в публичный URL:`, absoluteUrl);
    return absoluteUrl;
  }
  
  // Если это уже абсолютный URL с публичным доменом, возвращаем как есть
  if (src.startsWith('http')) {
    return src;
  }

  // Для относительных путей (начинающихся с / или /media/)
  let clean = src.replace(/^\/media\//, '');

  // Если clean содержит слэш в начале — убираем
  clean = clean.replace(/^\/+/, '');
  
  // Формируем абсолютный URL с текущим доменом
  // Это важно для корректной работы с next/image
  const absoluteUrl = `http://localhost:3000/media/${clean}`;
  
  console.log(`[getClientMediaUrl] Сформирован абсолютный URL:`, absoluteUrl);
  return absoluteUrl;
}
