import { Eye, MousePointerClick } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DocumentCardStatsProps {
  impressions: number;
  clicks: number;
}

export function DocumentCardStats({ impressions, clicks }: DocumentCardStatsProps) {
  const ctr = impressions > 0 ? (clicks / impressions * 100) : 0;

  return (
    <>
      <div className="flex items-center gap-1 text-xs text-notion-text-tertiary ml-auto">
        <Eye className="h-3 w-3" />
        <span>{impressions}</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-notion-text-tertiary">
        <MousePointerClick className="h-3 w-3" />
        <span>{clicks}</span>
      </div>
      <Badge variant="secondary" className="text-xs">
        CTR: {ctr.toFixed(1)}%
      </Badge>
    </>
  );
}
