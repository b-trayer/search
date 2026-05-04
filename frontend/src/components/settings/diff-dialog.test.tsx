import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiffDialog } from './diff-dialog';
import type { DiffEntry } from '@/hooks/settings/changes';

const entries: DiffEntry[] = [
  { group: 'weights', label: 'w_user', before: '1.50', after: '2.00' },
  { group: 'weights', label: 'beta_ctr', before: '0.50', after: '1.00' },
  { group: 'matrix', label: 'bachelor → textbook', before: '0.50', after: '0.60' },
  { group: 'topics', label: 'direct_match', before: '1.00', after: '0.90' },
];

describe('DiffDialog', () => {
  it('renders empty state when no entries', () => {
    render(<DiffDialog open onOpenChange={() => {}} entries={[]} />);
    expect(screen.getByText(/Нет несохраненных изменений/)).toBeInTheDocument();
  });

  it('groups entries by category', () => {
    render(<DiffDialog open onOpenChange={() => {}} entries={entries} />);
    expect(screen.getByText(/Веса · 2/)).toBeInTheDocument();
    expect(screen.getByText(/Матрица f_type · 1/)).toBeInTheDocument();
    expect(screen.getByText(/Скоры f_topic · 1/)).toBeInTheDocument();
  });

  it('shows before → after pairs', () => {
    render(<DiffDialog open onOpenChange={() => {}} entries={entries} />);
    expect(screen.getByText('w_user')).toBeInTheDocument();
    expect(screen.getAllByText('1.50').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2.00').length).toBeGreaterThan(0);
  });

  it('calls onSave and closes', () => {
    const onOpenChange = vi.fn();
    const onSave = vi.fn();
    render(
      <DiffDialog
        open
        onOpenChange={onOpenChange}
        entries={entries}
        onSave={onSave}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /применить и сохранить/i }));
    expect(onSave).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('hides save button when no entries', () => {
    render(<DiffDialog open onOpenChange={() => {}} entries={[]} onSave={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /применить и сохранить/i })).not.toBeInTheDocument();
  });
});
