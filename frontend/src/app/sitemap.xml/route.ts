import { MetadataRoute } from 'next';
import { fetchJson } from '@/lib/getBaseUrl';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function GET(): Promise<MetadataRoute.Sitemap> {
  const sitemap: MetadataRoute.Sitemap = [];

  const staticPages = [
    { url: '/', changeFrequency: 'daily', priority: 1.0 },
    { url: '/about', changeFrequency: 'monthly', priority: 0.7 },
    { url: '/archive', changeFrequency: 'daily', priority: 0.7 },
    { url: '/tags', changeFrequency: 'daily', priority: 0.7 },
  ];

  staticPages.forEach((page) => {
    sitemap.push({
      url: `${BASE_URL}${page.url}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency as MetadataRoute.Sitemap[0]['changeFrequency'],
      priority: page.priority,
    });
  });

  try {
    const postsData = await fetchJson('/api/v1/posts/?page=1');
    postsData.results.forEach((post: { slug: string; updated_at: string; sitemap_priority?: number; sitemap_changefreq?: string; first_published_at?: string }) => {
      sitemap.push({
        url: `${BASE_URL}/posts/${post.slug}`,
        lastModified: new Date(post.updated_at || post.first_published_at || new Date()),
        changeFrequency: (post.sitemap_changefreq || 'weekly') as MetadataRoute.Sitemap[0]['changeFrequency'],
        priority: post.sitemap_priority ?? 0.8,
      });
    });
  } catch (e) {
    console.error('Failed to fetch posts for sitemap:', e);
  }

  return sitemap;
}
