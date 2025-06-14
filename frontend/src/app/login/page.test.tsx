import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from './page';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ login: jest.fn() }),
}));

test('отображает форму входа', () => {
  render(<LoginPage />);
  expect(screen.getByText('Вход в систему')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.c' } });
});

