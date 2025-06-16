export function getBaseUrl(): string {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? process.env.NEXT_PUBLIC_API_BASE
    : process.env.DJANGO_API_URL_SSR || process.env.NEXT_PUBLIC_API_BASE;

  if (process.env.NODE_ENV === "development") {
    console.info("[getBaseUrl]", { isBrowser, url });
  }
  return url ?? "";
}

export function getBackendOrigin(): string {
  return getBaseUrl().replace(/\/api\/v1\/?$/, "");
}
