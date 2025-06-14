import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from './index';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({ user: null, isLoading: false, logout: jest.fn() })),
}));

describe('Header Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    (usePathname as jest.Mock).mockReturnValue('/');
    // Mock fetch for site settings
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ site_title: 'Test Blog', site_description: 'Test Description' }),
      }) as any
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
    expect(tagsLink).toHaveAttribute('aria-current', 'page');
  });

  // Add more tests for search functionality, etc.
}); 

