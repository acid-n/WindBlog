import React from 'react';
import { render, screen } from '@testing-library/react';
import PostCard from './index';
import type { Post } from '@/types/blog';

const post: Post = {
  id: 1,
  title: 'Card Post',
  slug: 'card-post',
  content: '',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  first_published_at: '2024-01-01',
  tags: [],
  tags_details: [],
};

test('рендерит заголовок', () => {
  render(<PostCard post={post} />);
  expect(screen.getByText('Card Post')).toBeInTheDocument();
});
