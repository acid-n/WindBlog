import { fetchPosts, fetchSiteSettings } from './api';

beforeEach(() => {
  global.fetch = jest.fn();
});

test('fetchPosts вызывает правильный URL', async () => {
  (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({ results: [], count: 0 }) });
  await fetchPosts(2);
  expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/posts/?page=2'), expect.any(Object));
});

test('fetchSiteSettings возвращает данные', async () => {
  (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({ site_title: 't', site_description: 'd' }) });
  const data = await fetchSiteSettings();
  expect(data.site_title).toBe('t');
});

