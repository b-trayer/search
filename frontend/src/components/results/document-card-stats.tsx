import { Eye, MousePointerClick } from 'lucide-react';

interface DocumentCardStatsProps {
  impressions: number;
  clicks: number;
}

export function DocumentCardStats({ impressions, clicks }: DocumentCardStatsProps) {
  if (impressions === 0 && clicks === 0) return null;

  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-notion-text-tertiary">
      <span className="inline-flex items-center gap-1" title="Показов">
        <Eye className="h-3 w-3" />
        <span className="tabular-nums">{impressions.toLocaleString('ru-RU')}</span>
      </span>
      <span className="inline-flex items-center gap-1" title="Кликов">
        <MousePointerClick className="h-3 w-3" />
        <span className="tabular-nums">{clicks.toLocaleString('ru-RU')}</span>
      </span>
      {impressions > 0 && (
        <span className="tabular-nums" title="CTR — кликабельность (clicks / impressions)">
          CTR {ctr.toFixed(1)}%
        </span>
      )}
    </div>
  );
}
