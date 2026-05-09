import type { RankingWeights } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';

interface FormulaPreviewProps {
  weights: RankingWeights;
}

function fmt(n: number, digits = 2): string {
  return n.toFixed(digits);
}

export function FormulaPreview({ weights }: FormulaPreviewProps) {
  const { w_user, alpha_type, alpha_topic, beta_ctr, ctr_alpha_prior, ctr_beta_prior } = weights;
  const { t } = useTranslation();

  return (
    <section className="rounded-notion border border-notion-border bg-notion-bg p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-notion-text">
          {t('formula.title')}
        </h2>
        <span className="text-xs text-notion-text-tertiary">
          {t('formula.realtime')}
        </span>
      </div>

      <div className="mt-3 overflow-x-auto">
        <code className="block whitespace-nowrap font-mono text-[13px] tabular-nums leading-relaxed text-notion-text">
          <span className="text-notion-text-tertiary">score</span>
          {' = '}
          <span>log(1 + BM25)</span>
          {' + '}
          <Token value={fmt(w_user, 1)} label="w_user" />
          {' · ('}
          <Token value={fmt(alpha_type, 2)} label="α₁" />
          {' · f_type + '}
          <Token value={fmt(alpha_topic, 2)} label="α₂" />
          {' · f_topic) + '}
          <Token value={fmt(beta_ctr, 1)} label="β" />
          {' · log(1 + CTR)'}
        </code>

        <code className="mt-2 block whitespace-nowrap font-mono text-[12px] tabular-nums leading-relaxed text-notion-text-secondary">
          <span className="text-notion-text-tertiary">CTR</span>
          {' = (clicks + '}
          <Token value={fmt(ctr_alpha_prior, 1)} label="α prior" muted />
          {') / (impressions + '}
          <Token value={fmt(ctr_alpha_prior, 1)} label="α prior" muted />
          {' + '}
          <Token value={fmt(ctr_beta_prior, 0)} label="β prior" muted />
          {')'}
        </code>
      </div>
    </section>
  );
}

function Token({ value, label, muted }: { value: string; label: string; muted?: boolean }) {
  return (
    <span
      className={`inline-flex items-baseline gap-1 rounded-sm px-1 ${
        muted ? 'bg-notion-bg-secondary' : 'bg-notion-accent-light'
      }`}
      title={label}
    >
      <span className={muted ? 'text-notion-text-secondary' : 'text-notion-accent font-semibold'}>
        {value}
      </span>
      <span className="text-[10px] text-notion-text-tertiary">{label}</span>
    </span>
  );
}
