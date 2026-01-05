import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import FilterPanel from '@/components/filter-panel';
import type { Filters } from '@/hooks/use-filters';

interface MobileFilterSheetProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function MobileFilterSheet({ filters, onFiltersChange }: MobileFilterSheetProps) {
  const [open, setOpen] = useState(false);

  const totalSelected =
    filters.collections.length +
    filters.knowledge_areas.length +
    filters.document_types.length +
    filters.languages.length +
    filters.sources.length +
    (filters.has_pdf !== null ? 1 : 0);

  const handleReset = () => {
    onFiltersChange({
      collections: [],
      knowledge_areas: [],
      document_types: [],
      languages: [],
      sources: [],
      has_pdf: null,
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden gap-2 rounded-notion"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Фильтры
          {totalSelected > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-notion-accent text-white rounded-full">
              {totalSelected}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px] p-0 bg-notion-bg">
        <SheetHeader className="p-4 border-b border-notion-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-notion-text">Фильтры</SheetTitle>
            {totalSelected > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-notion-text-secondary hover:text-notion-text"
              >
                <X className="h-4 w-4 mr-1" />
                Сбросить ({totalSelected})
              </Button>
            )}
          </div>
        </SheetHeader>
        <div className="h-[calc(100vh-80px)] overflow-y-auto">
          <FilterPanel filters={filters} onFiltersChange={onFiltersChange} variant="mobile" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
