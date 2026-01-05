import { Book } from "lucide-react";

const COVER_COLORS = [
  "from-primary/80 to-library-brown",
  "from-library-amber to-primary",
  "from-accent to-library-brown",
  "from-library-gold to-primary/70",
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

interface BookCoverProps {
  documentId: string;
  title: string;
  coverUrl?: string;
}

const BookCover = ({ documentId, title, coverUrl }: BookCoverProps) => {
  const colorIndex = hashCode(documentId) % COVER_COLORS.length;
  const coverGradient = COVER_COLORS[colorIndex];

  return (
    <div
      className={`h-40 w-28 shrink-0 rounded-lg bg-gradient-to-br ${coverGradient} flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-105`}
    >
      {coverUrl ? (
        <img src={coverUrl} alt={title} className="h-full w-full object-cover rounded-lg" />
      ) : (
        <Book className="h-10 w-10 text-primary-foreground/80" />
      )}
    </div>
  );
};

export default BookCover;
