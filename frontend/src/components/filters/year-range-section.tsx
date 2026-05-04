import { useEffect, useState } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface YearRangeSectionProps {
  bounds: { min: number | null; max: number | null };
  yearFrom: number | null;
  yearTo: number | null;
  onChange: (from: number | null, to: number | null) => void;
  defaultOpen?: boolean;
}

interface PresetOption {
  label: string;
  from: number | null;
  to: number | null;
}

function buildPresets(maxYear: number): PresetOption[] {
  return [
    { label: `С ${maxYear - 5}`, from: maxYear - 5, to: null },
    { label: 'С 2010', from: 2010, to: null },
    { label: 'С 2000', from: 2000, to: null },
    { label: 'До 1990', from: null, to: 1990 },
  ];
}

function isPresetActive(preset: PresetOption, from: number | null, to: number | null) {
  return preset.from === from && preset.to === to;
}

export function YearRangeSection({
  bounds,
  yearFrom,
  yearTo,
  onChange,
  defaultOpen = true,
}: YearRangeSectionProps) {
  const min = bounds.min ?? 1900;
  const max = bounds.max ?? new Date().getFullYear();

  const [draft, setDraft] = useState<[number, number]>([yearFrom ?? min, yearTo ?? max]);
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    setDraft([yearFrom ?? min, yearTo ?? max]);
  }, [yearFrom, yearTo, min, max]);

  const isActive = yearFrom !== null || yearTo !== null;
  const presets = buildPresets(max);

  const commit = (next: [number, number]) => {
    const [from, to] = next;
    onChange(from === min ? null : from, to === max ? null : to);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="group flex w-full items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-notion-text-tertiary" />
            <span className="text-sm font-medium text-notion-text">Год издания</span>
            {isActive && (
              <span className="inline-flex h-5 items-center rounded-notion bg-notion-bg-secondary px-1.5 text-[11px] tabular-nums text-notion-text-secondary">
                {yearFrom ?? min}–{yearTo ?? max}
              </span>
            )}
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-notion-text-tertiary transition-colors group-hover:text-notion-text" />
          ) : (
            <ChevronRight className="h-4 w-4 text-notion-text-tertiary transition-colors group-hover:text-notion-text" />
          )}
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="space-y-3 pb-3">
          <div className="px-1 pt-2">
            <SliderPrimitive.Root
              className="relative flex w-full touch-none select-none items-center"
              value={draft}
              min={min}
              max={max}
              step={1}
              minStepsBetweenThumbs={1}
              onValueChange={(value) => setDraft(value as [number, number])}
              onValueCommit={(value) => commit(value as [number, number])}
            >
              <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-notion-border">
                <SliderPrimitive.Range className="absolute h-full bg-notion-text" />
              </SliderPrimitive.Track>
              {[0, 1].map((i) => (
                <SliderPrimitive.Thumb
                  key={i}
                  className="block h-3.5 w-3.5 rounded-full border border-notion-text bg-notion-bg shadow-notion-sm transition-colors hover:bg-notion-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-notion-accent/30"
                />
              ))}
            </SliderPrimitive.Root>
            <div className="mt-2 flex justify-between text-[11px] tabular-nums text-notion-text-tertiary">
              <span>{draft[0]}</span>
              <span>{draft[1]}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {presets.map((preset) => {
              const active = isPresetActive(preset, yearFrom, yearTo);
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onChange(preset.from, preset.to)}
                  className={`rounded-notion border px-2 py-1 text-xs transition-colors ${
                    active
                      ? 'border-notion-text bg-notion-text text-white'
                      : 'border-notion-border bg-notion-bg text-notion-text-secondary hover:bg-notion-bg-hover'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
            {isActive && (
              <button
                type="button"
                onClick={() => onChange(null, null)}
                className="rounded-notion border border-notion-border bg-notion-bg px-2 py-1 text-xs text-notion-text-tertiary transition-colors hover:bg-notion-bg-hover hover:text-notion-text"
              >
                Сбросить
              </button>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
