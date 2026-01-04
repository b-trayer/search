import { Eye, MousePointer } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BookStatsProps {
  impressions: number;
  clicks: number;
  displayCtr?: number;
  collection?: string;
}

const BookStats = ({ impressions, clicks, displayCtr, collection }: BookStatsProps) => {
  const ctrPercent = displayCtr !== undefined
    ? displayCtr * 100
    : (impressions > 0 ? (clicks / impressions) * 100 : 0);

  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      {collection && (
        <Badge variant="outline" className="text-xs border-border">
          {collection}
        </Badge>
      )}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1" title="Показы">
          <Eye className="h-3.5 w-3.5" />
          {impressions}
        </span>
        <span className="flex items-center gap-1" title="Клики">
          <MousePointer className="h-3.5 w-3.5" />
          {clicks}
        </span>
        <Badge variant="secondary" className="text-xs">
          CTR: {ctrPercent.toFixed(1)}%
        </Badge>
      </div>
    </div>
  );
};

export default BookStats;
