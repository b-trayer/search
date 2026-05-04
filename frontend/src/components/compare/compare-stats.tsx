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
  const commonPct = stats.total > 0 ? Math.round((stats.common / stats.total) * 100) : 0;
  const spearmanText =
    stats.spearman === null ? '—' : stats.spearman.toFixed(2);

  const leftLabel = formatPersonaLabel(leftUser, 'Колонка 1');
  const rightLabel = formatPersonaLabel(rightUser, 'Колонка 2');

  return (
    <div className="mb-6 rounded-notion border border-notion-border bg-notion-bg p-4">
      <div className="mb-4 flex items-center gap-2">
        <Calculator className="h-4 w-4 text-notion-text-tertiary" />
        <span className="text-sm font-medium text-notion-text">Анализ различий</span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <Metric
          label="Общих в топ-10"
          value={
            <>
              {stats.common} из {stats.total}
              <span className="ml-1 text-xs font-normal text-notion-text-tertiary">
                ({commonPct}%)
              </span>
            </>
          }
          hint="Сколько документов оказались в топ-10 у обоих пользователей одновременно."
        />
        <Metric
          label="Уникальных"
          value={
            <span>
              {stats.uniqueLeft}
              <span className="mx-1 text-notion-text-tertiary">/</span>
              {stats.uniqueRight}
            </span>
          }
          hint={`Документы, которые есть только у одного из пользователей: ${leftLabel} / ${rightLabel}.`}
        />
        <Metric
          label="ρ Спирмена"
          value={spearmanText}
          hint="Корреляция позиций по общим документам. 1.00 — идентичный порядок, 0 — независимый, -1 — обратный."
        />
        <Metric
          label="Средний final_score"
          value={
            <span>
              {stats.avgFinalScore1.toFixed(2)}
              <span className="mx-1 text-notion-text-tertiary">/</span>
              {stats.avgFinalScore2.toFixed(2)}
            </span>
          }
          hint={`Среднее значение итогового скоринга по топ-10: ${leftLabel} / ${rightLabel}.`}
        />
        <Metric
          label={`+ персонализация (${leftLabel})`}
          value={formatSigned(stats.avgPersonalization1)}
          hint="Средний вклад персонализации (w_user · f(U,D)) в итоговый скоринг по этой колонке."
        />
        <Metric
          label={`+ персонализация (${rightLabel})`}
          value={formatSigned(stats.avgPersonalization2)}
          hint="Средний вклад персонализации (w_user · f(U,D)) в итоговый скоринг по этой колонке."
        />
      </div>
    </div>
  );
}
