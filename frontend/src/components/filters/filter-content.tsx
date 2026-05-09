import { BookOpen, FileText, Globe, Layers, Tag } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FilterSection,
  FilterPanelHeader,
  HasPdfCheckbox,
  getDocumentTypeLabel,
  getDatabaseLabel,
} from '@/components/filters';
import { YearRangeSection } from '@/components/filters/year-range-section';
import { useTranslation } from '@/lib/i18n';
import type { FilterOptions } from '@/lib/types';
import type { Filters } from '@/hooks/use-filters';

interface FilterContentProps {
  filterOptions: FilterOptions;
  filters: Filters;
  mergedDocTypes: { name: string; count: number }[];
  onToggle: (
    key: 'collections' | 'knowledge_areas' | 'document_types' | 'languages' | 'sources' | 'databases',
    name: string,
    checked: boolean,
  ) => void;
  onDocTypeToggle: (name: string, checked: boolean) => void;
  isDocTypeSelected: (name: string) => boolean;
  onReset: () => void;
  onHasPdfChange: (v: boolean | null) => void;
  onYearRangeChange: (from: number | null, to: number | null) => void;
  totalSelected: number;
  variant: 'desktop' | 'mobile';
}

const MIN_OPTIONS_FOR_SECTION = 2;

function Divider() {
  return <div className="my-2 border-t border-notion-border" />;
}

export const FilterContent = ({
  filterOptions,
  filters,
  mergedDocTypes,
  onToggle,
  onDocTypeToggle,
  isDocTypeSelected,
  onReset,
  onHasPdfChange,
  onYearRangeChange,
  totalSelected,
  variant,
}: FilterContentProps) => {
  const { t } = useTranslation();
  const hasYearData =
    filterOptions.year_range.min !== null && filterOptions.year_range.max !== null;
  const hasDatabases = filterOptions.databases.length >= MIN_OPTIONS_FOR_SECTION;
  const hasDocTypes = mergedDocTypes.length >= MIN_OPTIONS_FOR_SECTION;
  const hasCollections = filterOptions.collections.length >= MIN_OPTIONS_FOR_SECTION;
  const hasKnowledgeAreas = filterOptions.knowledge_areas.length >= MIN_OPTIONS_FOR_SECTION;
  const hasLanguages = filterOptions.languages.length >= MIN_OPTIONS_FOR_SECTION;
  const hasPdfFilter = filterOptions.has_pdf.with_pdf > 0;

  return (
    <>
      {variant === 'desktop' && (
        <FilterPanelHeader totalSelected={totalSelected} onReset={onReset} />
      )}
      <ScrollArea className={variant === 'mobile' ? 'h-full' : 'h-[calc(100vh-200px)]'}>
        <div className="space-y-1 py-4 pl-4 pr-5">
          {hasYearData && (
            <>
              <YearRangeSection
                bounds={filterOptions.year_range}
                yearFrom={filters.year_from}
                yearTo={filters.year_to}
                onChange={onYearRangeChange}
              />
              <Divider />
            </>
          )}

          {hasDatabases && (
            <>
              <FilterSection
                title={t('filters.catalog')}
                icon={Layers}
                items={filterOptions.databases}
                selected={filters.databases}
                onToggle={(n, c) => onToggle('databases', n, c)}
                labelMapper={getDatabaseLabel}
                defaultOpen
              />
              <Divider />
            </>
          )}

          {hasDocTypes && (
            <>
              <FilterSection
                title={t('filters.docType')}
                icon={FileText}
                items={mergedDocTypes}
                selected={mergedDocTypes
                  .filter((i) => isDocTypeSelected(i.name))
                  .map((i) => i.name)}
                onToggle={onDocTypeToggle}
                labelMapper={getDocumentTypeLabel}
              />
              <Divider />
            </>
          )}

          {hasCollections && (
            <>
              <FilterSection
                title={t('filters.collection')}
                icon={BookOpen}
                items={filterOptions.collections}
                selected={filters.collections}
                onToggle={(n, c) => onToggle('collections', n, c)}
                defaultOpen={false}
              />
              <Divider />
            </>
          )}

          {hasKnowledgeAreas && (
            <>
              <FilterSection
                title={t('filters.knowledgeAreas')}
                icon={Tag}
                items={filterOptions.knowledge_areas}
                selected={filters.knowledge_areas}
                onToggle={(n, c) => onToggle('knowledge_areas', n, c)}
                defaultOpen={false}
              />
              <Divider />
            </>
          )}

          {hasLanguages && (
            <>
              <FilterSection
                title={t('filters.languages')}
                icon={Globe}
                items={filterOptions.languages}
                selected={filters.languages}
                onToggle={(n, c) => onToggle('languages', n, c)}
                defaultOpen={false}
              />
              <Divider />
            </>
          )}

          {hasPdfFilter && (
            <HasPdfCheckbox
              checked={filters.has_pdf}
              onChange={onHasPdfChange}
              count={filterOptions.has_pdf.with_pdf}
            />
          )}
        </div>
      </ScrollArea>
    </>
  );
};
