/**
 * Типы для API сервисов блога
 */

// Общий формат ошибки API
export interface ApiErrorFormat {
  message: string;
  details?: Record<string, string[]>;
  status?: number;
}

// Настройки сайта
export interface SiteSettingsData {
  site_title: string;
  site_description: string;
  favicon?: string;
  logo?: string;
  footer_text?: string;
  social_links?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    github?: string;
  };
  meta_keywords?: string;
  meta_description?: string;
}

// Структура поста
export interface PostData {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
  };
  featured_image?: string;
  created_at: string;
  updated_at: string;
  tags: TagData[];
  comments_count: number;
  is_published: boolean;
}

// Структура тега
export interface TagData {
  id: number;
  name: string;
  slug: string;
  post_count?: number;
}

// Структура пагинации
export interface PaginationData {
  count: number;
  next: string | null;
  previous: string | null;
  results: PostData[];
}

// Данные пользователя
export interface UserData {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  is_staff?: boolean;
}
