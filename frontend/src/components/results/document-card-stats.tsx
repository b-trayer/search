import { Eye, MousePointerClick } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface DocumentCardStatsProps {
  impressions: number;
  clicks: number;
}

export function DocumentCardStats({ impressions, clicks }: DocumentCardStatsProps) {
  const { t, formatNumber } = useTranslation();
  if (impressions === 0 && clicks === 0) return null;

  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-notion-text-tertiary">
      <span className="inline-flex items-center gap-1" title={t('card.impressions')}>
        <Eye className="h-3 w-3" />
        <span className="tabular-nums">{formatNumber(impressions)}</span>
      </span>
      <span className="inline-flex items-center gap-1" title={t('card.clicks')}>
        <MousePointerClick className="h-3 w-3" />
        <span className="tabular-nums">{formatNumber(clicks)}</span>
      </span>
      {impressions > 0 && (
        <span className="tabular-nums" title={t('card.ctrTooltip')}>
          CTR {ctr.toFixed(1)}%
        </span>
      )}
    </div>
  );
}
