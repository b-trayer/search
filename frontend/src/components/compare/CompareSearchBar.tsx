import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CompareSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onCompare: () => void;
  isLoading: boolean;
}

export function CompareSearchBar({ query, onQueryChange, onCompare, isLoading }: CompareSearchBarProps) {
  return (
    <div className="flex gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-notion-text-tertiary" />
        <Input
          placeholder="Введите поисковый запрос для сравнения..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onCompare()}
          className="pl-10 border-notion-border focus:border-notion-accent"
        />
      </div>
      <Button
        onClick={onCompare}
        disabled={isLoading}
        className="bg-notion-accent hover:bg-notion-accent-hover"
      >
        {isLoading ? 'Загрузка...' : 'Сравнить'}
      </Button>
    </div>
  );
}
