import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from './index';

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ site_title: 'Site' }),
    }) as any,
  );
});

test('отображает заголовок сайта', async () => {
  render(<Footer />);
  expect(await screen.findByText(/Site/)).toBeInTheDocument();
});
