import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from './index';
import { usePathname } from 'next/navigation';
// Mock useAuth from AuthContext
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
        json: () => Promise.resolve({ site_title: 'Test Blog', site_description: 'Test Description' }),
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
    const tagsItem = screen.getByRole('link', { name: 'Теги' }).closest('li');
    expect(tagsItem).toHaveClass('current-menu-item');
    expect(tagsItem?.querySelector('a')).toHaveAttribute('aria-current', 'page');
  });

  // Add more tests for search functionality, etc.
}); 