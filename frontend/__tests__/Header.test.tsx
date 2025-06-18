import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from '@/components/header';
import { usePathname } from 'next/navigation';
// Мокаем контекст авторизации, чтобы не требовался AuthProvider
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, isLoading: false, logout: jest.fn() }),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

describe('Header Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    (usePathname as jest.Mock).mockReturnValue('/');
    // Mock fetch for site settings
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () =>
          Promise.resolve({
            title: 'Test Blog',
            tagline: 'Test Description',
          }),
      }) as unknown as Promise<Response>
    );
  });

  it('should render the site title from API', async () => {
    render(<Header />);
    // Wait for the fetch to resolve and state to update
    expect(await screen.findByText('Test Blog')).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    render(<Header />);
    expect(screen.getByText('Главная')).toBeInTheDocument();
    expect(screen.getByText('Теги')).toBeInTheDocument();
    expect(screen.getByText('Архив')).toBeInTheDocument();
    // Add more checks for other links if necessary
  });

  it('should highlight the active link', () => {
    (usePathname as jest.Mock).mockReturnValue('/tags');
    render(<Header />);
    const tagsLink = screen.getByText('Теги');
    const tagsLi = tagsLink.closest('li');
    expect(tagsLi).toHaveClass('current-menu-item');
    expect(tagsLink).toHaveAttribute('aria-current', 'page');
  });

  // Add more tests for search functionality, etc.
}); 
