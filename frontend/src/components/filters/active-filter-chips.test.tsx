import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActiveFilterChips } from './active-filter-chips';
import { EMPTY_FILTERS, type Filters } from '@/hooks/use-filters';

function makeFilters(overrides: Partial<Filters> = {}): Filters {
  return { ...EMPTY_FILTERS, ...overrides };
}

describe('ActiveFilterChips', () => {
  it('renders nothing when there are no active filters', () => {
    const { container } = render(
      <ActiveFilterChips filters={makeFilters()} onFiltersChange={vi.fn()} onReset={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a chip for the year range', () => {
    render(
      <ActiveFilterChips
        filters={makeFilters({ year_from: 2020, year_to: 2024 })}
        onFiltersChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByText('2020\u20132024')).toBeInTheDocument();
  });

  it('renders “С YYYY” when only year_from is set', () => {
    render(
      <ActiveFilterChips
        filters={makeFilters({ year_from: 2020 })}
        onFiltersChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByText('С 2020')).toBeInTheDocument();
  });

  it('renders “До YYYY” when only year_to is set', () => {
    render(
      <ActiveFilterChips
        filters={makeFilters({ year_to: 2010 })}
        onFiltersChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByText('До 2010')).toBeInTheDocument();
  });

  it('translates database codes to Russian labels', () => {
    render(
      <ActiveFilterChips
        filters={makeFilters({ databases: ['BOOKS'] })}
        onFiltersChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByText('Книги')).toBeInTheDocument();
  });

  it('renders the “Доступно онлайн” chip for has_pdf=true', () => {
    render(
      <ActiveFilterChips
        filters={makeFilters({ has_pdf: true })}
        onFiltersChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByText('Доступно онлайн')).toBeInTheDocument();
  });

  it('removes only the clicked database when chip is clicked', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    render(
      <ActiveFilterChips
        filters={makeFilters({ databases: ['BOOKS', 'SERIAL'] })}
        onFiltersChange={onFiltersChange}
        onReset={vi.fn()}
      />,
    );

    await user.click(screen.getByText('Книги').closest('button')!);

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ databases: ['SERIAL'] }),
    );
  });

  it('clears year via chip click', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    render(
      <ActiveFilterChips
        filters={makeFilters({ year_from: 2020, year_to: 2024 })}
        onFiltersChange={onFiltersChange}
        onReset={vi.fn()}
      />,
    );

    await user.click(screen.getByText('2020\u20132024').closest('button')!);

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ year_from: null, year_to: null }),
    );
  });

  it('shows “Очистить все” when there are 2 or more chips', () => {
    render(
      <ActiveFilterChips
        filters={makeFilters({ databases: ['BOOKS'], has_pdf: true })}
        onFiltersChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByText('Очистить все')).toBeInTheDocument();
  });

  it('does not show “Очистить все” for a single chip', () => {
    render(
      <ActiveFilterChips
        filters={makeFilters({ has_pdf: true })}
        onFiltersChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.queryByText('Очистить все')).not.toBeInTheDocument();
  });

  it('calls onReset when “Очистить все” is clicked', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(
      <ActiveFilterChips
        filters={makeFilters({ databases: ['BOOKS'], has_pdf: true })}
        onFiltersChange={vi.fn()}
        onReset={onReset}
      />,
    );

    await user.click(screen.getByText('Очистить все'));
    expect(onReset).toHaveBeenCalled();
  });
});
