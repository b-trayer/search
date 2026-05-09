import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { FilterItem } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';

interface FilterSectionProps {
  title: string;
  icon: React.ElementType;
  items: FilterItem[];
  selected: string[];
  onToggle: (name: string, checked: boolean) => void;
  defaultOpen?: boolean;
  labelMapper?: (name: string) => string;
  searchThreshold?: number;
  collapseThreshold?: number;
}

const DEFAULT_SEARCH_THRESHOLD = 10;
const DEFAULT_COLLAPSE_THRESHOLD = 7;

export default function FilterSection({
  title,
  icon: Icon,
  items,
  selected,
  onToggle,
  defaultOpen = true,
  labelMapper,
  searchThreshold = DEFAULT_SEARCH_THRESHOLD,
  collapseThreshold = DEFAULT_COLLAPSE_THRESHOLD,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const { t, formatNumber } = useTranslation();

  const showSearch = items.length > searchThreshold;

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) => {
      const label = labelMapper ? labelMapper(item.name) : item.name;
      return (
        label.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q)
      );
    });
  }, [items, search, labelMapper]);

  const visibleItems = useMemo(() => {
    if (showAll || search.trim() || filteredItems.length <= collapseThreshold) {
      return filteredItems;
    }
    const selectedSet = new Set(selected);
    const top = filteredItems.slice(0, collapseThreshold);
    const topNames = new Set(top.map((i) => i.name));
    const selectedOutside = filteredItems.filter(
      (i) => selectedSet.has(i.name) && !topNames.has(i.name),
    );
    return [...top, ...selectedOutside];
  }, [filteredItems, showAll, search, selected, collapseThreshold]);

  const hiddenCount = filteredItems.length - visibleItems.length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="group flex w-full items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-notion-text-tertiary" />
            <span className="text-sm font-medium text-notion-text">{title}</span>
            {selected.length > 0 && (
              <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-notion bg-notion-bg-secondary px-1.5 text-[11px] tabular-nums text-notion-text-secondary">
                {selected.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs tabular-nums text-notion-text-tertiary">{items.length}</span>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-notion-text-tertiary transition-colors group-hover:text-notion-text" />
            ) : (
              <ChevronRight className="h-4 w-4 text-notion-text-tertiary transition-colors group-hover:text-notion-text" />
            )}
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {showSearch && (
          <div className="relative mb-1">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-notion-text-tertiary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('filters.searchInListPlaceholder', { title })}
              aria-label={t('filters.searchInListAria', { title })}
              className="h-8 w-full rounded-notion border border-notion-border bg-notion-bg pl-7 pr-7 text-xs text-notion-text placeholder:text-notion-text-tertiary focus:border-notion-border-strong focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label={t('filters.clearSearch')}
                className="absolute right-1 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-notion text-notion-text-tertiary transition-colors hover:bg-notion-bg-hover hover:text-notion-text"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
        <div className="space-y-0.5 pb-2">
          {visibleItems.length === 0 && (
            <div className="px-2 py-3 text-center text-xs text-notion-text-tertiary">
              {t('filters.notFound')}
            </div>
          )}
          {visibleItems.map((item) => {
            const isSelected = selected.includes(item.name);
            return (
              <label
                key={item.name}
                className={`flex cursor-pointer items-center gap-2 rounded-notion px-2 py-1.5 transition-colors ${
                  isSelected ? 'bg-notion-bg-secondary' : 'hover:bg-notion-bg-hover'
                }`}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => onToggle(item.name, checked as boolean)}
                  className="h-3.5 w-3.5 rounded-[3px] border-notion-border-strong data-[state=checked]:border-notion-text data-[state=checked]:bg-notion-text"
                />
                <span
                  className={`flex-1 truncate text-sm ${
                    isSelected ? 'font-medium text-notion-text' : 'text-notion-text-secondary'
                  }`}
                  title={labelMapper ? labelMapper(item.name) : item.name}
                >
                  {labelMapper ? labelMapper(item.name) : item.name}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-notion-text-tertiary">
                  {formatNumber(item.count)}
                </span>
              </label>
            );
          })}
          {hiddenCount > 0 && !search.trim() && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-1 inline-flex h-7 items-center rounded-notion px-2 text-xs text-notion-text-secondary transition-colors hover:bg-notion-bg-hover hover:text-notion-text"
            >
              {t('filters.showMore', { count: formatNumber(hiddenCount) })}
            </button>
          )}
          {showAll && filteredItems.length > collapseThreshold && !search.trim() && (
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className="mt-1 inline-flex h-7 items-center rounded-notion px-2 text-xs text-notion-text-secondary transition-colors hover:bg-notion-bg-hover hover:text-notion-text"
            >
              {t('filters.collapse')}
            </button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
