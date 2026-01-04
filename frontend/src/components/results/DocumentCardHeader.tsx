import { User } from 'lucide-react';
import { highlightText } from '@/lib/highlight';
import { parseAuthors, formatOtherAuthors } from '@/lib/utils';

interface DocumentCardHeaderProps {
  title: string;
  authors: string;
  query: string;
  highlights?: Record<string, string[]>;
}

export function DocumentCardHeader({
  title,
  authors,
  query,
  highlights,
}: DocumentCardHeaderProps) {
  const { mainAuthor, otherAuthors } = parseAuthors(authors);

  return (
    <>
      <h3 className="font-medium text-lg text-notion-text line-clamp-2 group-hover:text-notion-accent transition-colors">
        {highlightText(title, query)}
      </h3>

      {mainAuthor && (
        <div className="flex items-start gap-2 text-sm">
          <User className="h-4 w-4 flex-shrink-0 mt-0.5 text-notion-text-secondary" />
          <div>
            {highlights?.authors?.[0] ? (
              <span
                className="font-medium text-notion-text [&_mark]:bg-yellow-200 [&_mark]:px-0.5 [&_mark]:rounded"
                dangerouslySetInnerHTML={{ __html: highlights.authors.join(', ') }}
              />
            ) : (
              <span className="font-medium text-notion-text">{highlightText(mainAuthor, query)}</span>
            )}
            {otherAuthors.length > 0 && (
              <span className="text-notion-text-tertiary">
                {', '}{formatOtherAuthors(otherAuthors)}
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
