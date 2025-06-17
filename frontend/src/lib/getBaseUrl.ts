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

export async function fetchJson(
  input: string,
  init?: RequestInit,
): Promise<any> {
  const origin = getBackendOrigin();
  const url = input.startsWith("/")
    ? `${origin.replace(/\/$/, "")}${input}`
    : input;
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return res.json();
}
