import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface FilterPanelHeaderProps {
  totalSelected: number;
  onReset: () => void;
}

export function FilterPanelHeader({ totalSelected, onReset }: FilterPanelHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between border-b border-notion-border py-3 pl-4 pr-5">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-notion-text-tertiary" />
        <h2 className="text-sm font-medium text-notion-text">{t('filters.title')}</h2>
        {totalSelected > 0 && (
          <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-notion bg-notion-bg-secondary px-1.5 text-[11px] tabular-nums text-notion-text-secondary">
            {totalSelected}
          </span>
        )}
      </div>
      {totalSelected > 0 && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-7 items-center gap-1 rounded-notion px-2 text-xs text-notion-text-secondary transition-colors hover:bg-notion-bg-hover hover:text-notion-text"
        >
          <RotateCcw className="h-3 w-3" />
          {t('filters.reset')}
        </button>
      )}
    </div>
  );
}
