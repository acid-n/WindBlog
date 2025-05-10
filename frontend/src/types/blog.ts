/**
 * Тип данных для тега поста.
 */
export interface Tag {
  id: number;
  name: string;
  slug: string;
  posts_count?: number;
}

/**
 * Тип данных для короткой ссылки.
 */
export interface ShortLink {
  code: string;
  url: string;
  full_url?: string;
}

/**
 * Тип данных для поста блога.
 */
export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  description?: string;
  body?: any;
  created_at: string;
  updated_at: string;
  first_published_at: string;
  tags?: number[];
  tags_details?: Tag[];
  image?: string;
  short_description?: string;
  average_rating?: number;
  author?: string;
  comments_count?: number;
  shortlink?: ShortLink;
}
