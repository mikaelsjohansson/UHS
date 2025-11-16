import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Welcome from '../Welcome';

describe('Welcome', () => {
  const renderWelcome = () => {
    return render(
      <BrowserRouter>
        <Welcome />
      </BrowserRouter>
    );
  };

  it('renders welcome heading', () => {
    renderWelcome();
    expect(screen.getByText('Welcome to UHS')).toBeInTheDocument();
  });

  it('renders all three feature cards', () => {
    renderWelcome();
    expect(screen.getByText('Track Expenses')).toBeInTheDocument();
    expect(screen.getByText('Manage Categories')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('renders icons for each feature card', () => {
    renderWelcome();
    
    // Check that icons are rendered (they should have aria-hidden="true" or be SVG elements)
    const featureCards = screen.getAllByRole('link');
    expect(featureCards).toHaveLength(3);
    
    // Each card should contain an SVG icon element
    const svgIcons = document.querySelectorAll('svg');
    expect(svgIcons.length).toBeGreaterThanOrEqual(3);
  });

  it('renders correct icon for Track Expenses card', () => {
    renderWelcome();
    const expensesCard = screen.getByText('Track Expenses').closest('a');
    expect(expensesCard).toBeInTheDocument();
    // Icon should be present in the card
    const iconInCard = expensesCard?.querySelector('svg');
    expect(iconInCard).toBeInTheDocument();
  });

  it('renders correct icon for Manage Categories card', () => {
    renderWelcome();
    const categoriesCard = screen.getByText('Manage Categories').closest('a');
    expect(categoriesCard).toBeInTheDocument();
    // Icon should be present in the card
    const iconInCard = categoriesCard?.querySelector('svg');
    expect(iconInCard).toBeInTheDocument();
  });

  it('renders correct icon for Analytics card', () => {
    renderWelcome();
    const analyticsCard = screen.getByText('Analytics').closest('a');
    expect(analyticsCard).toBeInTheDocument();
    // Icon should be present in the card
    const iconInCard = analyticsCard?.querySelector('svg');
    expect(iconInCard).toBeInTheDocument();
  });
});

