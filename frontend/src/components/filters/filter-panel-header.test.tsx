import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterPanelHeader } from './filter-panel-header';

describe('FilterPanelHeader', () => {
  it('renders the title', () => {
    render(<FilterPanelHeader totalSelected={0} onReset={vi.fn()} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Фильтры' })).toBeInTheDocument();
  });

  it('hides the reset button when nothing is selected', () => {
    render(<FilterPanelHeader totalSelected={0} onReset={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /сбросить/i })).not.toBeInTheDocument();
  });

  it('shows the count badge and reset button when filters are selected', () => {
    render(<FilterPanelHeader totalSelected={3} onReset={vi.fn()} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /сбросить/i })).toBeInTheDocument();
  });

  it('invokes onReset on click', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(<FilterPanelHeader totalSelected={2} onReset={onReset} />);

    await user.click(screen.getByRole('button', { name: /сбросить/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
