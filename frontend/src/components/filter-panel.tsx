import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { FilterPanelSkeleton, mergeDocumentTypes } from '@/components/filters';
import { FilterContent } from '@/components/filters/filter-content';
import { getFilterOptions } from '@/lib/api';
import { EMPTY_FILTERS, convertFiltersToSearchParams } from '@/hooks/use-filters';
import type { FilterOptions, SearchField } from '@/lib/types';
import type { Filters } from '@/hooks/use-filters';
import { countActiveFilters } from '@/hooks/use-filters';

interface FilterPanelProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  variant?: 'desktop' | 'mobile';
  query?: string;
  searchField?: SearchField;
  enableContextual?: boolean;
}

const REFETCH_DEBOUNCE_MS = 300;

type ListKey =
  | 'collections'
  | 'knowledge_areas'
  | 'document_types'
  | 'languages'
  | 'sources'
  | 'databases';

const FilterPanel = memo(function FilterPanel({
  filters,
  onFiltersChange,
  variant = 'desktop',
  query,
  searchField,
  enableContextual = true,
}: FilterPanelProps) {
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);

  const contextKey = useMemo(() => {
    if (!enableContextual) return 'static';
    return JSON.stringify({
      q: query?.trim() || '',
      f: convertFiltersToSearchParams(filters),
      sf: searchField ?? 'all',
    });
  }, [enableContextual, query, filters, searchField]);

  useEffect(() => {
    const isInitial = filterOptions === null;
    const controller = new AbortController();
    let timeoutHandle: number | undefined;

    const fetchOptions = () => {
      if (!isInitial) setIsRefetching(true);
      const params = enableContextual
        ? {
            query: query?.trim() ? query : undefined,
            filters: convertFiltersToSearchParams(filters),
            searchField,
            signal: controller.signal,
          }
        : { signal: controller.signal };

      getFilterOptions(params)
        .then((opts) => {
          if (controller.signal.aborted) return;
          setFilterOptions(opts);
        })
        .catch((err) => {
          if (err?.name === 'AbortError') return;
          console.error(err);
        })
        .finally(() => {
          if (controller.signal.aborted) return;
          if (isInitial) setIsLoading(false);
          setIsRefetching(false);
        });
    };

    if (isInitial) {
      fetchOptions();
    } else {
      timeoutHandle = window.setTimeout(fetchOptions, REFETCH_DEBOUNCE_MS);
    }

    return () => {
      if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle);
      controller.abort();
    };
  }, [contextKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const { mergedDocTypes, docTypeAliasMap } = useMemo(() => {
    if (!filterOptions) return { mergedDocTypes: [], docTypeAliasMap: new Map<string, string[]>() };
    const { merged, aliasMap } = mergeDocumentTypes(filterOptions.document_types);
    return { mergedDocTypes: merged, docTypeAliasMap: aliasMap };
  }, [filterOptions]);

  const handleToggle = useCallback(
    (key: ListKey, name: string, checked: boolean) => {
      onFiltersChange({
        ...filters,
        [key]: checked ? [...filters[key], name] : filters[key].filter((i) => i !== name),
      });
    },
    [filters, onFiltersChange],
  );

  const handleDocTypeToggle = useCallback(
    (canonicalName: string, checked: boolean) => {
      const allAliases = docTypeAliasMap.get(canonicalName) || [canonicalName];
      const updated = checked
        ? Array.from(new Set([...filters.document_types, ...allAliases]))
        : filters.document_types.filter((t) => !allAliases.includes(t));
      onFiltersChange({ ...filters, document_types: updated });
    },
    [docTypeAliasMap, filters, onFiltersChange],
  );

  const isDocTypeSelected = useCallback(
    (canonicalName: string) =>
      (docTypeAliasMap.get(canonicalName) || [canonicalName]).some((a) =>
        filters.document_types.includes(a),
      ),
    [docTypeAliasMap, filters.document_types],
  );

  const handleReset = useCallback(() => onFiltersChange(EMPTY_FILTERS), [onFiltersChange]);
  const handleHasPdfChange = useCallback(
    (v: boolean | null) => onFiltersChange({ ...filters, has_pdf: v }),
    [filters, onFiltersChange],
  );
  const handleYearRangeChange = useCallback(
    (year_from: number | null, year_to: number | null) =>
      onFiltersChange({ ...filters, year_from, year_to }),
    [filters, onFiltersChange],
  );

  const totalSelected = countActiveFilters(filters);

  if (isLoading) return variant === 'mobile' ? null : <FilterPanelSkeleton />;
  if (!filterOptions) return null;

  const content = (
    <div
      className={`transition-opacity duration-200 ${
        isRefetching ? 'opacity-60' : 'opacity-100'
      }`}
      aria-busy={isRefetching}
    >
      <FilterContent
        filterOptions={filterOptions}
        filters={filters}
        mergedDocTypes={mergedDocTypes}
        onToggle={handleToggle}
        onDocTypeToggle={handleDocTypeToggle}
        isDocTypeSelected={isDocTypeSelected}
        onReset={handleReset}
        onHasPdfChange={handleHasPdfChange}
        onYearRangeChange={handleYearRangeChange}
        totalSelected={totalSelected}
        variant={variant}
      />
    </div>
  );

  return variant === 'mobile' ? (
    <div className="max-h-[70vh] overflow-y-auto">{content}</div>
  ) : (
    <aside className="hidden w-72 shrink-0 lg:block">
      <div className="sticky top-20 overflow-hidden rounded-notion border border-notion-border bg-notion-bg shadow-notion-sm">
        {content}
      </div>
    </aside>
  );
});

export default FilterPanel;
