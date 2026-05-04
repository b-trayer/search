import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Layers } from 'lucide-react';
import FilterSection from './filter-section';

const items = [
  { name: 'BOOKS', count: 10000 },
  { name: 'SERIAL', count: 250 },
];

function renderSection(overrides: Partial<React.ComponentProps<typeof FilterSection>> = {}) {
  return render(
    <FilterSection
      title="Каталог"
      icon={Layers}
      items={items}
      selected={[]}
      onToggle={vi.fn()}
      {...overrides}
    />,
  );
}

describe('FilterSection', () => {
  it('renders title and item names', () => {
    renderSection();

    expect(screen.getByText('Каталог')).toBeInTheDocument();
    expect(screen.getByText('BOOKS')).toBeInTheDocument();
    expect(screen.getByText('SERIAL')).toBeInTheDocument();
  });

  it('formats counts with locale separators', () => {
    renderSection();
    expect(screen.getByText(/^10[\s\u00a0]000$/)).toBeInTheDocument();
  });

  it('shows total item count next to the chevron', () => {
    renderSection();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('uses labelMapper when provided', () => {
    renderSection({
      labelMapper: (name) => (name === 'BOOKS' ? 'Книги' : name),
    });

    expect(screen.getByText('Книги')).toBeInTheDocument();
    expect(screen.queryByText('BOOKS')).not.toBeInTheDocument();
  });

  it('renders selected count badge when something is selected', () => {
    renderSection({ selected: ['BOOKS'] });
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
  });

  it('checks the correct checkboxes for selected items', () => {
    renderSection({ selected: ['SERIAL'] });
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).toBeChecked();
  });

  it('calls onToggle(name, true) when an unchecked item is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderSection({ onToggle });

    await user.click(screen.getAllByRole('checkbox')[0]);

    expect(onToggle).toHaveBeenCalledWith('BOOKS', true);
  });

  it('calls onToggle(name, false) when a checked item is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderSection({ selected: ['BOOKS'], onToggle });

    await user.click(screen.getAllByRole('checkbox')[0]);

    expect(onToggle).toHaveBeenCalledWith('BOOKS', false);
  });

  it('toggles open/closed when the header is clicked', async () => {
    const user = userEvent.setup();
    renderSection({ defaultOpen: true });

    expect(screen.getAllByRole('checkbox')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: /Каталог/i }));
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });
});

describe('FilterSection — search & show more', () => {
  const longList = Array.from({ length: 15 }, (_, i) => ({
    name: `Item ${i + 1}`,
    count: 100 - i,
  }));

  it('does not render the search input for short lists', () => {
    render(
      <FilterSection
        title="Коллекция"
        icon={Layers}
        items={longList.slice(0, 4)}
        selected={[]}
        onToggle={vi.fn()}
      />,
    );

    expect(
      screen.queryByPlaceholderText(/Найти в «Коллекция»/i),
    ).not.toBeInTheDocument();
  });

  it('shows the search input when items exceed the threshold', () => {
    render(
      <FilterSection
        title="Коллекция"
        icon={Layers}
        items={longList}
        selected={[]}
        onToggle={vi.fn()}
      />,
    );

    expect(
      screen.getByPlaceholderText(/Найти в «Коллекция»/i),
    ).toBeInTheDocument();
  });

  it('filters items as the user types', async () => {
    const user = userEvent.setup();
    render(
      <FilterSection
        title="Коллекция"
        icon={Layers}
        items={longList}
        selected={[]}
        onToggle={vi.fn()}
      />,
    );

    await user.type(
      screen.getByPlaceholderText(/Найти в «Коллекция»/i),
      'Item 5',
    );

    expect(screen.getByText('Item 5')).toBeInTheDocument();
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
  });

  it('shows the empty state when no items match the search', async () => {
    const user = userEvent.setup();
    render(
      <FilterSection
        title="Коллекция"
        icon={Layers}
        items={longList}
        selected={[]}
        onToggle={vi.fn()}
      />,
    );

    await user.type(
      screen.getByPlaceholderText(/Найти в «Коллекция»/i),
      'asdfghjkl',
    );

    expect(screen.getByText(/Ничего не найдено/i)).toBeInTheDocument();
  });

  it('collapses long lists below the show-more threshold', () => {
    render(
      <FilterSection
        title="Коллекция"
        icon={Layers}
        items={longList}
        selected={[]}
        onToggle={vi.fn()}
        searchThreshold={20}
      />,
    );

    expect(screen.getAllByRole('checkbox')).toHaveLength(7);
    expect(screen.getByText(/Показать еще 8/i)).toBeInTheDocument();
  });

  it('expands all items when “Показать еще” is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FilterSection
        title="Коллекция"
        icon={Layers}
        items={longList}
        selected={[]}
        onToggle={vi.fn()}
        searchThreshold={20}
      />,
    );

    await user.click(screen.getByText(/Показать еще 8/i));

    expect(screen.getAllByRole('checkbox')).toHaveLength(15);
    expect(screen.getByText(/Свернуть/i)).toBeInTheDocument();
  });

  it('always keeps selected items visible even when collapsed', () => {
    render(
      <FilterSection
        title="Коллекция"
        icon={Layers}
        items={longList}
        selected={['Item 14']}
        onToggle={vi.fn()}
        searchThreshold={20}
      />,
    );

    expect(screen.getByText('Item 14')).toBeInTheDocument();
  });
});
