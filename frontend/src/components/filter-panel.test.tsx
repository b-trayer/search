import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { getFilterOptionsMock } = vi.hoisted(() => ({
  getFilterOptionsMock: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  getFilterOptions: getFilterOptionsMock,
}));

import FilterPanel from './filter-panel';
import { EMPTY_FILTERS, type Filters } from '@/hooks/use-filters';
import type { FilterOptions } from '@/lib/types';

const RICH_OPTIONS: FilterOptions = {
  collections: [
    { name: 'Учебные издания', count: 50 },
    { name: 'Научные издания', count: 30 },
  ],
  knowledge_areas: [
    { name: 'Физика', count: 20 },
    { name: 'Математика', count: 10 },
  ],
  document_types: [
    { name: 'book', count: 100 },
    { name: 'textbook', count: 60 },
    { name: 'Учебник', count: 20 },
  ],
  languages: [
    { name: 'Русский', count: 40 },
    { name: 'Английский', count: 5 },
  ],
  sources: [{ name: 'Digital catalogue', count: 10 }],
  databases: [
    { name: 'BOOKS', count: 1000 },
    { name: 'SERIAL', count: 500 },
    { name: 'ELIB', count: 200 },
  ],
  year_range: { min: 1900, max: 2026 },
  has_pdf: { with_pdf: 75, without_pdf: 25 },
};

function makeFilters(overrides: Partial<Filters> = {}): Filters {
  return { ...EMPTY_FILTERS, ...overrides };
}

beforeEach(() => {
  getFilterOptionsMock.mockReset();
});

