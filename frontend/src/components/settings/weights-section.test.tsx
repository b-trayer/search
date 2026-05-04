import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeightsSection } from './weights-section';

const baseWeights = {
  w_user: 1.5,
  alpha_type: 0.4,
  alpha_topic: 0.6,
  beta_ctr: 0.5,
  ctr_alpha_prior: 1,
  ctr_beta_prior: 10,
};

describe('WeightsSection', () => {
  it('shows alpha sum indicator with correct total', () => {
    render(
      <WeightsSection
        weights={baseWeights}
        currentPreset="default"
        isSaving={false}
        onWeightChange={vi.fn()}
        onPresetApply={vi.fn()}
      />,
    );
    expect(screen.getByTestId('alpha-sum-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('alpha-sum-value')).toHaveTextContent('1.00');
    expect(screen.getByText(/корректно/)).toBeInTheDocument();
  });

  it('warns when alpha sum is not 1', () => {
    render(
      <WeightsSection
        weights={{ ...baseWeights, alpha_type: 0.7, alpha_topic: 0.7 }}
        currentPreset={null}
        isSaving={false}
        onWeightChange={vi.fn()}
        onPresetApply={vi.fn()}
      />,
    );
    expect(screen.getByText(/рекомендуется = 1/i)).toBeInTheDocument();
    expect(screen.getByTestId('alpha-sum-value')).toHaveTextContent('1.40');
  });
});
