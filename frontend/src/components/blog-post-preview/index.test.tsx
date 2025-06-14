import React from 'react';
import { render, screen } from '@testing-library/react';
import BlogPostPreview from './index';
import type { Post } from '@/types/blog';

const post: Post = {
  id: 1,
  title: 'Test Post',
  slug: 'test-post',
  content: '',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  first_published_at: '2024-01-01',
  tags: [],
  tags_details: [],
};

test('отображает заголовок поста', () => {
  render(<BlogPostPreview post={post} />);
  expect(screen.getByText('Test Post')).toBeInTheDocument();
});
