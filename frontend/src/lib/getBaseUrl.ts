let logged = false;

export function getBaseUrl(): string {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? process.env.NEXT_PUBLIC_API_BASE ||
      `${window.location.origin.replace(/\/$/, "")}/api/v1`
    : process.env.DJANGO_API_URL_SSR ||
      process.env.NEXT_PUBLIC_API_BASE ||
      "/api/v1";

  if (!logged && process.env.NODE_ENV !== "production") {
    console.info("[getBaseUrl]", { isBrowser, url });
    logged = true;
  }

  return url;
}

export function getBackendOrigin(): string {
  return getBaseUrl().replace(/\/api\/v1\/?$/, "");
}

export async function fetchJson(
  input: string,
  init?: RequestInit,
): Promise<any> {
  let url = input;
  if (input.startsWith("/")) {
    const origin = getBackendOrigin();
    url = `${origin.replace(/\/$/, "")}${input}`;
  }
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return res.json();
}
