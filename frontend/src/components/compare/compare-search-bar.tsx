import { Loader2, Search } from 'lucide-react';

interface CompareSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onCompare: () => void;
  isLoading: boolean;
}

export function CompareSearchBar({ query, onQueryChange, onCompare, isLoading }: CompareSearchBarProps) {
  return (
    <div className="flex w-full items-center gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-notion-text-tertiary" />
        <input
          type="text"
          placeholder="Введите запрос для сравнения..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onCompare()}
          className="h-11 w-full rounded-notion border border-notion-border bg-notion-bg pl-9 pr-3 text-sm text-notion-text placeholder:text-notion-text-tertiary outline-none transition-colors hover:bg-notion-bg-hover focus:border-notion-accent focus:bg-notion-bg focus:ring-2 focus:ring-notion-accent/20"
        />
      </div>
      <button
        type="button"
        onClick={onCompare}
        disabled={isLoading || !query.trim()}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-notion border border-notion-text bg-notion-text px-4 text-sm font-medium text-white transition-colors hover:bg-notion-text/90 disabled:opacity-50 disabled:pointer-events-none"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
        Сравнить
      </button>
    </div>
  );
}
