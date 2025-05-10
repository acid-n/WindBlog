import type { Post } from './blog';

export interface PaginatedPostsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Post[];
}
