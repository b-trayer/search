type PositionChipSize = 'sm' | 'md' | 'lg';

interface PositionChipProps {
  n: number;
  size?: PositionChipSize;
  className?: string;
}

const SIZE_CLASSES: Record<PositionChipSize, string> = {
  sm: 'h-5 min-w-[1.25rem] px-1.5 text-[11px]',
  md: 'h-6 w-6 text-xs',
  lg: 'h-7 w-7 text-xs',
};

export function PositionChip({ n, size = 'md', className = '' }: PositionChipProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-notion bg-notion-bg-secondary font-medium tabular-nums text-notion-text-secondary ${SIZE_CLASSES[size]} ${className}`}
    >
      {n}
    </span>
  );
}
