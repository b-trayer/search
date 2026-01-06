import { useState, memo, useCallback } from 'react';
import { ExternalLink } from 'lucide-react';
import { formatBadgeText, uniqueBadges } from '@/lib/utils';
import type { DocumentResult } from '@/lib/types';
import { DocumentCardHeader } from './document-card-header';
import { DocumentCardBadges } from './document-card-badges';
import { DocumentCardStats } from './document-card-stats';
import { DocumentScoreDetails } from './document-score-details';
import { DocumentCardMeta } from './document-card-meta';

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
    <article onClick={handleClick} className="group relative rounded-notion bg-notion-bg p-5 shadow-notion-sm border border-notion-border cursor-pointer transition-all duration-200 hover:shadow-notion-md hover:-translate-y-0.5 hover:border-notion-border-strong">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-notion flex items-center justify-center font-bold text-lg bg-notion-bg-secondary text-notion-text-secondary group-hover:bg-notion-bg-hover">{position}</div>
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <DocumentCardHeader title={doc.title} authors={doc.authors} query={query} highlights={doc.highlights} />
          <DocumentCardMeta source={doc.source || ''} year={doc.year} organization={doc.organization || ''} collection={doc.collection || ''} />
          <DocumentCardBadges subjects={uniqueBadges(doc.subjects || [])} documentType={formatBadgeText(doc.document_type || '')} language={formatBadgeText(doc.language || '')} query={query} />
          <div className="flex flex-wrap items-center gap-2 pt-1"><DocumentCardStats impressions={doc.impressions} clicks={doc.clicks} /></div>
          <DocumentScoreDetails doc={doc} isExpanded={showScoreDetails} onToggle={toggleScoreDetails} />
        </div>
        {doc.url && <div className="flex-shrink-0 self-start opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink className="h-5 w-5 text-notion-accent" /></div>}
      </div>
    </article>
  );
});

export default DocumentCard;
