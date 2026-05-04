import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SectionResetButton } from './section-reset-button';

describe('SectionResetButton', () => {
  it('disables when no changes', () => {
    render(
      <SectionResetButton hasChanges={false} onConfirm={vi.fn()} sectionName="Веса" />,
    );
    expect(screen.getByRole('button', { name: /сбросить раздел/i })).toBeDisabled();
  });

  it('opens confirm dialog and calls onConfirm', async () => {
    const onConfirm = vi.fn();
    render(
      <SectionResetButton hasChanges onConfirm={onConfirm} sectionName="Веса" />,
    );
    fireEvent.click(screen.getByRole('button', { name: /сбросить раздел/i }));
    await waitFor(() => {
      expect(screen.getByText(/Сбросить раздел «Веса»\?/)).toBeInTheDocument();
    });
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /^сбросить$/i }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('cancels without calling onConfirm', async () => {
    const onConfirm = vi.fn();
    render(
      <SectionResetButton hasChanges onConfirm={onConfirm} sectionName="Веса" />,
    );
    fireEvent.click(screen.getByRole('button', { name: /сбросить раздел/i }));
    await waitFor(() => {
      expect(screen.getByText(/Сбросить раздел «Веса»\?/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /отмена/i }));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
