import { Book, User, Calendar, Building, Eye, MousePointer, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export interface BookResult {
  document_id: string;
  title: string;
  authors: string;
  year: number | null;
  organization: string;
  collection: string;
  subject_area: string;
  url: string;
  cover: string;
  language: string;
  publication_info: string;
  base_score: number;
  log_bm25: number;
  f_type: number;
  f_topic: number;
  f_user: number;
  smoothed_ctr: number;
  ctr_factor: number;
  ctr_boost: number;
  final_score: number;
  position: number;
  clicks: number;
  impressions: number;
}

interface BookCardProps {
  book: BookResult;
  onSelect: (book: BookResult) => void;
  isSelected: boolean;
}

const BookCard = ({ book, onSelect, isSelected }: BookCardProps) => {
  const [showScoreDetails, setShowScoreDetails] = useState(false);

  const coverColors = [
    "from-primary/80 to-library-brown",
    "from-library-amber to-primary",
    "from-accent to-library-brown",
    "from-library-gold to-primary/70",
  ];

  const colorIndex = book.document_id.charCodeAt(0) % coverColors.length;
  const coverGradient = coverColors[colorIndex];

  const ctrPercent = book.smoothed_ctr * 100;

  const toggleScoreDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowScoreDetails(!showScoreDetails);
  };

  return (
    <article
      className={`group flex gap-4 rounded-xl bg-card p-4 shadow-card transition-all duration-300 hover:shadow-soft hover:-translate-y-1 cursor-pointer animate-fade-in ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={() => onSelect(book)}
    >
      <div
        className={`h-40 w-28 shrink-0 rounded-lg bg-gradient-to-br ${coverGradient} flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-105`}
      >
        {book.cover ? (
          <img src={book.cover} alt={book.title} className="h-full w-full object-cover rounded-lg" />
        ) : (
          <Book className="h-10 w-10 text-primary-foreground/80" />
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {book.title}
            </h3>
            <Badge variant="outline" className="shrink-0 text-xs">
              #{book.position}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {book.authors && (
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {book.authors}
              </span>
            )}
            {book.year && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {book.year}
              </span>
            )}
            {book.organization && (
              <span className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                {book.organization}
              </span>
            )}
          </div>

          {book.subject_area && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {book.subject_area}
            </p>
          )}
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            {book.collection && (
              <Badge variant="outline" className="text-xs border-border">
                {book.collection}
              </Badge>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1" title="Показы">
                <Eye className="h-3.5 w-3.5" />
                {book.impressions}
              </span>
              <span className="flex items-center gap-1" title="Клики">
                <MousePointer className="h-3.5 w-3.5" />
                {book.clicks}
              </span>
              <Badge variant="secondary" className="text-xs">
                CTR: {ctrPercent.toFixed(1)}%
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={toggleScoreDetails}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Score: {book.final_score.toFixed(2)}
              {showScoreDetails ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          </div>

          {showScoreDetails && (
            <div className="p-2 bg-muted/50 rounded-lg text-xs font-mono space-y-1" onClick={(e) => e.stopPropagation()}>
              <div className="text-muted-foreground mb-2">
                score = log(1+BM25) + w<sub>u</sub>·f(U,D) + β·log(1+CTR)
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span>log(1+BM25):</span>
                <span className="text-right">{book.log_bm25.toFixed(3)}</span>
                <span>f_type:</span>
                <span className="text-right">{book.f_type.toFixed(3)}</span>
                <span>f_topic:</span>
                <span className="text-right">{book.f_topic.toFixed(3)}</span>
                <span>f_user:</span>
                <span className="text-right">{book.f_user.toFixed(3)}</span>
                <span>ctr_factor:</span>
                <span className="text-right">{book.ctr_factor.toFixed(3)}</span>
                <div className="col-span-2 border-t border-border my-1"></div>
                <span className="font-semibold">Final:</span>
                <span className="text-right font-semibold">{book.final_score.toFixed(3)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default BookCard;
