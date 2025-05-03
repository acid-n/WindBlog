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
 * Тип данных для поста блога.
 */
export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  created_at: string;
  updated_at: string;
  first_published_at: string;
  tags: Tag[];
  image?: string;
  short_description?: string;
  average_rating?: number;
}
