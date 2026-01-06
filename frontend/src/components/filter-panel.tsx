import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { FilterPanelSkeleton, mergeDocumentTypes } from '@/components/filters';
import { FilterContent } from '@/components/filters/filter-content';
import { getFilterOptions } from '@/lib/api';
import type { FilterOptions } from '@/lib/types';
import type { Filters } from '@/hooks/use-filters';

interface FilterPanelProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  variant?: 'desktop' | 'mobile';
}

const FilterPanel = memo(function FilterPanel({ filters, onFiltersChange, variant = 'desktop' }: FilterPanelProps) {
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getFilterOptions().then(setFilterOptions).catch(console.error).finally(() => setIsLoading(false));
  }, []);

  const { mergedDocTypes, docTypeAliasMap } = useMemo(() => {
    if (!filterOptions) return { mergedDocTypes: [], docTypeAliasMap: new Map<string, string[]>() };
    const { merged, aliasMap } = mergeDocumentTypes(filterOptions.document_types);
    return { mergedDocTypes: merged, docTypeAliasMap: aliasMap };
  }, [filterOptions]);

  const handleToggle = useCallback((key: keyof Omit<Filters, 'has_pdf'>, name: string, checked: boolean) => {
    onFiltersChange({ ...filters, [key]: checked ? [...filters[key], name] : filters[key].filter(i => i !== name) });
  }, [filters, onFiltersChange]);

  const handleDocTypeToggle = useCallback((canonicalName: string, checked: boolean) => {
    const allAliases = docTypeAliasMap.get(canonicalName) || [canonicalName];
    const updated = checked ? Array.from(new Set([...filters.document_types, ...allAliases])) : filters.document_types.filter(t => !allAliases.includes(t));
    onFiltersChange({ ...filters, document_types: updated });
  }, [docTypeAliasMap, filters, onFiltersChange]);

  const isDocTypeSelected = useCallback((canonicalName: string) => (docTypeAliasMap.get(canonicalName) || [canonicalName]).some(a => filters.document_types.includes(a)), [docTypeAliasMap, filters.document_types]);
  const handleReset = useCallback(() => onFiltersChange({ collections: [], knowledge_areas: [], document_types: [], languages: [], sources: [], has_pdf: null }), [onFiltersChange]);
  const handleHasPdfChange = useCallback((v: boolean | null) => onFiltersChange({ ...filters, has_pdf: v }), [filters, onFiltersChange]);
  const totalSelected = filters.collections.length + filters.knowledge_areas.length + filters.document_types.length + filters.languages.length + filters.sources.length + (filters.has_pdf !== null ? 1 : 0);

  if (isLoading) return variant === 'mobile' ? null : <FilterPanelSkeleton />;
  if (!filterOptions) return null;

  const content = <FilterContent filterOptions={filterOptions} filters={filters} mergedDocTypes={mergedDocTypes} onToggle={handleToggle} onDocTypeToggle={handleDocTypeToggle} isDocTypeSelected={isDocTypeSelected} onReset={handleReset} onHasPdfChange={handleHasPdfChange} totalSelected={totalSelected} variant={variant} />;

  return variant === 'mobile' ? <div className="h-full">{content}</div> : (
    <aside className="w-72 shrink-0 hidden lg:block">
      <div className="sticky top-20 rounded-notion bg-notion-bg border border-notion-border shadow-notion-sm overflow-hidden">{content}</div>
    </aside>
  );
});

export default FilterPanel;
