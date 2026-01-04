import { Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FilterPanelHeaderProps {
  totalSelected: number;
  onReset: () => void;
}

export function FilterPanelHeader({ totalSelected, onReset }: FilterPanelHeaderProps) {
  return (
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
            onClick={onReset}
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
    </div>
  );
}
