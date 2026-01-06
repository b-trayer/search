import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { BookCover, BookMeta, BookStats, ScoreDetails } from "@/components/book";

export interface BookResult {
  document_id: string; title: string; authors: string; year: number | null; organization: string;
  collection: string; subject_area: string; url: string; cover: string; language: string;
  publication_info: string; base_score: number; log_bm25: number; f_type: number; f_topic: number;
  f_user: number; user_contrib: number; smoothed_ctr: number; ctr_factor: number; ctr_contrib: number;
  ctr_boost: number; final_score: number; position: number; clicks: number; impressions: number;
  display_ctr?: number; weights?: { w_user: number; alpha_type: number; alpha_topic: number; beta_ctr: number };
}

interface BookCardProps { book: BookResult; onSelect: (book: BookResult) => void; isSelected: boolean; }

const BookCard = ({ book, onSelect, isSelected }: BookCardProps) => {
  const [showScoreDetails, setShowScoreDetails] = useState(false);
  const toggleScoreDetails = (e: React.MouseEvent) => { e.stopPropagation(); setShowScoreDetails(!showScoreDetails); };

  return (
    <article className={`group flex gap-4 rounded-xl bg-card p-4 shadow-card transition-all duration-300 hover:shadow-soft hover:-translate-y-1 cursor-pointer animate-fade-in ${isSelected ? "ring-2 ring-primary" : ""}`} onClick={() => onSelect(book)}>
      <BookCover documentId={book.document_id} title={book.title} coverUrl={book.cover} />
      <div className="flex flex-1 flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">{book.title}</h3>
            <Badge variant="outline" className="shrink-0 text-xs">#{book.position}</Badge>
          </div>
          <BookMeta authors={book.authors} year={book.year} organization={book.organization} />
          {book.subject_area && <p className="text-sm text-muted-foreground line-clamp-2">{book.subject_area}</p>}
        </div>
        <div className="mt-3 space-y-2">
          <BookStats impressions={book.impressions} clicks={book.clicks} displayCtr={book.display_ctr} collection={book.collection} />
          <ScoreDetails isOpen={showScoreDetails} onToggle={toggleScoreDetails} finalScore={book.final_score} logBm25={book.log_bm25} userContrib={book.user_contrib} ctrContrib={book.ctr_contrib} fType={book.f_type} fTopic={book.f_topic} fUser={book.f_user} ctrFactor={book.ctr_factor} smoothedCtr={book.smoothed_ctr} weights={book.weights} />
        </div>
      </div>
    </article>
  );
};

export default BookCard;
