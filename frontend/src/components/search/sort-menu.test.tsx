import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SortMenu } from './sort-menu';

describe('SortMenu', () => {
  it('shows the current option in the trigger', () => {
    render(<SortMenu value="year_desc" onChange={vi.fn()} />);
    const trigger = screen.getByRole('button');
    expect(trigger).toHaveTextContent('Год: сначала новые');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the menu on click and lists every option', async () => {
    const user = userEvent.setup();
    render(<SortMenu value="relevance" onChange={vi.fn()} />);

    await user.click(screen.getByRole('button'));
    expect(screen.getAllByRole('option')).toHaveLength(5);
    expect(screen.getByRole('option', { name: /Год: сначала новые/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /По названию/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /По популярности/ })).toBeInTheDocument();
  });

  it('marks the current option as selected', async () => {
    const user = userEvent.setup();
    render(<SortMenu value="title_asc" onChange={vi.fn()} />);

    await user.click(screen.getByRole('button'));
    const opt = screen.getByRole('option', { name: /По названию/ });
    expect(opt).toHaveAttribute('aria-selected', 'true');
  });

  it('emits onChange and closes menu when an option is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SortMenu value="relevance" onChange={onChange} />);

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByRole('option', { name: /Год: сначала новые/ }));

    expect(onChange).toHaveBeenCalledWith('year_desc');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });
});
