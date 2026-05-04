import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { getFilterOptionsMock } = vi.hoisted(() => ({
  getFilterOptionsMock: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  getFilterOptions: getFilterOptionsMock,
}));

import { MobileFilterToggle } from './mobile-filter-toggle';
import { EMPTY_FILTERS, type Filters } from '@/hooks/use-filters';
import type { FilterOptions } from '@/lib/types';

const RICH_OPTIONS: FilterOptions = {
  collections: [{ name: 'Учебные издания', count: 50 }],
  knowledge_areas: [],
  document_types: [
    { name: 'book', count: 100 },
    { name: 'textbook', count: 60 },
  ],
  languages: [],
  sources: [],
  databases: [
    { name: 'BOOKS', count: 1000 },
    { name: 'SERIAL', count: 500 },
  ],
  year_range: { min: 1900, max: 2026 },
  has_pdf: { with_pdf: 75, without_pdf: 25 },
};

function makeFilters(overrides: Partial<Filters> = {}): Filters {
  return { ...EMPTY_FILTERS, ...overrides };
}

beforeEach(() => {
  getFilterOptionsMock.mockReset();
  getFilterOptionsMock.mockResolvedValue(RICH_OPTIONS);
});

describe('MobileFilterToggle', () => {
  it('renders the trigger button collapsed by default', () => {
    render(<MobileFilterToggle filters={makeFilters()} onFiltersChange={vi.fn()} />);

    const trigger = screen.getByRole('button', { name: /Фильтры/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows the active filter count badge', () => {
    render(
      <MobileFilterToggle
        filters={makeFilters({ databases: ['BOOKS'], has_pdf: true })}
        onFiltersChange={vi.fn()}
      />,
    );

    const trigger = screen.getByRole('button', { name: /Фильтры/i });
    expect(trigger).toHaveTextContent('2');
  });

  it('toggles aria-expanded when clicked', async () => {
    const user = userEvent.setup();
    render(<MobileFilterToggle filters={makeFilters()} onFiltersChange={vi.fn()} />);

    const trigger = screen.getByRole('button', { name: /Фильтры/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders FilterPanel content inside the inline panel', async () => {
    render(<MobileFilterToggle filters={makeFilters()} onFiltersChange={vi.fn()} />);

    expect(await screen.findByText('Каталог')).toBeInTheDocument();
  });
});
