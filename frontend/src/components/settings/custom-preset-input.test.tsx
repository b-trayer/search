import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomPresetInput } from './custom-preset-input';

describe('CustomPresetInput', () => {
  it('starts collapsed', () => {
    render(<CustomPresetInput existingNames={[]} onSave={vi.fn()} />);
    expect(screen.getByRole('button', { name: /сохранить как пресет/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/название/i)).not.toBeInTheDocument();
  });

  it('opens input and saves on Enter', () => {
    const onSave = vi.fn();
    render(<CustomPresetInput existingNames={[]} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: /сохранить как пресет/i }));
    const input = screen.getByPlaceholderText(/название/i);
    fireEvent.change(input, { target: { value: 'Моя физика' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSave).toHaveBeenCalledWith('Моя физика');
  });

  it('rejects duplicate names', () => {
    const onSave = vi.fn();
    render(<CustomPresetInput existingNames={['default', 'high_ctr']} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: /сохранить как пресет/i }));
    const input = screen.getByPlaceholderText(/название/i);
    fireEvent.change(input, { target: { value: 'DEFAULT' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/уже есть пресет/i)).toBeInTheDocument();
  });

  it('rejects empty name', () => {
    const onSave = vi.fn();
    render(<CustomPresetInput existingNames={[]} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: /сохранить как пресет/i }));
    const input = screen.getByPlaceholderText(/название/i);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/введите название/i)).toBeInTheDocument();
  });

  it('cancels with Escape', () => {
    render(<CustomPresetInput existingNames={[]} onSave={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /сохранить как пресет/i }));
    const input = screen.getByPlaceholderText(/название/i);
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByPlaceholderText(/название/i)).not.toBeInTheDocument();
  });
});
