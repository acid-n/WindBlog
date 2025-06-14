import React from 'react';
import { render, screen } from '@testing-library/react';
import ImageUploader from './index';

jest.mock('@/services/apiClient', () => ({ fetchWithAuth: jest.fn() }));

test('отображает заголовок загрузки', () => {
  render(<ImageUploader onUploadComplete={jest.fn()} />);
  expect(screen.getByText('Загрузить изображение')).toBeInTheDocument();
});
