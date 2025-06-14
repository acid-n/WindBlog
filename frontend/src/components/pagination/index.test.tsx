import React from 'react';
import { render, screen } from '@testing-library/react';
import Pagination from './index';

test('отображает ссылки пагинации', () => {
  render(<Pagination currentPage={2} totalPages={3} baseUrl="/posts" />);
  expect(screen.getByText('Назад')).toBeInTheDocument();
  expect(screen.getByText('Вперёд')).toBeInTheDocument();
});
