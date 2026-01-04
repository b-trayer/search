import { useState, useEffect, useMemo } from 'react';
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
}

export default function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
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

  const handleToggle = (key: keyof Omit<Filters, 'has_pdf'>, name: string, checked: boolean) => {
    const updated = checked ? [...filters[key], name] : filters[key].filter((item) => item !== name);
    onFiltersChange({ ...filters, [key]: updated });
  };

  const handleDocTypeToggle = (canonicalName: string, checked: boolean) => {
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
  };

  const isDocTypeSelected = (canonicalName: string): boolean => {
    const allAliases = docTypeAliasMap.get(canonicalName) || [canonicalName];
    return allAliases.some((alias) => filters.document_types.includes(alias));
  };

  const handleReset = () => {
    onFiltersChange({
      collections: [], knowledge_areas: [], document_types: [],
      languages: [], sources: [], has_pdf: null,
    });
  };

  const totalSelected =
    filters.collections.length + filters.knowledge_areas.length + filters.document_types.length +
    filters.languages.length + filters.sources.length + (filters.has_pdf !== null ? 1 : 0);

  if (isLoading) return <FilterPanelSkeleton />;
  if (!filterOptions) return null;

  return (
    <aside className="w-72 shrink-0 hidden lg:block">
      <div className="sticky top-20 rounded-notion bg-notion-bg border border-notion-border shadow-notion-sm overflow-hidden">
        <FilterPanelHeader totalSelected={totalSelected} onReset={handleReset} />

        <ScrollArea className="h-[calc(100vh-200px)]">
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
            <HasPdfCheckbox checked={filters.has_pdf} onChange={(v) => onFiltersChange({ ...filters, has_pdf: v })} count={filterOptions.has_pdf.with_pdf} />
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}
