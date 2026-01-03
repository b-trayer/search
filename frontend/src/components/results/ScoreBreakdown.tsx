
import { useState } from 'react';
import { Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import type { DocumentResult, UserProfile } from '@/lib/types';

interface ScoreBreakdownProps {
  doc: DocumentResult;
  userProfile?: UserProfile | null;
}

export default function ScoreBreakdown({ doc, userProfile }: ScoreBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const personalizationBoost = userProfile ? 1.5 : 1.0;
  const ctrBoost = doc.ctr_boost || 1.0;
  const baseScore = doc.base_score || 0;

  return (
    <div className="mt-3 pt-3 border-t border-notion-border">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="flex items-center gap-2 text-xs text-notion-text-secondary hover:text-notion-text transition-colors"
      >
        <Calculator className="h-3 w-3" />
        <span>
          Скор: <strong className="text-notion-text">{doc.final_score?.toFixed(1)}</strong>
        </span>
        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {isExpanded && (
        <div className="mt-2 p-3 bg-notion-bg-secondary rounded-notion text-xs space-y-2">
          <div className="font-medium text-notion-text mb-2">Формула расчёта:</div>

          <div className="flex justify-between items-center">
            <span className="text-notion-text-secondary">Базовый скор (BM25):</span>
            <span className="font-mono font-medium">{baseScore.toFixed(2)}</span>
          </div>

          {ctrBoost > 1 && (
            <div className="flex justify-between items-center text-green-600">
              <span>× CTR буст:</span>
              <span className="font-mono font-medium">×{ctrBoost.toFixed(2)}</span>
            </div>
          )}

          {userProfile && (
            <div className="flex justify-between items-center text-notion-accent">
              <span>× Персонализация ({userProfile.specialization}):</span>
              <span className="font-mono font-medium">×{personalizationBoost.toFixed(1)}</span>
            </div>
          )}

          <div className="border-t border-notion-border pt-2 flex justify-between items-center font-medium">
            <span className="text-notion-text-secondary">Итого:</span>
            <span className="font-mono text-notion-text">{doc.final_score?.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
