import { getBaseUrl } from './apiBase';

describe('getBaseUrl', () => {
  afterEach(() => {
    delete process.env.DJANGO_API_URL_SSR;
    delete process.env.NEXT_PUBLIC_API_BASE;
    // @ts-ignore
    delete global.window;
  });

  it('returns SSR base URL when window is undefined', () => {
    // @ts-ignore
    delete global.window;
    process.env.DJANGO_API_URL_SSR = 'http://example.com/api/v1';
    expect(getBaseUrl()).toBe('http://example.com/api/v1');
  });

  it('returns browser base URL when window exists', () => {
    // @ts-ignore
    global.window = {};
    process.env.NEXT_PUBLIC_API_BASE = 'http://client.com/api/v1';
    expect(getBaseUrl()).toBe('http://client.com/api/v1');
  });
});

