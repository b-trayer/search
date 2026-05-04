import { useEffect, useRef, useState } from 'react';
import { ArrowUpDown, Check, ChevronDown } from 'lucide-react';
import type { SortBy } from '@/lib/types';

interface SortMenuProps {
  value: SortBy;
  onChange: (next: SortBy) => void;
}

const OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'relevance', label: 'По релевантности' },
  { value: 'popularity_desc', label: 'По популярности' },
  { value: 'year_desc', label: 'Год: сначала новые' },
  { value: 'year_asc', label: 'Год: сначала старые' },
  { value: 'title_asc', label: 'По названию (А–Я)' },
];

export function SortMenu({ value, onChange }: SortMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-8 items-center gap-1.5 rounded-notion border border-notion-border bg-notion-bg px-2.5 text-xs text-notion-text transition-colors hover:bg-notion-bg-hover"
      >
        <ArrowUpDown className="h-3.5 w-3.5 text-notion-text-tertiary" />
        <span>{current.label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-notion-text-tertiary" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-20 mt-1 min-w-[14rem] overflow-hidden rounded-notion border border-notion-border bg-notion-bg shadow-notion-md"
        >
          {OPTIONS.map((opt) => {
            const selected = opt.value === value;
            return (
              <button
                key={opt.value}
                role="option"
                aria-selected={selected}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-notion-bg-hover ${
                  selected ? 'text-notion-text' : 'text-notion-text-secondary'
                }`}
              >
                <span>{opt.label}</span>
                {selected && <Check className="h-3.5 w-3.5 text-notion-text" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
