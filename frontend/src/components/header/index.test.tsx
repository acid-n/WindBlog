import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from './index';
import { usePathname } from 'next/navigation';

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
        json: () => Promise.resolve({ site_title: 'Test Blog', site_description: 'Test Description' }),
      }) as Promise<Response>
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
    expect(tagsLink).toHaveClass('text-[#CE6607]'); // Example class for active link
    expect(tagsLink).toHaveAttribute('aria-current', 'page');
  });

  // Add more tests for search functionality, etc.
}); 