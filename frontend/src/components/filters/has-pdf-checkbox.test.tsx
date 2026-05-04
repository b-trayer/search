import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HasPdfCheckbox } from './has-pdf-checkbox';

describe('HasPdfCheckbox', () => {
  it('renders the new "Доступно онлайн" label and count', () => {
    render(<HasPdfCheckbox checked={null} onChange={vi.fn()} count={1234} />);

    expect(screen.getByText('Доступно онлайн')).toBeInTheDocument();
    expect(screen.getByText(/^1[\s\u00a0]234$/)).toBeInTheDocument();
  });

  it('renders unchecked when value is null', () => {
    render(<HasPdfCheckbox checked={null} onChange={vi.fn()} count={10} />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('renders checked when value is true', () => {
    render(<HasPdfCheckbox checked={true} onChange={vi.fn()} count={10} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('calls onChange(true) when clicked from null', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<HasPdfCheckbox checked={null} onChange={onChange} count={10} />);

    await user.click(screen.getByRole('checkbox'));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange(null) when toggled off from true', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<HasPdfCheckbox checked={true} onChange={onChange} count={10} />);

    await user.click(screen.getByRole('checkbox'));

    expect(onChange).toHaveBeenCalledWith(null);
  });
});
