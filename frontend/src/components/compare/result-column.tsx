import { useState } from 'react';
import { ChevronDown, ChevronUp, User as UserIcon, TrendingUp, TrendingDown, Star } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PositionChip, ScoreBreakdown } from '@/components/results';
import { getPositionChange } from '@/hooks/use-compare';
import type { DocumentResult, User } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';

interface ResultColumnProps {
  user: User | null;
  results: DocumentResult[];
  otherResults: DocumentResult[];
  fallbackLabel: string;
}

function PositionBadge({ value }: { value: number }) {
  const { t, plural } = useTranslation();
  const positive = value > 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  const colorClass = positive
    ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
    : 'text-red-700 bg-red-50 border-red-100';
  const tooltip = positive
    ? t('compare.posUp', { n: value, noun: plural('compare.position', value) })
    : t('compare.posDown', { n: Math.abs(value), noun: plural('compare.position', Math.abs(value)) });

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex cursor-help items-center gap-1 rounded-notion border px-1.5 py-0.5 text-xs tabular-nums ${colorClass}`}
          >
            <Icon className="h-3 w-3" />
            {positive ? `+${value}` : value}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function UniqueBadge() {
  const { t } = useTranslation();
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-help items-center gap-1 rounded-notion border border-amber-100 bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700">
            <Star className="h-3 w-3" />
            {t('compare.unique')}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {t('compare.uniqueTooltip')}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ResultRowProps {
  doc: DocumentResult;
  index: number;
  posChange: number | null;
  isUnique: boolean;
}

function ResultRow({ doc, index, posChange, isUnique }: ResultRowProps) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();

  return (
    <div
      className={`rounded-notion border bg-notion-bg transition-colors hover:bg-notion-bg-hover ${
        isUnique ? 'border-l-2 border-l-amber-300 border-notion-border' : 'border-notion-border'
      }`}
    >
      <div className="flex items-start gap-3 p-3">
        <PositionChip n={index + 1} size="md" />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium text-notion-text">{doc.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex h-7 items-center gap-1 rounded-notion px-1.5 -ml-1.5 text-xs tabular-nums text-notion-text-tertiary transition-colors hover:bg-notion-bg-hover hover:text-notion-text active:bg-notion-bg-active"
              aria-expanded={expanded}
              aria-label={expanded ? t('score.toggleHide') : t('score.toggleShow')}
            >
              {t('common.score')}: {doc.final_score?.toFixed(1)}
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
            {isUnique && <UniqueBadge />}
            {!isUnique && posChange !== null && posChange !== 0 && (
              <PositionBadge value={posChange} />
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-notion-border p-3">
          <ScoreBreakdown doc={doc} compact />
        </div>
      )}
    </div>
  );
}

function buildTitle(user: User | null, fallback: string, t: (key: string, params?: Record<string, unknown>) => string): string {
  if (!user) return t('compare.topNoPers', { label: fallback });
  if (user.username) return t('compare.topForUser', { username: user.username });
  return t('compare.topForSpec', { spec: user.specialization || user.role });
}

export default function ResultColumn({
  user,
  results,
  otherResults,
  fallbackLabel,
}: ResultColumnProps) {
  const { t } = useTranslation();
  const otherIds = new Set(otherResults.map((d) => d.document_id));

  return (
    <div className="min-w-0 flex-1">
      <div className="rounded-notion border border-notion-border bg-notion-bg">
        <div className="border-b border-notion-border p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-notion-text">
            <UserIcon className="h-4 w-4 text-notion-text-tertiary" />
            {buildTitle(user, fallbackLabel, t)}
          </div>
          {user ? (
            <div className="mt-2 space-y-0.5 text-sm text-notion-text-secondary">
              <p>{user.specialization || user.role}</p>
              {user.interests && user.interests.length > 0 && (
                <p className="text-xs text-notion-text-tertiary">
                  {user.interests.slice(0, 2).join(', ')}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-notion-text-tertiary">
              {t('compare.searchNoProfile')}
            </p>
          )}
        </div>

        <div className="space-y-2 p-3">
          {results.length === 0 ? (
            <p className="py-8 text-center text-sm text-notion-text-tertiary">
              {t('compare.pressCompare')}
            </p>
          ) : (
            results.map((doc, idx) => (
              <ResultRow
                key={doc.document_id}
                doc={doc}
                index={idx}
                posChange={getPositionChange(doc.document_id, results, otherResults)}
                isUnique={!otherIds.has(doc.document_id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
