import { fetchJson } from './getBaseUrl';

describe('fetchJson', () => {
  afterEach(() => {
    delete process.env.DJANGO_API_URL_SSR;
    // @ts-expect-error – remove mocked fetch
    delete global.fetch;
    // @ts-expect-error – remove window for SSR
    delete global.window;
  });

  it('конвертирует относительный путь в абсолютный', async () => {
    process.env.DJANGO_API_URL_SSR = 'http://example.com/api/v1';
    // @ts-expect-error – remove window for SSR
    delete global.window;
    const mockResponse = { ok: true, json: jest.fn().mockResolvedValue({ data: true }) } as any;
    const fetchSpy = jest.fn().mockResolvedValue(mockResponse);
    // @ts-expect-error – mock fetch
    global.fetch = fetchSpy;
    await fetchJson('/foo');
    expect(fetchSpy).toHaveBeenCalledWith('http://example.com/foo', undefined);
  });

  it('не изменяет абсолютный URL', async () => {
    process.env.DJANGO_API_URL_SSR = 'http://example.com/api/v1';
    // @ts-expect-error – remove window for SSR
    delete global.window;
    const mockResponse = { ok: true, json: jest.fn().mockResolvedValue({}) } as any;
    const fetchSpy = jest.fn().mockResolvedValue(mockResponse);
    // @ts-expect-error – mock fetch
    global.fetch = fetchSpy;
    await fetchJson('http://test.com/bar');
    expect(fetchSpy).toHaveBeenCalledWith('http://test.com/bar', undefined);
  });
});
