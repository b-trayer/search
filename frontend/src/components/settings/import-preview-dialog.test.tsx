import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImportPreviewDialog } from './import-preview-dialog';

const payload = {
  version: 1 as const,
  exported_at: '2026-01-01T10:00:00.000Z',
  weights: {
    w_user: 1, alpha_type: 0.5, alpha_topic: 0.5,
    beta_ctr: 0.5, ctr_alpha_prior: 1, ctr_beta_prior: 10,
  },
  role_type_matrix: {
    bachelor: { textbook: 0.5, article: 0.5 },
    master: { textbook: 0.3, article: 0.7 },
  },
  topic_scores: { direct_match: 1, keyword_match: 0.8 },
  specialization_topics: { Физика: ['физик'], Математика: ['алгебр'] },
};

describe('ImportPreviewDialog', () => {
  it('does not render when closed', () => {
    render(<ImportPreviewDialog open={false} payload={null} onCancel={vi.fn()} onApply={vi.fn()} />);
    expect(screen.queryByText(/Импорт настроек/)).not.toBeInTheDocument();
  });

  it('shows counts for each section', () => {
    render(<ImportPreviewDialog open payload={payload} onCancel={vi.fn()} onApply={vi.fn()} />);
    expect(screen.getByText(/6 параметров/)).toBeInTheDocument();
    expect(screen.getByText(/4 ячеек/)).toBeInTheDocument();
    expect(screen.getByText(/2 скоров/)).toBeInTheDocument();
    expect(screen.getByText(/2 специализаций/)).toBeInTheDocument();
  });

  it('applies all sections by default', () => {
    const onApply = vi.fn();
    render(<ImportPreviewDialog open payload={payload} onCancel={vi.fn()} onApply={onApply} />);
    fireEvent.click(screen.getByRole('button', { name: /применить/i }));
    expect(onApply).toHaveBeenCalledWith({
      weights: true,
      matrix: true,
      topics: true,
      specializations: true,
    });
  });

  it('respects toggled sections', () => {
    const onApply = vi.fn();
    render(<ImportPreviewDialog open payload={payload} onCancel={vi.fn()} onApply={onApply} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[2]);
    fireEvent.click(screen.getByRole('button', { name: /применить/i }));
    expect(onApply).toHaveBeenCalledWith({
      weights: false,
      matrix: true,
      topics: false,
      specializations: true,
    });
  });

  it('disables apply when nothing selected', () => {
    render(<ImportPreviewDialog open payload={payload} onCancel={vi.fn()} onApply={vi.fn()} />);
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((cb) => fireEvent.click(cb));
    expect(screen.getByRole('button', { name: /применить/i })).toBeDisabled();
  });

  it('calls onCancel', () => {
    const onCancel = vi.fn();
    render(<ImportPreviewDialog open payload={payload} onCancel={onCancel} onApply={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /отмена/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
