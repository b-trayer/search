
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { FilterItem } from '@/lib/filter-data';

interface FilterSectionProps {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  items: FilterItem[];
  selected: string[];
  onToggle: (name: string, checked: boolean) => void;
  defaultOpen?: boolean;
}

export default function FilterSection({
  title,
  icon: Icon,
  iconColor,
  items,
  selected,
  onToggle,
  defaultOpen = true,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full py-2 group">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${iconColor}`} />
            <span className="text-sm font-medium text-notion-text">{title}</span>
            {selected.length > 0 && (
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[10px] bg-notion-accent-light text-notion-accent"
              >
                {selected.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-notion-text-tertiary">{items.length}</span>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-notion-text-tertiary group-hover:text-notion-text transition-colors" />
            ) : (
              <ChevronRight className="h-4 w-4 text-notion-text-tertiary group-hover:text-notion-text transition-colors" />
            )}
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1 pb-3">
          {items.map((item) => {
            const isSelected = selected.includes(item.name);
            return (
              <label
                key={item.name}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-notion cursor-pointer transition-colors ${
                  isSelected ? 'bg-notion-accent-light' : 'hover:bg-notion-bg-hover'
                }`}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => onToggle(item.name, checked as boolean)}
                  className="data-[state=checked]:bg-notion-accent data-[state=checked]:border-notion-accent"
                />
                <span
                  className={`text-sm flex-1 ${
                    isSelected ? 'text-notion-text font-medium' : 'text-notion-text-secondary'
                  }`}
                >
                  {item.name}
                </span>
                <span className="text-xs text-notion-text-tertiary tabular-nums">
                  {item.count.toLocaleString()}
                </span>
              </label>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
