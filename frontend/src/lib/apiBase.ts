export function getBaseUrl(): string {
  if (typeof window === "undefined") {
    return process.env.DJANGO_API_URL_SSR || "http://backend:8000/api/v1";
  }
  return process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api/v1";
}

export function getBackendOrigin(): string {
  return getBaseUrl().replace(/\/api\/v1\/?$/, "");
}
