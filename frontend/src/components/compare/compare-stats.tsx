import { Calculator, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { CompareStats as Stats } from '@/hooks/use-compare';
import { formatSigned } from '@/hooks/compare/compare-types';
import type { User } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';

interface CompareStatsProps {
  stats: Stats;
  leftUser: User | null;
  rightUser: User | null;
}

interface MetricProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
}

function Metric({ label, value, hint }: MetricProps) {
  return (
    <div className="flex flex-col gap-1">
      <p className="flex items-center gap-1 text-xs uppercase tracking-wide text-notion-text-tertiary">
        {label}
        {hint && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 cursor-help text-notion-text-tertiary" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs leading-snug">
                {hint}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </p>
      <p className="text-sm font-semibold text-notion-text tabular-nums">{value}</p>
    </div>
  );
}

function formatPersonaLabel(user: User | null, fallback: string): string {
  if (!user) return fallback;
  return user.username || user.specialization || user.role;
}

export default function CompareStats({ stats, leftUser, rightUser }: CompareStatsProps) {
  const { t } = useTranslation();
  const commonPct = stats.total > 0 ? Math.round((stats.common / stats.total) * 100) : 0;
  const spearmanText =
    stats.spearman === null ? '—' : stats.spearman.toFixed(2);

  const leftLabel = formatPersonaLabel(leftUser, t('compare.column1'));
  const rightLabel = formatPersonaLabel(rightUser, t('compare.column2'));

  return (
    <div className="mb-6 rounded-notion border border-notion-border bg-notion-bg p-4">
      <div className="mb-4 flex items-center gap-2">
        <Calculator className="h-4 w-4 text-notion-text-tertiary" />
        <span className="text-sm font-medium text-notion-text">{t('compare.statsTitle')}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <Metric
          label={t('compare.commonTop10')}
          value={
            <>
              {stats.common} / {stats.total}
              <span className="ml-1 text-xs font-normal text-notion-text-tertiary">
                ({commonPct}%)
              </span>
            </>
          }
          hint={t('compare.commonHint')}
        />
        <Metric
          label={t('compare.unique')}
          value={
            <span>
              {stats.uniqueLeft}
              <span className="mx-1 text-notion-text-tertiary">/</span>
              {stats.uniqueRight}
            </span>
          }
          hint={t('compare.uniqueHint', { left: leftLabel, right: rightLabel })}
        />
        <Metric
          label={t('compare.spearman')}
          value={spearmanText}
          hint={t('compare.spearmanHint')}
        />
        <Metric
          label={t('compare.avgScore')}
          value={
            <span>
              {stats.avgFinalScore1.toFixed(2)}
              <span className="mx-1 text-notion-text-tertiary">/</span>
              {stats.avgFinalScore2.toFixed(2)}
            </span>
          }
          hint={t('compare.avgScoreHint', { left: leftLabel, right: rightLabel })}
        />
        <Metric
          label={t('compare.persContrib', { label: leftLabel })}
          value={formatSigned(stats.avgPersonalization1)}
          hint={t('compare.persContribHint')}
        />
        <Metric
          label={t('compare.persContrib', { label: rightLabel })}
          value={formatSigned(stats.avgPersonalization2)}
          hint={t('compare.persContribHint')}
        />
      </div>
    </div>
  );
}
