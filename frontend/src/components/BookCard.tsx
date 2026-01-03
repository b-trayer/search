import { Book, User, Calendar, Building, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface BookResult {
  id: string;
  title: string;
  author: string;
  year: number;
  publisher: string;
  isbn: string;
  category: string;
  description: string;
  available: boolean;
  coverColor?: string;
}

interface BookCardProps {
  book: BookResult;
  onSelect: (book: BookResult) => void;
  isSelected: boolean;
}

const BookCard = ({ book, onSelect, isSelected }: BookCardProps) => {
  const coverColors = [
    "from-primary/80 to-library-brown",
    "from-library-amber to-primary",
    "from-accent to-library-brown",
    "from-library-gold to-primary/70",
  ];

  const colorIndex = book.id.charCodeAt(0) % coverColors.length;
  const coverGradient = coverColors[colorIndex];

  return (
    <article
      className={`group flex gap-4 rounded-xl bg-card p-4 shadow-card transition-all duration-300 hover:shadow-soft hover:-translate-y-1 cursor-pointer animate-fade-in ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={() => onSelect(book)}
    >
      {}
      <div
        className={`h-40 w-28 shrink-0 rounded-lg bg-gradient-to-br ${coverGradient} flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-105`}
      >
        <Book className="h-10 w-10 text-primary-foreground/80" />
      </div>

      {}
      <div className="flex flex-1 flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {book.title}
            </h3>
            <Badge
              variant={book.available ? "default" : "secondary"}
              className={`shrink-0 ${
                book.available
                  ? "bg-green-600/10 text-green-700 border-green-200"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {book.available ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  В наличии
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3 mr-1" />
                  Занята
                </>
              )}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {book.author}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {book.year}
            </span>
            <span className="flex items-center gap-1">
              <Building className="h-4 w-4" />
              {book.publisher}
            </span>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {book.description}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <Badge variant="outline" className="text-xs border-border">
            {book.category}
          </Badge>
          <span className="text-xs text-muted-foreground">
            ISBN: {book.isbn}
          </span>
        </div>
      </div>
    </article>
  );
};

export default BookCard;
