import { X } from 'lucide-react';
import { getDocumentTypeLabel, getDatabaseLabel } from './filter-utils';
import { useTranslation } from '@/lib/i18n';
import type { Filters } from '@/hooks/use-filters';

interface ChipDef {
  key: string;
  label: string;
  onRemove: () => void;
}

interface ActiveFilterChipsProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onReset: () => void;
}

export function ActiveFilterChips({
  filters,
  onFiltersChange,
  onReset,
}: ActiveFilterChipsProps) {
  const { t } = useTranslation();
  const chips: ChipDef[] = [];

  const buildYearLabel = (from: number | null, to: number | null): string | null => {
    if (from === null && to === null) return null;
    if (from !== null && to !== null) return `${from}\u2013${to}`;
    if (from !== null) return t('filters.from', { year: from });
    return t('filters.until', { year: to as number });
  };

  const yearLabel = buildYearLabel(filters.year_from, filters.year_to);
  if (yearLabel) {
    chips.push({
      key: 'year',
      label: yearLabel,
      onRemove: () => onFiltersChange({ ...filters, year_from: null, year_to: null }),
    });
  }

  filters.databases.forEach((db) => {
    chips.push({
      key: `database:${db}`,
      label: getDatabaseLabel(db),
      onRemove: () =>
        onFiltersChange({
          ...filters,
          databases: filters.databases.filter((d) => d !== db),
        }),
    });
  });

  filters.document_types.forEach((dt) => {
    chips.push({
      key: `doctype:${dt}`,
      label: getDocumentTypeLabel(dt),
      onRemove: () =>
        onFiltersChange({
          ...filters,
          document_types: filters.document_types.filter((t) => t !== dt),
        }),
    });
  });

  filters.collections.forEach((c) => {
    chips.push({
      key: `collection:${c}`,
      label: c,
      onRemove: () =>
        onFiltersChange({
          ...filters,
          collections: filters.collections.filter((x) => x !== c),
        }),
    });
  });

  filters.knowledge_areas.forEach((k) => {
    chips.push({
      key: `area:${k}`,
      label: k,
      onRemove: () =>
        onFiltersChange({
          ...filters,
          knowledge_areas: filters.knowledge_areas.filter((x) => x !== k),
        }),
    });
  });

  filters.languages.forEach((l) => {
    chips.push({
      key: `lang:${l}`,
      label: l,
      onRemove: () =>
        onFiltersChange({
          ...filters,
          languages: filters.languages.filter((x) => x !== l),
        }),
    });
  });

  filters.sources.forEach((s) => {
    chips.push({
      key: `source:${s}`,
      label: s,
      onRemove: () =>
        onFiltersChange({
          ...filters,
          sources: filters.sources.filter((x) => x !== s),
        }),
    });
  });

  if (filters.has_pdf === true) {
    chips.push({
      key: 'has_pdf',
      label: t('filters.online'),
      onRemove: () => onFiltersChange({ ...filters, has_pdf: null }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="group inline-flex h-7 items-center gap-1.5 rounded-notion border border-notion-border bg-notion-bg px-2.5 text-xs text-notion-text transition-colors hover:border-notion-border-strong hover:bg-notion-bg-hover"
        >
          <span className="max-w-[16rem] truncate">{chip.label}</span>
          <X className="h-3 w-3 text-notion-text-tertiary transition-colors group-hover:text-notion-text" />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-7 items-center gap-1 rounded-notion px-2 text-xs text-notion-text-secondary transition-colors hover:bg-notion-bg-hover hover:text-notion-text"
        >
          {t('common.clearAll')}
        </button>
      )}
    </div>
  );
}
