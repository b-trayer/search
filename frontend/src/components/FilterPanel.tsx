import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { BookOpen, Globe, Tag, FileText, Database } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FilterSection,
  FilterPanelHeader,
  HasPdfCheckbox,
  FilterPanelSkeleton,
  getDocumentTypeLabel,
  mergeDocumentTypes,
} from '@/components/filters';
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
    getFilterOptions()
      .then(setFilterOptions)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const { mergedDocTypes, docTypeAliasMap } = useMemo(() => {
    if (!filterOptions) return { mergedDocTypes: [], docTypeAliasMap: new Map<string, string[]>() };
    const { merged, aliasMap } = mergeDocumentTypes(filterOptions.document_types);
    return { mergedDocTypes: merged, docTypeAliasMap: aliasMap };
  }, [filterOptions]);

  const handleToggle = useCallback((key: keyof Omit<Filters, 'has_pdf'>, name: string, checked: boolean) => {
    const updated = checked ? [...filters[key], name] : filters[key].filter((item) => item !== name);
    onFiltersChange({ ...filters, [key]: updated });
  }, [filters, onFiltersChange]);

  const handleDocTypeToggle = useCallback((canonicalName: string, checked: boolean) => {
    const allAliases = docTypeAliasMap.get(canonicalName) || [canonicalName];
    let updated: string[];
    if (checked) {
      const existingSet = new Set(filters.document_types);
      allAliases.forEach((alias) => existingSet.add(alias));
      updated = Array.from(existingSet);
    } else {
      updated = filters.document_types.filter((t) => !allAliases.includes(t));
    }
    onFiltersChange({ ...filters, document_types: updated });
  }, [docTypeAliasMap, filters, onFiltersChange]);

  const isDocTypeSelected = useCallback((canonicalName: string): boolean => {
    const allAliases = docTypeAliasMap.get(canonicalName) || [canonicalName];
    return allAliases.some((alias) => filters.document_types.includes(alias));
  }, [docTypeAliasMap, filters.document_types]);

  const handleReset = useCallback(() => {
    onFiltersChange({
      collections: [], knowledge_areas: [], document_types: [],
      languages: [], sources: [], has_pdf: null,
    });
  }, [onFiltersChange]);

  const handleHasPdfChange = useCallback((v: boolean | null) => {
    onFiltersChange({ ...filters, has_pdf: v });
  }, [filters, onFiltersChange]);

  const totalSelected =
    filters.collections.length + filters.knowledge_areas.length + filters.document_types.length +
    filters.languages.length + filters.sources.length + (filters.has_pdf !== null ? 1 : 0);

  if (isLoading) {
    return variant === 'mobile' ? null : <FilterPanelSkeleton />;
  }
  if (!filterOptions) return null;

  const filterContent = (
    <>
      {variant === 'desktop' && (
        <FilterPanelHeader totalSelected={totalSelected} onReset={handleReset} />
      )}
      <ScrollArea className={variant === 'mobile' ? 'h-full' : 'h-[calc(100vh-200px)]'}>
        <div className="p-4 space-y-1">
          {filterOptions.sources.length > 0 && (
            <>
              <FilterSection title="Источник" icon={Database} iconColor="text-blue-600" items={filterOptions.sources} selected={filters.sources} onToggle={(n, c) => handleToggle('sources', n, c)} defaultOpen />
              <div className="border-t border-notion-border my-3" />
            </>
          )}
          {filterOptions.collections.length > 0 && (
            <>
              <FilterSection title="Коллекция" icon={BookOpen} iconColor="text-notion-accent" items={filterOptions.collections} selected={filters.collections} onToggle={(n, c) => handleToggle('collections', n, c)} />
              <div className="border-t border-notion-border my-3" />
            </>
          )}
          {mergedDocTypes.length > 0 && (
            <>
              <FilterSection title="Тип документа" icon={FileText} iconColor="text-orange-600" items={mergedDocTypes} selected={mergedDocTypes.filter((i) => isDocTypeSelected(i.name)).map((i) => i.name)} onToggle={handleDocTypeToggle} labelMapper={getDocumentTypeLabel} />
              <div className="border-t border-notion-border my-3" />
            </>
          )}
          {filterOptions.knowledge_areas.length > 0 && (
            <>
              <FilterSection title="Область знания" icon={Tag} iconColor="text-green-600" items={filterOptions.knowledge_areas} selected={filters.knowledge_areas} onToggle={(n, c) => handleToggle('knowledge_areas', n, c)} />
              <div className="border-t border-notion-border my-3" />
            </>
          )}
          {filterOptions.languages.length > 0 && (
            <>
              <FilterSection title="Язык" icon={Globe} iconColor="text-purple-600" items={filterOptions.languages} selected={filters.languages} onToggle={(n, c) => handleToggle('languages', n, c)} />
              <div className="border-t border-notion-border my-3" />
            </>
          )}
          <HasPdfCheckbox checked={filters.has_pdf} onChange={handleHasPdfChange} count={filterOptions.has_pdf.with_pdf} />
        </div>
      </ScrollArea>
    </>
  );

  if (variant === 'mobile') {
    return <div className="h-full">{filterContent}</div>;
  }

  return (
    <aside className="w-72 shrink-0 hidden lg:block">
      <div className="sticky top-20 rounded-notion bg-notion-bg border border-notion-border shadow-notion-sm overflow-hidden">
        {filterContent}
      </div>
    </aside>
  );
});

export default FilterPanel;
