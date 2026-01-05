import { ChevronDown, ChevronUp } from 'lucide-react';
import type { DocumentResult } from '@/lib/types';

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
        className="flex items-center gap-1 text-xs text-notion-text-secondary hover:text-notion-text transition-colors"
      >
        <span className="font-medium">Score: {doc.final_score.toFixed(3)}</span>
        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {isExpanded && (
        <div
          className="mt-2 p-3 bg-notion-bg-secondary rounded-notion text-xs font-mono space-y-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-notion-text-tertiary text-center pb-2 border-b border-notion-border/50">
            score = log(1+BM25) + w<sub>u</sub>·f(U,D) + β<sub>ctr</sub>·log(1+CTR)
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5">
              <span className="text-notion-text-secondary">log(1+BM25)</span>
              <span className="text-right font-medium text-notion-text">{doc.log_bm25.toFixed(3)}</span>
            </div>

            {doc.weights && (
              <PersonalizationDetails doc={doc} />
            )}

            {doc.weights && (
              <CTRDetails doc={doc} />
            )}

            <div className="pt-2 border-t border-notion-border">
              <div className="grid grid-cols-[1fr_auto] gap-x-3">
                <span className="font-semibold text-notion-text">Final Score</span>
                <span className="text-right font-semibold text-notion-accent">{doc.final_score.toFixed(3)}</span>
              </div>
              <div className="text-[10px] text-notion-text-tertiary mt-1">
                {doc.log_bm25.toFixed(3)} + {(doc.user_contrib ?? 0).toFixed(3)} + {(doc.ctr_contrib ?? 0).toFixed(3)} = {doc.final_score.toFixed(3)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PersonalizationDetails({ doc }: { doc: DocumentResult }) {
  if (!doc.weights) return null;

  return (
    <div className="pl-2 border-l-2 border-notion-accent/30 space-y-1">
      <div className="text-notion-text-tertiary text-[10px] uppercase tracking-wide mb-1">
        Персонализация f(U,D)
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-notion-text-tertiary">
        <span>f_type (raw)</span>
        <span className="text-right">{doc.f_type.toFixed(3)}</span>

        <span>f_topic (raw)</span>
        <span className="text-right">{doc.f_topic.toFixed(3)}</span>

        <span className="col-span-2 border-t border-notion-border/30 my-1"></span>

        <span>α₁ × f_type = {doc.weights.alpha_type} × {doc.f_type.toFixed(3)}</span>
        <span className="text-right">{(doc.weights.alpha_type * doc.f_type).toFixed(3)}</span>

        <span>α₂ × f_topic = {doc.weights.alpha_topic} × {doc.f_topic.toFixed(3)}</span>
        <span className="text-right">{(doc.weights.alpha_topic * doc.f_topic).toFixed(3)}</span>

        <span className="col-span-2 border-t border-notion-border/30 my-1"></span>

        <span>f(U,D) = α₁·f_type + α₂·f_topic</span>
        <span className="text-right font-medium text-notion-text">{doc.f_user.toFixed(3)}</span>

        <span>w<sub>u</sub> × f(U,D) = {doc.weights.w_user} × {doc.f_user.toFixed(3)}</span>
        <span className="text-right font-medium text-notion-text">{(doc.user_contrib ?? 0).toFixed(3)}</span>
      </div>
    </div>
  );
}

function CTRDetails({ doc }: { doc: DocumentResult }) {
  if (!doc.weights) return null;

  return (
    <div className="pl-2 border-l-2 border-orange-500/30 space-y-1">
      <div className="text-notion-text-tertiary text-[10px] uppercase tracking-wide mb-1">
        CTR компонент
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-notion-text-tertiary">
        <span>clicks / impressions</span>
        <span className="text-right">{doc.clicks} / {doc.impressions}</span>

        <span>CTR (raw)</span>
        <span className="text-right">{doc.impressions > 0 ? (doc.clicks / doc.impressions * 100).toFixed(2) : '0.00'}%</span>

        <span>α_prior (псевдо-клики)</span>
        <span className="text-right">{doc.weights.ctr_alpha_prior}</span>

        <span>β_prior (псевдо-показы)</span>
        <span className="text-right">{doc.weights.ctr_beta_prior}</span>

        <span>smoothed_CTR = (clicks + α_prior) / (impr + α_prior + β_prior)</span>
        <span className="text-right"></span>

        <span className="text-notion-text">= ({doc.clicks} + {doc.weights.ctr_alpha_prior}) / ({doc.impressions} + {doc.weights.ctr_alpha_prior} + {doc.weights.ctr_beta_prior})</span>
        <span className="text-right font-medium text-notion-text">{(doc.smoothed_ctr ?? 0).toFixed(4)}</span>

        <span className="col-span-2 border-t border-notion-border/30 my-1"></span>

        <span>log(1 + smoothed_CTR×10)</span>
        <span className="text-right">{doc.ctr_factor.toFixed(3)}</span>

        <span>β_ctr × log(...) = {doc.weights.beta_ctr} × {doc.ctr_factor.toFixed(3)}</span>
        <span className="text-right font-medium text-notion-text">{(doc.ctr_contrib ?? 0).toFixed(3)}</span>
      </div>
    </div>
  );
}
