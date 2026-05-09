import type { DocumentResult } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';

interface ScoreBreakdownProps {
  doc: DocumentResult;
  compact?: boolean;
}

export function ScoreBreakdown({ doc, compact = false }: ScoreBreakdownProps) {
  if (compact) return <CompactBreakdown doc={doc} />;
  return <FullBreakdown doc={doc} />;
}

function CompactBreakdown({ doc }: { doc: DocumentResult }) {
  const w = doc.weights;
  return (
    <div className="space-y-1.5 font-mono text-[11px] tabular-nums leading-relaxed text-notion-text-secondary">
      <div>
        <span className="text-notion-text-tertiary">log(1+BM25)</span> ={' '}
        <span className="text-notion-text">{doc.log_bm25.toFixed(3)}</span>
      </div>
      <div>
        <span className="text-notion-text-tertiary">f_type</span> ={' '}
        <span className="text-notion-text">{doc.f_type.toFixed(3)}</span>
        {w && (
          <span className="text-notion-text-tertiary"> · α₁={w.alpha_type.toFixed(2)}</span>
        )}
      </div>
      <div>
        <span className="text-notion-text-tertiary">f_topic</span> ={' '}
        <span className="text-notion-text">{doc.f_topic.toFixed(3)}</span>
        {w && (
          <span className="text-notion-text-tertiary"> · α₂={w.alpha_topic.toFixed(2)}</span>
        )}
      </div>
      <div>
        <span className="text-notion-text-tertiary">f_user</span> ={' '}
        <span className="text-notion-text">{doc.f_user.toFixed(3)}</span>
        {w && (
          <span className="text-notion-text-tertiary">
            {' '}
            · w_user={w.w_user.toFixed(2)} → contrib={(doc.user_contrib ?? 0).toFixed(3)}
          </span>
        )}
      </div>
      <div>
        <span className="text-notion-text-tertiary">CTR</span> ={' '}
        <span className="text-notion-text">{(doc.smoothed_ctr ?? 0).toFixed(4)}</span>
        {w && (
          <span className="text-notion-text-tertiary">
            {' '}
            · β={w.beta_ctr.toFixed(2)} → contrib={(doc.ctr_contrib ?? 0).toFixed(3)}
          </span>
        )}
      </div>
      <div className="mt-2 border-t border-notion-border pt-2">
        <span className="text-notion-text-tertiary">final_score</span> ={' '}
        <span className="font-semibold text-notion-accent">{doc.final_score.toFixed(3)}</span>
        <span className="text-notion-text-tertiary">
          {' '}
          ≈ {doc.log_bm25.toFixed(2)} + {(doc.user_contrib ?? 0).toFixed(2)} +{' '}
          {(doc.ctr_contrib ?? 0).toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function FullBreakdown({ doc }: { doc: DocumentResult }) {
  const { t } = useTranslation();
  return (
    <div
      className="p-3 bg-notion-bg-secondary rounded-notion text-xs tabular-nums space-y-3"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="text-notion-text-tertiary text-center pb-2 border-b border-notion-border/50">
        {t('score.formula')}
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5">
          <span className="text-notion-text-secondary">log(1+BM25)</span>
          <span className="text-right font-medium text-notion-text">{doc.log_bm25.toFixed(3)}</span>
        </div>

        {doc.weights && <PersonalizationDetails doc={doc} />}
        {doc.weights && <CTRDetails doc={doc} />}

        <div className="pt-2 border-t border-notion-border">
          <div className="grid grid-cols-[1fr_auto] gap-x-3">
            <span className="font-semibold text-notion-text">{t('score.final')}</span>
            <span className="text-right font-semibold text-notion-accent">
              {doc.final_score.toFixed(3)}
            </span>
          </div>
          <div className="text-[10px] text-notion-text-tertiary mt-1">
            {doc.log_bm25.toFixed(3)} + {(doc.user_contrib ?? 0).toFixed(3)} +{' '}
            {(doc.ctr_contrib ?? 0).toFixed(3)} ≈ {doc.final_score.toFixed(3)}
          </div>
          <div className="text-[10px] text-notion-text-tertiary mt-0.5 italic">
            {t('score.compactDisclaimer')}
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonalizationDetails({ doc }: { doc: DocumentResult }) {
  const { t } = useTranslation();
  if (!doc.weights) return null;

  return (
    <div className="pl-2 border-l-2 border-notion-accent/30 space-y-1">
      <div className="text-notion-text-tertiary text-[10px] uppercase tracking-wide mb-1">
        {t('score.personalizationHeader')}
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
  const { t } = useTranslation();
  if (!doc.weights) return null;

  return (
    <div className="pl-2 border-l-2 border-notion-border-strong space-y-1">
      <div className="text-notion-text-tertiary text-[10px] uppercase tracking-wide mb-1">
        {t('score.ctrHeader')}
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-notion-text-tertiary">
        <span>clicks / impressions</span>
        <span className="text-right">{doc.clicks} / {doc.impressions}</span>

        <span>CTR (raw)</span>
        <span className="text-right">
          {doc.impressions > 0 ? ((doc.clicks / doc.impressions) * 100).toFixed(2) : '0.00'}%
        </span>

        <span>{t('score.alphaPriorPseudoClicks')}</span>
        <span className="text-right">{doc.weights.ctr_alpha_prior}</span>

        <span>{t('score.betaPriorPseudoImpressions')}</span>
        <span className="text-right">{doc.weights.ctr_beta_prior}</span>

        <span>smoothed_CTR = (clicks + α_prior) / (impr + α_prior + β_prior)</span>
        <span className="text-right"></span>

        <span className="text-notion-text">
          = ({doc.clicks} + {doc.weights.ctr_alpha_prior}) / ({doc.impressions} +{' '}
          {doc.weights.ctr_alpha_prior} + {doc.weights.ctr_beta_prior})
        </span>
        <span className="text-right font-medium text-notion-text">
          {(doc.smoothed_ctr ?? 0).toFixed(4)}
        </span>

        <span className="col-span-2 border-t border-notion-border/30 my-1"></span>

        <span>log(1 + smoothed_CTR×10)</span>
        <span className="text-right">{doc.ctr_factor.toFixed(3)}</span>

        <span>β_ctr × log(...) = {doc.weights.beta_ctr} × {doc.ctr_factor.toFixed(3)}</span>
        <span className="text-right font-medium text-notion-text">
          {(doc.ctr_contrib ?? 0).toFixed(3)}
        </span>
      </div>
    </div>
  );
}
