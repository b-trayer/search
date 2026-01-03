
import { BookOpen, Globe, Tag, RotateCcw, Filter, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FilterSection, FilterBadges } from '@/components/filters';
import { COLLECTIONS, SUBJECTS, LANGUAGES } from '@/lib/filter-data';
import type { Filters } from '@/hooks/use-filters';

interface FilterPanelProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export default function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  const handleToggle = (
    key: keyof Filters,
    name: string,
    checked: boolean
  ) => {
    const updated = checked
      ? [...filters[key], name]
      : filters[key].filter((item) => item !== name);
    onFiltersChange({ ...filters, [key]: updated });
  };

  const handleReset = () => {
    onFiltersChange({ collections: [], subjects: [], languages: [] });
  };

  const totalSelected =
    filters.collections.length + filters.subjects.length + filters.languages.length;

  return (
    <aside className="w-72 shrink-0 hidden lg:block">
      <div className="sticky top-20 rounded-notion bg-notion-bg border border-notion-border shadow-notion-sm overflow-hidden">
        {}
        <div className="p-4 border-b border-notion-border bg-notion-bg-secondary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-notion-text" />
              <h2 className="font-medium text-notion-text">Фильтры</h2>
            </div>
            {totalSelected > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-7 px-2 text-xs text-notion-text-secondary hover:text-red-600 hover:bg-red-50"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Сбросить
                <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                  {totalSelected}
                </Badge>
              </Button>
            )}
          </div>

          <FilterBadges
            filters={filters}
            onRemoveCollection={(name) => handleToggle('collections', name, false)}
            onRemoveSubject={(name) => handleToggle('subjects', name, false)}
          />
        </div>

        {}
        <ScrollArea className="h-[calc(100vh-220px)]">
          <div className="p-4 space-y-1">
            <FilterSection
              title="Коллекция"
              icon={BookOpen}
              iconColor="text-notion-accent"
              items={COLLECTIONS}
              selected={filters.collections}
              onToggle={(name, checked) => handleToggle('collections', name, checked)}
              defaultOpen={true}
            />

            <div className="border-t border-notion-border my-3" />

            <FilterSection
              title="Область знания"
              icon={Tag}
              iconColor="text-green-600"
              items={SUBJECTS}
              selected={filters.subjects}
              onToggle={(name, checked) => handleToggle('subjects', name, checked)}
              defaultOpen={false}
            />

            <div className="border-t border-notion-border my-3" />

            <FilterSection
              title="Язык"
              icon={Globe}
              iconColor="text-purple-600"
              items={LANGUAGES}
              selected={filters.languages}
              onToggle={(name, checked) => handleToggle('languages', name, checked)}
              defaultOpen={false}
            />
          </div>
        </ScrollArea>

        {}
        <div className="p-3 border-t border-notion-border bg-notion-bg-secondary">
          <div className="flex items-center gap-2 text-xs text-notion-text-tertiary">
            <Sparkles className="h-3 w-3" />
            <span>Фильтры работают с персонализацией</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
