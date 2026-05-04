import { useState, useId } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import FilterPanel from '@/components/filter-panel';
import { countActiveFilters } from '@/hooks/use-filters';
import type { Filters } from '@/hooks/use-filters';
import type { SearchField } from '@/lib/types';

interface MobileFilterToggleProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  query?: string;
  searchField?: SearchField;
}

export function MobileFilterToggle({
  filters,
  onFiltersChange,
  query,
  searchField,
}: MobileFilterToggleProps) {
  const [open, setOpen] = useState(false);
  const totalSelected = countActiveFilters(filters);
  const panelId = useId();

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex h-9 items-center gap-2 rounded-notion border border-notion-border bg-notion-bg px-3 text-sm font-medium text-notion-text transition-colors hover:bg-notion-bg-hover"
      >
        <SlidersHorizontal className="h-4 w-4 text-notion-text-tertiary" />
        Фильтры
        {totalSelected > 0 && (
          <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-notion bg-notion-bg-secondary px-1.5 text-[11px] tabular-nums text-notion-text-secondary">
            {totalSelected}
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 text-notion-text-tertiary transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        id={panelId}
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="mt-3 overflow-hidden rounded-notion border border-notion-border bg-notion-bg shadow-notion-sm">
            <FilterPanel
              filters={filters}
              onFiltersChange={onFiltersChange}
              variant="mobile"
              query={query}
              searchField={searchField}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
