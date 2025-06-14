import React from 'react';
import { render, screen } from '@testing-library/react';
import EditPostLink from './index';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1 }, isLoading: false }),
}));

test('показывает ссылку редактирования', () => {
  render(<EditPostLink slug="test" />);
  expect(screen.getByRole('link')).toHaveAttribute('href', '/admin/edit-post/test');
});
