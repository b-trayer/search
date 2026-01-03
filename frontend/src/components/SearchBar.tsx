import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  isLoading?: boolean;
}

const SearchBar = ({ query, onQueryChange, onSearch, isLoading }: SearchBarProps) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className="flex w-full max-w-2xl gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Поиск книг, авторов, ISBN..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyPress}
          className="h-14 pl-12 pr-4 text-base shadow-card border-2 border-border focus:border-primary"
        />
      </div>
      <Button 
        variant="search" 
        size="lg" 
        onClick={onSearch}
        disabled={isLoading}
        className="h-14 px-8"
      >
        {isLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
        ) : (
          <>
            <Search className="h-5 w-5" />
            <span>Найти</span>
          </>
        )}
      </Button>
    </div>
  );
};

export default SearchBar;
