import { Loader2, Search } from "lucide-react";

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  isLoading?: boolean;
}

const SearchBar = ({ query, onQueryChange, onSearch, isLoading }: SearchBarProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className="flex w-full max-w-2xl items-center gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-notion-text-tertiary" />
        <input
          type="text"
          placeholder="Поиск книг, авторов..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-11 w-full rounded-notion border border-notion-border bg-notion-bg pl-9 pr-3 text-sm text-notion-text placeholder:text-notion-text-tertiary outline-none transition-colors hover:bg-notion-bg-hover focus:border-notion-accent focus:bg-notion-bg focus:ring-2 focus:ring-notion-accent/20"
        />
      </div>
      <button
        type="button"
        onClick={onSearch}
        disabled={isLoading || !query.trim()}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-notion border border-notion-text bg-notion-text px-4 text-sm font-medium text-white transition-colors hover:bg-notion-text/90 disabled:opacity-50 disabled:pointer-events-none"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">Найти</span>
      </button>
    </div>
  );
};

export default SearchBar;
