import { useState, type KeyboardEvent } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { HEADER_CHIP } from '@/components/layout/header-chip';
import { useTranslation } from '@/lib/i18n';

interface CustomPresetInputProps {
  disabled?: boolean;
  existingNames: string[];
  onSave: (name: string) => Promise<void> | void;
}

export function CustomPresetInput({ disabled, existingNames, onSave }: CustomPresetInputProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const reset = () => {
    setEditing(false);
    setValue('');
    setError(null);
  };

  const handleSave = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError(t('customPreset.errorEmpty'));
      return;
    }
    if (trimmed.length > 50) {
      setError(t('customPreset.errorTooLong'));
      return;
    }
    if (existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      setError(t('customPreset.errorDup'));
      return;
    }
    await onSave(trimmed);
    reset();
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      reset();
    }
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        disabled={disabled}
        className={HEADER_CHIP}
        title={t('customPreset.title')}
      >
        <Plus className="h-4 w-4" />
        {t('customPreset.add')}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        onKeyDown={handleKey}
        placeholder={t('customPreset.placeholder')}
        className="h-8 w-44 rounded-notion border border-notion-border bg-notion-bg px-2 text-xs text-notion-text outline-none focus:border-notion-accent"
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={disabled}
        className="inline-flex h-8 w-8 items-center justify-center rounded-notion bg-notion-accent text-white transition-colors hover:bg-notion-accent-hover disabled:opacity-50"
        title={t('common.save')}
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={reset}
        className="inline-flex h-8 w-8 items-center justify-center rounded-notion text-notion-text-tertiary transition-colors hover:bg-notion-bg-hover hover:text-notion-text"
        title={t('common.cancel')}
      >
        <X className="h-3.5 w-3.5" />
      </button>
      {error && (
        <span className="ml-2 text-[11px] text-red-600">{error}</span>
      )}
    </div>
  );
}
