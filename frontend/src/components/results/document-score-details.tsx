import { ChevronDown, ChevronUp } from 'lucide-react';
import type { DocumentResult } from '@/lib/types';
import { ScoreBreakdown } from './score-breakdown';

interface DocumentScoreDetailsProps {
  doc: DocumentResult;
  isExpanded: boolean;
  onToggle: () => void;
}

export function DocumentScoreDetails({ doc, isExpanded, onToggle }: DocumentScoreDetailsProps) {
  return (
    <div className="pt-2 border-t border-notion-border">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="-ml-1.5 inline-flex h-7 items-center gap-1 rounded-notion px-1.5 text-xs text-notion-text-secondary transition-colors hover:bg-notion-bg-hover hover:text-notion-text active:bg-notion-bg-active"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Скрыть разбор скора' : 'Показать разбор скора'}
      >
        <span className="font-medium">Score: {doc.final_score.toFixed(3)}</span>
        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {isExpanded && (
        <div className="mt-2">
          <ScoreBreakdown doc={doc} />
        </div>
      )}
    </div>
  );
}
