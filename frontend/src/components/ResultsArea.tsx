import { BookOpen, SearchX } from "lucide-react";
import BookCard, { BookResult } from "./BookCard";

interface ResultsAreaProps {
  results: BookResult[];
  selectedBook: BookResult | null;
  onSelectBook: (book: BookResult) => void;
  hasSearched: boolean;
  isLoading: boolean;
}

const ResultsArea = ({
  results,
  selectedBook,
  onSelectBook,
  hasSearched,
  isLoading,
}: ResultsAreaProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <div className="relative">
            <BookOpen className="h-16 w-16 animate-pulse-soft text-primary/50" />
          </div>
          <p className="text-lg font-medium">Поиск книг...</p>
        </div>
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4 text-muted-foreground text-center max-w-md">
          <BookOpen className="h-20 w-20 text-primary/30" />
          <div>
            <h3 className="font-display text-2xl font-semibold text-foreground mb-2">
              Добро пожаловать в библиотеку
            </h3>
            <p className="text-muted-foreground">
              Введите название книги, автора или ISBN в поисковую строку для начала поиска
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4 text-muted-foreground text-center max-w-md">
          <SearchX className="h-16 w-16 text-muted-foreground/50" />
          <div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              Ничего не найдено
            </h3>
            <p className="text-muted-foreground">
              Попробуйте изменить поисковый запрос или сбросить фильтры
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Найдено: <span className="font-medium text-foreground">{results.length}</span> книг
        </p>
      </div>

      <div className="grid gap-4">
        {results.map((book, index) => (
          <div
            key={book.document_id}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <BookCard
              book={book}
              onSelect={onSelectBook}
              isSelected={selectedBook?.document_id === book.document_id}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsArea;
