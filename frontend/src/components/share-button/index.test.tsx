import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ShareButton from './index';

test('открывает меню поделиться', () => {
  render(<ShareButton title="t" url="https://example.com" />);
  fireEvent.click(screen.getByLabelText('Поделиться'));
  expect(screen.getByText('Копировать ссылку')).toBeInTheDocument();
});
