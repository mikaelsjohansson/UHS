import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../Layout';

describe('Layout', () => {
  const renderLayout = () => {
    return render(
      <BrowserRouter>
        <Layout />
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
});

