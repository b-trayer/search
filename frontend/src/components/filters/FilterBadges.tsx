
import { Badge } from '@/components/ui/badge';
import type { Filters } from '@/hooks/use-filters';

interface FilterBadgesProps {
  filters: Filters;
  onRemoveCollection: (name: string) => void;
  onRemoveSubject: (name: string) => void;
  maxVisible?: number;
}

export default function FilterBadges({
  filters,
  onRemoveCollection,
  onRemoveSubject,
  maxVisible = 4,
}: FilterBadgesProps) {
  const totalSelected =
    filters.collections.length + filters.subjects.length + filters.languages.length;

  if (totalSelected === 0) return null;

  const collectionsToShow = filters.collections.slice(0, 2);
  const subjectsToShow = filters.subjects.slice(0, 2);
  const remaining = totalSelected - collectionsToShow.length - subjectsToShow.length;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {collectionsToShow.map((c) => (
        <Badge
          key={c}
          variant="outline"
          className="text-[10px] bg-notion-accent-light text-notion-accent border-notion-accent/20 cursor-pointer hover:bg-notion-accent/20"
          onClick={() => onRemoveCollection(c)}
        >
          {c.length > 20 ? c.slice(0, 20) + '…' : c} ×
        </Badge>
      ))}
      {subjectsToShow.map((s) => (
        <Badge
          key={s}
          variant="outline"
          className="text-[10px] bg-green-50 text-green-700 border-green-200 cursor-pointer hover:bg-green-100"
          onClick={() => onRemoveSubject(s)}
        >
          {s.length > 20 ? s.slice(0, 20) + '…' : s} ×
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="outline" className="text-[10px]">
          +{remaining}
        </Badge>
      )}
    </div>
  );
}
