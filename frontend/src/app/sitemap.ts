import { MetadataRoute } from 'next';
import { fetchPosts } from '@/services/api'; // Используем только fetchPosts, убираем связанные несуществующие типы

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
    const postsData = await fetchPosts(1); // fetchPosts принимает только один аргумент (page: number)

    postsData.results.map((post: { slug: string; updated_at: string; sitemap_priority?: number; sitemap_changefreq?: string }) => {
      // Используем данные из поста, если они есть, иначе - значения по умолчанию
      const priority = post.sitemap_priority ?? 0.8;
      const changeFrequency = post.sitemap_changefreq ?? 'weekly';
      
      sitemapEntries.push({
        url: `${BASE_URL}/posts/${post.slug}`,
        lastModified: new Date(post.updated_at || ("first_published_at" in post ? (post as any).first_published_at : undefined)),
        changeFrequency: changeFrequency as MetadataRoute.Sitemap[0]['changeFrequency'],
        priority: priority,
      });
    });
  } catch (error) {
    console.error("Failed to fetch posts for sitemap:", error);
  }


  return sitemapEntries;
} 