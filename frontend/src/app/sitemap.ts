import { MetadataRoute } from 'next';
import { fetchPosts, fetchActiveTags, PaginatedPostsResponse, PaginatedTagsResponse } from '@/services/api'; // Предполагаем, что эти функции существуют и могут получать все данные

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemapEntries: MetadataRoute.Sitemap = [];

  // 1. Статические страницы
  const staticPages = [
    { url: '/', changeFrequency: 'daily', priority: 1.0 },
    { url: '/about', changeFrequency: 'monthly', priority: 0.7 },
    { url: '/contact', changeFrequency: 'monthly', priority: 0.5 },
    { url: '/archive', changeFrequency: 'daily', priority: 0.7 },
    { url: '/tags', changeFrequency: 'daily', priority: 0.7 },
  ];

  staticPages.forEach(page => {
    sitemapEntries.push({
      url: `${BASE_URL}${page.url}`,
      lastModified: new Date(), // Можно указать конкретную дату обновления, если есть
      changeFrequency: page.changeFrequency as MetadataRoute.Sitemap[0]['changeFrequency'],
      priority: page.priority,
    });
  });

  // 2. Посты
  try {
    // Используем существующую функцию fetchPosts, предполагая, что она может вернуть все посты для sitemap
    // Необходимо убедиться, что API и функция fetchPosts поддерживают возврат всех постов без пагинации
    // и включают поля sitemap_priority и sitemap_changefreq.
    // Передаем параметр для получения данных sitemap (если API его поддерживает)
    const postsResponse: PaginatedPostsResponse = await fetchPosts(1, true); // page=1, forSitemap=true

    postsResponse.results.forEach(post => {
      // Используем данные из поста, если они есть, иначе - значения по умолчанию
      const priority = post.sitemap_priority ?? 0.8;
      const changeFrequency = post.sitemap_changefreq ?? 'weekly';
      
      sitemapEntries.push({
        url: `${BASE_URL}/posts/${post.slug}`,
        lastModified: new Date(post.updated_at || post.first_published_at),
        changeFrequency: changeFrequency as MetadataRoute.Sitemap[0]['changeFrequency'],
        priority: priority,
      });
    });
  } catch (error) {
    console.error("Failed to fetch posts for sitemap:", error);
  }

  // 3. Теги
  try {
    // Предполагаем, что fetchActiveTags может вернуть все теги
    const tagsResponse: PaginatedTagsResponse = await fetchActiveTags(1, 1000); // page=1, limit=1000 (или без лимита)
    tagsResponse.results.forEach(tag => {
      sitemapEntries.push({
        url: `${BASE_URL}/tags/${tag.slug}`,
        lastModified: new Date(), // Теги могут не иметь lastModified
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    });
  } catch (error) {
    console.error("Failed to fetch tags for sitemap:", error);
  }

  return sitemapEntries;
} 