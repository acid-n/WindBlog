import React from 'react';
import { render } from '@testing-library/react';
import PostRating from './index';

test('рисует пять звёзд', () => {
  const { container } = render(<PostRating value={3.5} />);
  expect(container.querySelectorAll('svg').length).toBe(5);
});
