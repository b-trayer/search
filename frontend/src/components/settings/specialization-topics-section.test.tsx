import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpecializationTopicsSection } from './specialization-topics-section';

function setup(overrides: { topics?: Record<string, string[]> } = {}) {
  const onTopicsChange = vi.fn();
  const onAdd = vi.fn();
  const onRemove = vi.fn();
  render(
    <SpecializationTopicsSection
      topics={overrides.topics ?? { Физика: ['физик', 'квант'] }}
      isSaving={false}
      onTopicsChange={onTopicsChange}
      onAddSpecialization={onAdd}
      onRemoveSpecialization={onRemove}
    />,
  );
  return { onTopicsChange, onAdd, onRemove };
}

describe('SpecializationTopicsSection chip input', () => {
  it('renders existing keywords as chips', () => {
    setup();
    expect(screen.getByText('физик')).toBeInTheDocument();
    expect(screen.getByText('квант')).toBeInTheDocument();
  });

  it('adds a new keyword on Enter', () => {
    const { onTopicsChange } = setup();
    const input = screen.getByPlaceholderText(/^\+$/);
    fireEvent.change(input, { target: { value: 'оптик' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onTopicsChange).toHaveBeenCalledWith('Физика', ['физик', 'квант', 'оптик']);
  });

  it('adds a new keyword on comma', () => {
    const { onTopicsChange } = setup();
    const input = screen.getByPlaceholderText(/^\+$/);
    fireEvent.change(input, { target: { value: 'оптик' } });
    fireEvent.keyDown(input, { key: ',' });
    expect(onTopicsChange).toHaveBeenCalledWith('Физика', ['физик', 'квант', 'оптик']);
  });

  it('deduplicates case-insensitively', () => {
    const { onTopicsChange } = setup();
    const input = screen.getByPlaceholderText(/^\+$/);
    fireEvent.change(input, { target: { value: 'ФИЗИК' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onTopicsChange).not.toHaveBeenCalled();
  });

  it('removes a chip when its X is clicked', () => {
    const { onTopicsChange } = setup();
    const removeBtn = screen.getByLabelText('Удалить «физик»');
    fireEvent.click(removeBtn);
    expect(onTopicsChange).toHaveBeenCalledWith('Физика', ['квант']);
  });

  it('removes last chip on Backspace when input empty', () => {
    const { onTopicsChange } = setup();
    const input = screen.getByPlaceholderText(/^\+$/);
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(onTopicsChange).toHaveBeenCalledWith('Физика', ['физик']);
  });
});
