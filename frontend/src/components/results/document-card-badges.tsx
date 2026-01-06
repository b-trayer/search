import { BookOpen, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DocumentCardBadgesProps {
  subjects: string[];
  documentType: string;
  language: string;
  query?: string;
}

function isSubjectMatchingQuery(subject: string, query: string): boolean {
  if (!query) return false;
  const subjectLower = subject.toLowerCase();
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  return queryWords.some(word => subjectLower.includes(word));
}

export function DocumentCardBadges({
  subjects,
  documentType,
  language,
  query = '',
}: DocumentCardBadgesProps) {
  return (
    <>
      {subjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {subjects.slice(0, 3).map((subject, idx) => {
            const isMatching = isSubjectMatchingQuery(subject, query);
            return (
              <Badge
                key={idx}
                variant="outline"
                className={`text-xs ${
                  isMatching
                    ? 'bg-notion-accent-light text-notion-accent border-notion-accent'
                    : 'bg-notion-bg-secondary text-notion-text-secondary border-notion-border'
                }`}
              >
                #{subject.length > 30 ? subject.slice(0, 30) + '...' : subject}
              </Badge>
            );
          })}
          {subjects.length > 3 && (
            <Badge variant="outline" className="text-xs text-notion-text-tertiary border-notion-border">
              +{subjects.length - 3}
            </Badge>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {documentType && (
          <Badge variant="secondary" className="text-xs">
            {documentType}
          </Badge>
        )}

        {language && (
          <Badge
            variant="outline"
            className="text-xs bg-notion-bg-secondary text-notion-text-tertiary border-notion-border"
          >
            <Globe className="h-3 w-3 mr-1" />
            {language}
          </Badge>
        )}
      </div>
    </>
  );
}
