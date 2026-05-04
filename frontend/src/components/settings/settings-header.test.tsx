import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SettingsHeader } from './settings-header';

function renderHeader(props: Partial<React.ComponentProps<typeof SettingsHeader>> = {}) {
  return render(
    <MemoryRouter>
      <SettingsHeader
        isSaving={false}
        hasChanges={false}
        pendingChanges={0}
        onSave={vi.fn()}
        onReset={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe('SettingsHeader', () => {
  it('renders the title and back link', () => {
    renderHeader();
    expect(screen.getByText(/Настройки ранжирования/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /назад/i })).toBeInTheDocument();
  });

  it('hides pending badge when there are no changes', () => {
    renderHeader({ hasChanges: false, pendingChanges: 0 });
    expect(screen.queryByText(/изменени/i)).not.toBeInTheDocument();
  });

  it('shows pending badge with correct pluralization', () => {
    renderHeader({ hasChanges: true, pendingChanges: 3 });
    expect(screen.getByText(/3 изменения/)).toBeInTheDocument();
  });

  it('disables save when no changes', () => {
    renderHeader({ hasChanges: false });
    expect(screen.getByRole('button', { name: /сохранить/i })).toBeDisabled();
  });

  it('enables save when there are changes', () => {
    renderHeader({ hasChanges: true });
    expect(screen.getByRole('button', { name: /сохранить/i })).not.toBeDisabled();
  });

  it('calls onSave when save clicked', () => {
    const onSave = vi.fn();
    renderHeader({ hasChanges: true, onSave });
    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }));
    expect(onSave).toHaveBeenCalled();
  });

  it('opens confirm dialog before resetting', async () => {
    const onReset = vi.fn();
    renderHeader({ onReset });

    fireEvent.click(screen.getByRole('button', { name: /сбросить все/i }));

    await waitFor(() => {
      expect(screen.getByText(/Сбросить все настройки\?/)).toBeInTheDocument();
    });
    expect(onReset).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /^сбросить$/i }));
    expect(onReset).toHaveBeenCalled();
  });

  it('cancels reset when cancel clicked', async () => {
    const onReset = vi.fn();
    renderHeader({ onReset });
    fireEvent.click(screen.getByRole('button', { name: /сбросить все/i }));
    await waitFor(() => {
      expect(screen.getByText(/Сбросить все настройки\?/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /отмена/i }));
    expect(onReset).not.toHaveBeenCalled();
  });

  it('renders export and import buttons when handlers provided', () => {
    renderHeader({ onExport: vi.fn(), onImport: vi.fn() });
    expect(screen.getByRole('button', { name: /экспорт/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /импорт/i })).toBeInTheDocument();
  });

  it('omits export/import buttons when handlers absent', () => {
    renderHeader();
    expect(screen.queryByRole('button', { name: /экспорт/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /импорт/i })).not.toBeInTheDocument();
  });

  it('calls onExport when export clicked', () => {
    const onExport = vi.fn();
    renderHeader({ onExport });
    fireEvent.click(screen.getByRole('button', { name: /экспорт/i }));
    expect(onExport).toHaveBeenCalled();
  });
});
