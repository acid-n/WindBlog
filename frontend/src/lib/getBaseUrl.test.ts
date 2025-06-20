import { getBaseUrl } from "./getBaseUrl";

describe("getBaseUrl", () => {
  afterEach(() => {
    delete process.env.DJANGO_API_URL_SSR;
    delete process.env.NEXT_PUBLIC_API_BASE;
    // @ts-expect-error window is mocked
    delete global.window;
  });

  it("возвращает URL для браузера", () => {
    // @ts-expect-error window существует
    global.window = {};
    process.env.NEXT_PUBLIC_API_BASE = "http://client.com/api/v1";
    expect(getBaseUrl()).toBe("http://client.com/api/v1");
  });

  it("возвращает URL для SSR", () => {
    // @ts-expect-error window отсутствует
    delete global.window;
    process.env.DJANGO_API_URL_SSR = "http://example.com/api/v1";
    expect(getBaseUrl()).toBe("http://example.com/api/v1");
  });

  it("использует NEXT_PUBLIC_API_BASE при отсутствии SSR-переменной", () => {
    // @ts-expect-error window отсутствует
    delete global.window;
    delete process.env.DJANGO_API_URL_SSR;
    process.env.NEXT_PUBLIC_API_BASE = "http://fallback.com/api/v1";
    expect(getBaseUrl()).toBe("http://fallback.com/api/v1");
  });

  it("возвращает window.location.origin при отсутствии переменной", () => {
    // @ts-expect-error эмуляция window
    global.window = { location: { origin: "http://host:3000" } };
    expect(getBaseUrl()).toBe("http://host:3000/api/v1");
  });

  it("возвращает '/api/v1' без переменных при SSR", () => {
    // @ts-expect-error window отсутствует
    delete global.window;
    expect(getBaseUrl()).toBe("/api/v1");
  });
});
