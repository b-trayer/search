import { BookOpen, Globe, Tag, FileText, Database } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FilterSection, FilterPanelHeader, HasPdfCheckbox, getDocumentTypeLabel } from '@/components/filters';
import type { FilterOptions } from '@/lib/types';
import type { Filters } from '@/hooks/use-filters';

interface FilterContentProps {
  filterOptions: FilterOptions;
  filters: Filters;
  mergedDocTypes: { name: string; count: number }[];
  onToggle: (key: keyof Omit<Filters, 'has_pdf'>, name: string, checked: boolean) => void;
  onDocTypeToggle: (name: string, checked: boolean) => void;
  isDocTypeSelected: (name: string) => boolean;
  onReset: () => void;
  onHasPdfChange: (v: boolean | null) => void;
  totalSelected: number;
  variant: 'desktop' | 'mobile';
}

export const FilterContent = ({
  filterOptions, filters, mergedDocTypes, onToggle, onDocTypeToggle,
  isDocTypeSelected, onReset, onHasPdfChange, totalSelected, variant
}: FilterContentProps) => (
  <>
    {variant === 'desktop' && <FilterPanelHeader totalSelected={totalSelected} onReset={onReset} />}
    <ScrollArea className={variant === 'mobile' ? 'h-full' : 'h-[calc(100vh-200px)]'}>
      <div className="p-4 space-y-1">
        {filterOptions.sources.length > 0 && (
          <><FilterSection title="Источник" icon={Database} iconColor="text-blue-600" items={filterOptions.sources} selected={filters.sources} onToggle={(n, c) => onToggle('sources', n, c)} defaultOpen /><div className="border-t border-notion-border my-3" /></>
        )}
        {filterOptions.collections.length > 0 && (
          <><FilterSection title="Коллекция" icon={BookOpen} iconColor="text-notion-accent" items={filterOptions.collections} selected={filters.collections} onToggle={(n, c) => onToggle('collections', n, c)} /><div className="border-t border-notion-border my-3" /></>
        )}
        {mergedDocTypes.length > 0 && (
          <><FilterSection title="Тип документа" icon={FileText} iconColor="text-orange-600" items={mergedDocTypes} selected={mergedDocTypes.filter(i => isDocTypeSelected(i.name)).map(i => i.name)} onToggle={onDocTypeToggle} labelMapper={getDocumentTypeLabel} /><div className="border-t border-notion-border my-3" /></>
        )}
        {filterOptions.knowledge_areas.length > 0 && (
          <><FilterSection title="Область знания" icon={Tag} iconColor="text-green-600" items={filterOptions.knowledge_areas} selected={filters.knowledge_areas} onToggle={(n, c) => onToggle('knowledge_areas', n, c)} /><div className="border-t border-notion-border my-3" /></>
        )}
        {filterOptions.languages.length > 0 && (
          <><FilterSection title="Язык" icon={Globe} iconColor="text-purple-600" items={filterOptions.languages} selected={filters.languages} onToggle={(n, c) => onToggle('languages', n, c)} /><div className="border-t border-notion-border my-3" /></>
        )}
        <HasPdfCheckbox checked={filters.has_pdf} onChange={onHasPdfChange} count={filterOptions.has_pdf.with_pdf} />
      </div>
    </ScrollArea>
  </>
);