describe('FilterPanel', () => {
  it('renders all sections when data is rich enough', async () => {
    getFilterOptionsMock.mockResolvedValue(RICH_OPTIONS);
    render(<FilterPanel filters={makeFilters()} onFiltersChange={vi.fn()} />);

    expect(await screen.findByText('Год издания')).toBeInTheDocument();
    expect(screen.getByText('Каталог')).toBeInTheDocument();
    expect(screen.getByText('Тип документа')).toBeInTheDocument();
    expect(screen.getByText('Коллекция')).toBeInTheDocument();
    expect(screen.getByText('Область знания')).toBeInTheDocument();
    expect(screen.getByText('Язык')).toBeInTheDocument();
    expect(screen.getByText('Доступно онлайн')).toBeInTheDocument();
  });

  it('translates database codes to Russian labels', async () => {
    getFilterOptionsMock.mockResolvedValue(RICH_OPTIONS);
    render(<FilterPanel filters={makeFilters()} onFiltersChange={vi.fn()} />);

    expect(await screen.findByText('Книги')).toBeInTheDocument();
    expect(screen.getByText('Журналы и периодика')).toBeInTheDocument();
    expect(screen.getByText('Электронная библиотека НГУ')).toBeInTheDocument();
  });

  it('merges English/Russian document type duplicates into one entry', async () => {
    getFilterOptionsMock.mockResolvedValue(RICH_OPTIONS);
    render(<FilterPanel filters={makeFilters()} onFiltersChange={vi.fn()} />);

    expect(await screen.findByText('Учебник')).toBeInTheDocument();
    expect(screen.getByText('Книга')).toBeInTheDocument();
  });

  it('hides sparse sections (≤1 option)', async () => {
    getFilterOptionsMock.mockResolvedValue({
      ...RICH_OPTIONS,
      knowledge_areas: [{ name: 'Физика', count: 5 }],
      sources: [],
      collections: [],
      languages: [],
    });
    render(<FilterPanel filters={makeFilters()} onFiltersChange={vi.fn()} />);

    await screen.findByText('Каталог');
    expect(screen.queryByText('Коллекция')).not.toBeInTheDocument();
    expect(screen.queryByText('Область знания')).not.toBeInTheDocument();
    expect(screen.queryByText('Язык')).not.toBeInTheDocument();
  });

  it('hides the year section when bounds are missing', async () => {
    getFilterOptionsMock.mockResolvedValue({
      ...RICH_OPTIONS,
      year_range: { min: null, max: null },
    });
    render(<FilterPanel filters={makeFilters()} onFiltersChange={vi.fn()} />);

    await screen.findByText('Каталог');
    expect(screen.queryByText('Год издания')).not.toBeInTheDocument();
  });

  it('hides the "available online" checkbox when no docs have a PDF', async () => {
    getFilterOptionsMock.mockResolvedValue({
      ...RICH_OPTIONS,
      has_pdf: { with_pdf: 0, without_pdf: 100 },
    });
    render(<FilterPanel filters={makeFilters()} onFiltersChange={vi.fn()} />);

    await screen.findByText('Каталог');
    expect(screen.queryByText('Доступно онлайн')).not.toBeInTheDocument();
  });

  it('emits a filter change when a database checkbox is toggled', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    getFilterOptionsMock.mockResolvedValue(RICH_OPTIONS);
    render(<FilterPanel filters={makeFilters()} onFiltersChange={onFiltersChange} />);

    const booksRow = await screen.findByText('Книги');
    await user.click(booksRow);

    await waitFor(() => expect(onFiltersChange).toHaveBeenCalled());
    expect(onFiltersChange.mock.calls[0][0].databases).toContain('BOOKS');
  });

  it('emits a filter change when a year preset is clicked', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    getFilterOptionsMock.mockResolvedValue(RICH_OPTIONS);
    render(<FilterPanel filters={makeFilters()} onFiltersChange={onFiltersChange} />);

    const preset = await screen.findByRole('button', { name: 'С 2010' });
    await user.click(preset);

    await waitFor(() => expect(onFiltersChange).toHaveBeenCalled());
    const next = onFiltersChange.mock.calls[0][0];
    expect(next.year_from).toBe(2010);
    expect(next.year_to).toBeNull();
  });

  it('toggling Учебник sends every alias (textbook + Учебник) at once', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    getFilterOptionsMock.mockResolvedValue(RICH_OPTIONS);
    render(<FilterPanel filters={makeFilters()} onFiltersChange={onFiltersChange} />);

    const label = await screen.findByText('Учебник');
    await user.click(label);

    await waitFor(() => expect(onFiltersChange).toHaveBeenCalled());
    const next = onFiltersChange.mock.calls[0][0];
    expect(next.document_types).toEqual(expect.arrayContaining(['textbook', 'Учебник']));
  });

  it('reset in panel header clears every filter', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    getFilterOptionsMock.mockResolvedValue(RICH_OPTIONS);
    render(
      <FilterPanel
        filters={makeFilters({
          databases: ['BOOKS'],
          has_pdf: true,
        })}
        onFiltersChange={onFiltersChange}
      />,
    );

    const header = await screen.findByRole('heading', { level: 2, name: 'Фильтры' });
    const reset = header.parentElement!.parentElement!.querySelector('button');
    expect(reset).not.toBeNull();
    await user.click(reset!);

    expect(onFiltersChange).toHaveBeenCalledWith(EMPTY_FILTERS);
  });

  it('shows loading state before filter options resolve', async () => {
    let resolve: (value: FilterOptions) => void;
    getFilterOptionsMock.mockImplementation(
      () =>
        new Promise<FilterOptions>((res) => {
          resolve = res;
        }),
    );
    render(<FilterPanel filters={makeFilters()} onFiltersChange={vi.fn()} />);

    expect(await screen.findByText(/Загрузка фильтров/i)).toBeInTheDocument();
    expect(screen.queryByText('Каталог')).not.toBeInTheDocument();

    resolve!(RICH_OPTIONS);
    await screen.findByText('Каталог');
  });

  it('passes query and filters into getFilterOptions on initial load', async () => {
    getFilterOptionsMock.mockResolvedValue(RICH_OPTIONS);
    render(
      <FilterPanel
        filters={makeFilters({ databases: ['BOOKS'] })}
        onFiltersChange={vi.fn()}
        query="квантовая"
        searchField="all"
      />,
    );

    await screen.findByText('Каталог');
    expect(getFilterOptionsMock).toHaveBeenCalledTimes(1);
    const params = getFilterOptionsMock.mock.calls[0][0];
    expect(params.query).toBe('квантовая');
    expect(params.filters).toMatchObject({ databases: ['BOOKS'] });
    expect(params.searchField).toBe('all');
  });

  it('refetches filter options when the query changes', async () => {
    getFilterOptionsMock.mockResolvedValue(RICH_OPTIONS);
    const { rerender } = render(
      <FilterPanel filters={makeFilters()} onFiltersChange={vi.fn()} query="физика" />,
    );

    await screen.findByText('Каталог');
    expect(getFilterOptionsMock).toHaveBeenCalledTimes(1);

    rerender(<FilterPanel filters={makeFilters()} onFiltersChange={vi.fn()} query="химия" />);

    await waitFor(() => expect(getFilterOptionsMock).toHaveBeenCalledTimes(2), {
      timeout: 1500,
    });
    expect(getFilterOptionsMock.mock.calls[1][0].query).toBe('химия');
  });

  it('refetches filter options when filters change', async () => {
    getFilterOptionsMock.mockResolvedValue(RICH_OPTIONS);
    const { rerender } = render(
      <FilterPanel filters={makeFilters()} onFiltersChange={vi.fn()} query="физика" />,
    );

    await screen.findByText('Каталог');
    expect(getFilterOptionsMock).toHaveBeenCalledTimes(1);

    rerender(
      <FilterPanel
        filters={makeFilters({ databases: ['BOOKS'] })}
        onFiltersChange={vi.fn()}
        query="физика"
      />,
    );

    await waitFor(() => expect(getFilterOptionsMock).toHaveBeenCalledTimes(2), {
      timeout: 1500,
    });
    expect(getFilterOptionsMock.mock.calls[1][0].filters).toMatchObject({
      databases: ['BOOKS'],
    });
  });

  it('skips contextual params when contextual mode is disabled', async () => {
    getFilterOptionsMock.mockResolvedValue(RICH_OPTIONS);
    render(
      <FilterPanel
        filters={makeFilters({ databases: ['BOOKS'] })}
        onFiltersChange={vi.fn()}
        query="физика"
        enableContextual={false}
      />,
    );

    await screen.findByText('Каталог');
    const params = getFilterOptionsMock.mock.calls[0][0];
    expect(params.query).toBeUndefined();
    expect(params.filters).toBeUndefined();
    expect(params.searchField).toBeUndefined();
  });
});
