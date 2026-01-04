import { useState } from 'react';
import { ExternalLink, Building, Database, Calendar } from 'lucide-react';
import { formatBadgeText, uniqueBadges } from '@/lib/utils';
import type { DocumentResult, UserProfile } from '@/lib/types';
import { DocumentCardHeader } from './DocumentCardHeader';
import { DocumentCardBadges } from './DocumentCardBadges';
import { DocumentCardStats } from './DocumentCardStats';
import { DocumentScoreDetails } from './DocumentScoreDetails';

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
  onDocumentClick,
}: DocumentCardProps) {
  const [showScoreDetails, setShowScoreDetails] = useState(false);

  const handleClick = () => {
    onDocumentClick?.(doc);
  };

  const organization = doc.organization || '';
  const language = formatBadgeText(doc.language || '');
  const year = doc.year;
  const documentType = formatBadgeText(doc.document_type || '');
  const subjects = uniqueBadges(doc.subjects || []);
  const source = doc.source || '';

  return (
    <article
      onClick={handleClick}
      className="group relative rounded-notion bg-notion-bg p-5 shadow-notion-sm border border-notion-border cursor-pointer
        transition-all duration-200 hover:shadow-notion-md hover:-translate-y-0.5 hover:border-notion-border-strong"
    >
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-notion flex items-center justify-center font-bold text-lg bg-notion-bg-secondary text-notion-text-secondary group-hover:bg-notion-bg-hover">
            {position}
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <DocumentCardHeader
            title={doc.title}
            authors={doc.authors}
            query={query}
            highlights={doc.highlights}
          />

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

          {organization && (
            <div className="flex items-center gap-2 text-sm text-notion-text-tertiary">
              <Building className="h-4 w-4 flex-shrink-0" />
              <span className="line-clamp-1">{organization}</span>
            </div>
          )}

          <DocumentCardBadges
            subjects={subjects}
            documentType={documentType}
            language={language}
          />

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <DocumentCardStats
              impressions={doc.impressions}
              clicks={doc.clicks}
            />
          </div>

          <DocumentScoreDetails
            doc={doc}
            isExpanded={showScoreDetails}
            onToggle={() => setShowScoreDetails(!showScoreDetails)}
          />
        </div>

        {doc.url && (
          <div className="flex-shrink-0 self-start opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="h-5 w-5 text-notion-accent" />
          </div>
        )}
      </div>
    </article>
  );
}
