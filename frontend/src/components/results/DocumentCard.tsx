
import {
  User,
  ExternalLink,
  Building,
  Globe,
  Calendar,
  BookOpen,
  Eye,
  MousePointerClick,
  Database,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { registerClick } from '@/lib/api';
import { highlightText } from '@/lib/highlight';
import type { DocumentResult, UserProfile } from '@/lib/types';

interface DocumentCardProps {
  doc: DocumentResult;
  position: number;
  query: string;
  userId?: number | null;
  userProfile?: UserProfile | null;
  onDocumentClick?: (doc: DocumentResult) => void;
}

export default function DocumentCard({
  doc,
  position,
  query,
  userId,
  userProfile,
  onDocumentClick,
}: DocumentCardProps) {
  const handleClick = async () => {
    if (userId) {
      await registerClick({
        query,
        user_id: userId,
        document_id: doc.document_id,
        position,
      });
    }
    onDocumentClick?.(doc);
  };

  // Parse authors - first author is main
  const authorsStr = doc.authors || '';
  const authorsList = authorsStr.split(',').map(a => a.trim()).filter(Boolean);
  const mainAuthor = authorsList[0] || '';
  const otherAuthors = authorsList.slice(1);

  const organization = doc.organization || '';
  const language = doc.language || '';
  const year = doc.year;
  const documentType = doc.document_type || '';
  const subjects = doc.subjects || [];
  const source = doc.source || '';

  // CTR calculation
  const ctr = doc.impressions > 0 ? (doc.clicks / doc.impressions * 100) : 0;

  return (
    <article
      onClick={handleClick}
      className="group relative rounded-notion bg-notion-bg p-5 shadow-notion-sm border border-notion-border cursor-pointer
        transition-all duration-200 hover:shadow-notion-md hover:-translate-y-0.5 hover:border-notion-border-strong"
    >
      <div className="flex gap-4">
        {/* Position number */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-notion flex items-center justify-center font-bold text-lg bg-notion-bg-secondary text-notion-text-secondary group-hover:bg-notion-bg-hover">
            {position}
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          {/* Title */}
          <h3 className="font-medium text-lg text-notion-text line-clamp-2 group-hover:text-notion-accent transition-colors">
            {highlightText(doc.title, query)}
          </h3>

          {/* Authors */}
          {mainAuthor && (
            <div className="flex items-start gap-2 text-sm">
              <User className="h-4 w-4 flex-shrink-0 mt-0.5 text-notion-text-secondary" />
              <div>
                <span className="font-medium text-notion-text">{highlightText(mainAuthor, query)}</span>
                {otherAuthors.length > 0 && (
                  <span className="text-notion-text-tertiary">
                    {', '}
                    {otherAuthors.length <= 2
                      ? otherAuthors.join(', ')
                      : `${otherAuthors.slice(0, 2).join(', ')} и ещё ${otherAuthors.length - 2}`
                    }
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Source & Year row */}
          <div className="flex items-center gap-4 text-sm text-notion-text-secondary">
            {source && (
              <div className="flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5" />
                <span>{source}</span>
              </div>
            )}
            {year && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{year}</span>
              </div>
            )}
          </div>

          {/* Organization */}
          {organization && (
            <div className="flex items-center gap-2 text-sm text-notion-text-tertiary">
              <Building className="h-4 w-4 flex-shrink-0" />
              <span className="line-clamp-1">{organization}</span>
            </div>
          )}

          {/* Subjects */}
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

          {/* Bottom row: document type, language, CTR stats */}
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

            {/* CTR & Impressions stats */}
            {doc.impressions > 0 && (
              <>
                <div className="flex items-center gap-1 text-xs text-notion-text-tertiary ml-auto">
                  <Eye className="h-3 w-3" />
                  <span>{doc.impressions}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-notion-text-tertiary">
                  <MousePointerClick className="h-3 w-3" />
                  <span>{doc.clicks}</span>
                  <span className="text-notion-text-secondary">({ctr.toFixed(1)}%)</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* External link icon */}
        {doc.url && (
          <div className="flex-shrink-0 self-start opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="h-5 w-5 text-notion-accent" />
          </div>
        )}
      </div>
    </article>
  );
}
