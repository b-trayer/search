import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopicScoresSection } from './topic-scores-section';

describe('TopicScoresSection', () => {
  it('renders only direct_match and keyword_match sliders', () => {
    const { container } = render(
      <TopicScoresSection
        scores={{ direct_match: 1, keyword_match: 0.8 }}
        isSaving={false}
        onScoreChange={vi.fn()}
      />,
    );
    const labels = Array.from(container.querySelectorAll('label')).map((el) => el.textContent);
    expect(labels).toContain('Прямое совпадение специализации');
    expect(labels).toContain('Совпадение ключевых слов');
    expect(labels).not.toContain('Совпадение интересов');
  });

  it('does not show monotonicity warning when direct >= keyword', () => {
    render(
      <TopicScoresSection
        scores={{ direct_match: 1, keyword_match: 0.8 }}
        isSaving={false}
        onScoreChange={vi.fn()}
      />,
    );
    expect(screen.queryByText(/нарушена монотонность/i)).not.toBeInTheDocument();
  });

  it('shows monotonicity warning when keyword > direct', () => {
    render(
      <TopicScoresSection
        scores={{ direct_match: 0.5, keyword_match: 0.9 }}
        isSaving={false}
        onScoreChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/нарушена монотонность/i)).toBeInTheDocument();
  });
});
