import { getBaseUrl } from "./apiBase";

describe("getBaseUrl", () => {
  afterEach(() => {
    delete process.env.DJANGO_API_URL_SSR;
    delete process.env.NEXT_PUBLIC_API_BASE;
    // @ts-expect-error window is mocked
    delete global.window;
  });

  it("returns SSR base URL when window is undefined", () => {
    // @ts-expect-error window is undefined in SSR
    delete global.window;
    process.env.DJANGO_API_URL_SSR = "http://example.com/api/v1";
    expect(getBaseUrl()).toBe("http://example.com/api/v1");
  });

  it("returns browser base URL when window exists", () => {
    // @ts-expect-error window is defined in browser context
    global.window = {};
    process.env.NEXT_PUBLIC_API_BASE = "http://client.com/api/v1";
    expect(getBaseUrl()).toBe("http://client.com/api/v1");
  });

  it("falls back to localhost for SSR when env is undefined", () => {
    // @ts-expect-error window is undefined in SSR
    delete global.window;
    delete process.env.DJANGO_API_URL_SSR;
    expect(getBaseUrl()).toBe("http://localhost:8000/api/v1");
  });

  it("falls back to localhost in browser when env is undefined", () => {
    // @ts-expect-error window is defined in browser context
    global.window = {};
    delete process.env.NEXT_PUBLIC_API_BASE;
    expect(getBaseUrl()).toBe("http://localhost:8000/api/v1");
  });
});
