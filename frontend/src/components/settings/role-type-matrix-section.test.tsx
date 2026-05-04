import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoleTypeMatrixSection } from './role-type-matrix-section';

const matrix = {
  bachelor: { textbook: 0.5, tutorial: 0.25, monograph: 0.1, dissertation: 0.05, article: 0.1 },
  master: { textbook: 0.3, tutorial: 0.2, monograph: 0.2, dissertation: 0.1, article: 0.1 },
};

describe('RoleTypeMatrixSection', () => {
  it('renders a row sum column with totals', () => {
    render(
      <RoleTypeMatrixSection matrix={matrix} isSaving={false} onMatrixChange={vi.fn()} />,
    );
    expect(screen.getByText('1.00')).toBeInTheDocument();
    expect(screen.getByText('0.90')).toBeInTheDocument();
  });

  it('renders the sum header column', () => {
    render(
      <RoleTypeMatrixSection matrix={matrix} isSaving={false} onMatrixChange={vi.fn()} />,
    );
    expect(screen.getByRole('columnheader', { name: '∑' })).toBeInTheDocument();
  });
});
