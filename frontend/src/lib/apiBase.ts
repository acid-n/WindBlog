export function getBaseUrl(): string {
  if (typeof window === 'undefined') {
    const fromEnv = process.env.DJANGO_MEDIA_URL_SSR;
    if (fromEnv) {
      return fromEnv.replace(/\/media\/?$/, '/api/v1');
    }
    return 'http://backend:8000/api/v1';
  }
  return process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';
}

export function getBackendOrigin(): string {
  return getBaseUrl().replace(/\/api\/v1\/?$/, '');
}
