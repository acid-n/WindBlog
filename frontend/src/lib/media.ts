export function getAbsoluteImageUrl(imagePath?: string): string | null {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;

  const base =
    typeof window === 'undefined'
      ? process.env.DJANGO_MEDIA_URL_SSR || process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL || 'http://localhost:8000/media/'
      : process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL || 'http://localhost:8000/media/';

  let cleanPath = imagePath;
  if (cleanPath.startsWith('/media/')) {
    cleanPath = cleanPath.substring('/media/'.length);
  } else if (cleanPath.startsWith('media/')) {
    cleanPath = cleanPath.substring('media/'.length);
  }
  const baseWithSlash = base.endsWith('/') ? base : `${base}/`;
  return `${baseWithSlash}${cleanPath}`;
}
