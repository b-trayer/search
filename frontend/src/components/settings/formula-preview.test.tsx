import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormulaPreview } from './formula-preview';

describe('FormulaPreview', () => {
  it('renders the formula with substituted values', () => {
    render(
      <FormulaPreview
        weights={{
          w_user: 1.5,
          alpha_type: 0.4,
          alpha_topic: 0.6,
          beta_ctr: 0.5,
          ctr_alpha_prior: 1,
          ctr_beta_prior: 10,
        }}
      />,
    );
    expect(screen.getByText(/score/i)).toBeInTheDocument();
    expect(screen.getByText('1.5')).toBeInTheDocument();
    expect(screen.getByText('0.40')).toBeInTheDocument();
    expect(screen.getByText('0.60')).toBeInTheDocument();
    expect(screen.getByText('0.5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('updates when weights change', () => {
    const { rerender } = render(
      <FormulaPreview
        weights={{
          w_user: 1.0,
          alpha_type: 0.3,
          alpha_topic: 0.7,
          beta_ctr: 0.2,
          ctr_alpha_prior: 2,
          ctr_beta_prior: 20,
        }}
      />,
    );
    expect(screen.getByText('1.0')).toBeInTheDocument();
    rerender(
      <FormulaPreview
        weights={{
          w_user: 3.0,
          alpha_type: 0.5,
          alpha_topic: 0.5,
          beta_ctr: 1.0,
          ctr_alpha_prior: 2,
          ctr_beta_prior: 20,
        }}
      />,
    );
    expect(screen.getByText('3.0')).toBeInTheDocument();
    expect(screen.getAllByText('0.50').length).toBeGreaterThan(0);
  });
});
