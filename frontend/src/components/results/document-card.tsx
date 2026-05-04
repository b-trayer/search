import { useState, memo, useCallback } from 'react';
import { ExternalLink } from 'lucide-react';
import { formatBadgeText, uniqueBadges } from '@/lib/utils';
import type { DocumentResult } from '@/lib/types';
import { DocumentCardHeader } from './document-card-header';
import { DocumentCardBadges } from './document-card-badges';
import { DocumentCardStats } from './document-card-stats';
import { DocumentScoreDetails } from './document-score-details';
import { DocumentCardMeta } from './document-card-meta';
import { PositionChip } from './position-chip';

interface DocumentCardProps {
  doc: DocumentResult;
  position: number;
  query: string;
  onDocumentClick?: (doc: DocumentResult) => void;
}

const DocumentCard = memo(function DocumentCard({ doc, position, query, onDocumentClick }: DocumentCardProps) {
  const [showScoreDetails, setShowScoreDetails] = useState(false);
  const handleClick = useCallback(() => onDocumentClick?.(doc), [doc, onDocumentClick]);
  const toggleScoreDetails = useCallback(() => setShowScoreDetails(prev => !prev), []);

  return (
    <article
      onClick={handleClick}
      className="group relative rounded-notion bg-notion-bg p-5 shadow-notion-sm border border-notion-border cursor-pointer transition-shadow duration-200 hover:shadow-notion-md hover:border-notion-border-strong"
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <PositionChip n={position} size="lg" className="group-hover:bg-notion-bg-hover" />
        </div>
        <div className="flex-1 min-w-0 space-y-2.5">
          <DocumentCardHeader title={doc.title} authors={doc.authors} query={query} highlights={doc.highlights} />
          <DocumentCardMeta
            source={doc.source || ''}
            year={doc.year}
            organization={doc.organization || ''}
            collection={doc.collection || ''}
          />
          <DocumentCardBadges
            subjects={uniqueBadges(doc.subjects || [])}
            documentType={formatBadgeText(doc.document_type || '')}
            language={formatBadgeText(doc.language || '')}
            query={query}
          />
          <DocumentCardStats impressions={doc.impressions} clicks={doc.clicks} />
          <DocumentScoreDetails doc={doc} isExpanded={showScoreDetails} onToggle={toggleScoreDetails} />
        </div>
        {doc.url && (
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center self-start text-notion-accent transition-opacity lg:opacity-0 lg:group-hover:opacity-100"
            aria-hidden="true"
          >
            <ExternalLink className="h-4 w-4" />
          </div>
        )}
      </div>
    </article>
  );
});

export default DocumentCard;
