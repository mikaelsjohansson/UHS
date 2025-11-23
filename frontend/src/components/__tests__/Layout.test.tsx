import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../Layout';
import { ThemeProvider } from '../../context/ThemeContext';

// Create a mock localStorage
function createMockLocalStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
}

describe('Layout', () => {
  let originalMatchMedia: typeof window.matchMedia;
  let mockMatchMedia: ReturnType<typeof vi.fn>;
  let mockLocalStorage: ReturnType<typeof createMockLocalStorage>;

  beforeEach(() => {
    // Create and setup mock localStorage
    mockLocalStorage = createMockLocalStorage();
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });

    // Store original matchMedia
    originalMatchMedia = window.matchMedia;

    // Mock matchMedia for system preference detection
    mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    window.matchMedia = mockMatchMedia as unknown as typeof window.matchMedia;

    // Reset document.documentElement.dataset.theme
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    // Restore original matchMedia
    window.matchMedia = originalMatchMedia;
    // Clean up
    document.documentElement.removeAttribute('data-theme');
  });

  const renderLayout = () => {
    return render(
      <BrowserRouter>
        <ThemeProvider>
          <Layout />
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  it('renders app title as a link to home', () => {
    renderLayout();
    const titleLink = screen.getByRole('link', { name: /UHS - Personal Expense Tracker/i });
    expect(titleLink).toBeInTheDocument();
    expect(titleLink).toHaveAttribute('href', '/');
  });

  it('does not render Home navigation link', () => {
    renderLayout();
    const homeLink = screen.queryByRole('link', { name: /^Home$/i });
    expect(homeLink).not.toBeInTheDocument();
  });

  it('does not render header navigation section', () => {
    renderLayout();
    const nav = screen.queryByRole('navigation');
    expect(nav).not.toBeInTheDocument();
  });

  describe('Dark Mode Toggle', () => {
    it('renders a theme toggle button', () => {
      renderLayout();
      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      expect(toggleButton).toBeInTheDocument();
    });

    it('shows moon icon when in light mode', () => {
      mockLocalStorage.setItem('theme', 'light');
      renderLayout();

      // The moon icon should be visible in light mode (to switch to dark)
      const moonIcon = screen.getByTestId('theme-icon-moon');
      expect(moonIcon).toBeInTheDocument();
    });

    it('shows sun icon when in dark mode', () => {
      mockLocalStorage.setItem('theme', 'dark');
      renderLayout();

      // The sun icon should be visible in dark mode (to switch to light)
      const sunIcon = screen.getByTestId('theme-icon-sun');
      expect(sunIcon).toBeInTheDocument();
    });

    it('toggles theme from light to dark when button is clicked', async () => {
      const user = userEvent.setup();
      mockLocalStorage.setItem('theme', 'light');
      renderLayout();

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');

      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      });
    });

    it('toggles theme from dark to light when button is clicked', async () => {
      const user = userEvent.setup();
      mockLocalStorage.setItem('theme', 'dark');
      renderLayout();

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      });
    });

    it('toggle button is accessible with proper aria-label', () => {
      renderLayout();
      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      expect(toggleButton).toHaveAttribute('aria-label');
    });
  });
});
