import { ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { DiffEntry } from '@/hooks/settings/changes';

interface DiffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: DiffEntry[];
  onSave?: () => void;
  isSaving?: boolean;
}

const GROUP_LABELS: Record<DiffEntry['group'], string> = {
  weights: 'Веса',
  matrix: 'Матрица f_type',
  topics: 'Скоры f_topic',
  specializations: 'Специализации',
};

export function DiffDialog({
  open,
  onOpenChange,
  entries,
  onSave,
  isSaving,
}: DiffDialogProps) {
  const grouped = groupBy(entries, (e) => e.group);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Что изменилось</DialogTitle>
          <DialogDescription>
            {entries.length === 0
              ? 'Нет несохраненных изменений.'
              : `Несохраненных изменений: ${entries.length}.`}
          </DialogDescription>
        </DialogHeader>

        {entries.length > 0 && (
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            {(Object.keys(grouped) as DiffEntry['group'][]).map((group) => (
              <div key={group}>
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-notion-text-tertiary">
                  {GROUP_LABELS[group]} · {grouped[group].length}
                </h4>
                <ul className="divide-y divide-notion-border rounded-notion border border-notion-border bg-notion-bg-secondary">
                  {grouped[group].map((e, idx) => (
                    <li
                      key={`${group}-${e.label}-${idx}`}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                    >
                      <span className="min-w-0 truncate font-mono text-xs text-notion-text">
                        {e.label}
                      </span>
                      <span className="flex shrink-0 items-center gap-2 tabular-nums text-xs">
                        <span className="text-notion-text-tertiary line-through">{e.before}</span>
                        <ArrowRight className="h-3 w-3 text-notion-text-tertiary" />
                        <span className="font-medium text-notion-accent">{e.after}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 items-center rounded-notion border border-notion-border bg-notion-bg px-3 text-sm text-notion-text transition-colors hover:bg-notion-bg-hover"
          >
            Закрыть
          </button>
          {onSave && entries.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onSave();
                onOpenChange(false);
              }}
              disabled={isSaving}
              className="inline-flex h-9 items-center gap-1.5 rounded-notion bg-notion-accent px-3 text-sm font-medium text-white transition-colors hover:bg-notion-accent-hover disabled:opacity-50"
            >
              Применить и сохранить
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function groupBy<T, K extends string>(arr: T[], fn: (x: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const x of arr) {
    const k = fn(x);
    (out[k] ??= []).push(x);
  }
  return out;
}
