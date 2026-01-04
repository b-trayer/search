import { BookOpen, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DocumentCardBadgesProps {
  subjects: string[];
  documentType: string;
  language: string;
}

export function DocumentCardBadges({
  subjects,
  documentType,
  language,
}: DocumentCardBadgesProps) {
  return (
    <>
      {subjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {subjects.slice(0, 3).map((subject, idx) => (
            <Badge
              key={idx}
              variant="outline"
              className="text-xs bg-notion-bg-secondary text-notion-text-secondary border-notion-border"
            >
              <BookOpen className="h-3 w-3 mr-1" />
              {subject.length > 30 ? subject.slice(0, 30) + '...' : subject}
            </Badge>
          ))}
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
