import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { YearRangeSection } from './year-range-section';

const BOUNDS = { min: 1900, max: 2026 };

function renderSection(
  overrides: Partial<React.ComponentProps<typeof YearRangeSection>> = {},
) {
  return render(
    <YearRangeSection
      bounds={BOUNDS}
      yearFrom={null}
      yearTo={null}
      onChange={vi.fn()}
      {...overrides}
    />,
  );
}

describe('YearRangeSection', () => {
  it('renders the title and bound markers', () => {
    renderSection();

    expect(screen.getByText('Год издания')).toBeInTheDocument();
    expect(screen.getByText('1900')).toBeInTheDocument();
    expect(screen.getByText('2026')).toBeInTheDocument();
  });

  it('does not render an active range badge when no range is selected', () => {
    renderSection();
    expect(screen.queryByText(/1900–2026/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Сбросить' })).not.toBeInTheDocument();
  });

  it('renders an active range badge when only year_from is set', () => {
    renderSection({ yearFrom: 2020 });
    expect(screen.getByText('2020–2026')).toBeInTheDocument();
  });

  it('renders an active range badge when both bounds are set', () => {
    renderSection({ yearFrom: 2010, yearTo: 2020 });
    expect(screen.getByText('2010–2020')).toBeInTheDocument();
  });

  it('renders four preset buttons', () => {
    renderSection();
    expect(screen.getByRole('button', { name: 'С 2021' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'С 2010' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'С 2000' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'До 1990' })).toBeInTheDocument();
  });

  it('invokes onChange with the preset values', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderSection({ onChange });

    await user.click(screen.getByRole('button', { name: 'С 2010' }));
    expect(onChange).toHaveBeenCalledWith(2010, null);

    await user.click(screen.getByRole('button', { name: 'До 1990' }));
    expect(onChange).toHaveBeenCalledWith(null, 1990);
  });

  it('shows a Reset button when a range is active and clears the selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderSection({ yearFrom: 2010, yearTo: 2020, onChange });

    const reset = screen.getByRole('button', { name: 'Сбросить' });
    await user.click(reset);
    expect(onChange).toHaveBeenCalledWith(null, null);
  });

  it('falls back to bounds defaults when bounds are missing', () => {
    render(
      <YearRangeSection
        bounds={{ min: null, max: null }}
        yearFrom={null}
        yearTo={null}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('1900')).toBeInTheDocument();
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(String(currentYear))).toBeInTheDocument();
  });

  it('collapses content when the header is clicked', async () => {
    const user = userEvent.setup();
    renderSection();

    expect(screen.getByRole('button', { name: 'С 2010' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Год издания/i }));
    expect(screen.queryByRole('button', { name: 'С 2010' })).not.toBeInTheDocument();
  });
});
