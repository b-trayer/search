import { useEffect, useState } from 'react';
import { Clock, RotateCcw, Trash2 } from 'lucide-react';
import { readHistory, removeHistoryEntry, type HistoryEntry } from '@/hooks/settings/history';
import type { SettingsExport } from '@/hooks/settings/io';

interface HistorySectionProps {
  refreshKey: number;
  onRestore: (snapshot: SettingsExport) => void;
}

export function HistorySection({ refreshKey, onRestore }: HistorySectionProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(readHistory());
  }, [refreshKey]);

  return (
    <section
      id="section-history"
      className="scroll-mt-20 rounded-notion border border-notion-border bg-notion-bg p-6"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-notion-text">
          История сохранений
        </h2>
        <span className="text-xs text-notion-text-tertiary">
          хранится локально, последние 10
        </span>
      </div>
      <p className="mt-1 text-sm text-notion-text-secondary">
        Каждое нажатие «Сохранить» создает снимок. Можно вернуться к любой версии,
        будут заполнены поля редактора (нужно будет еще раз нажать «Сохранить»).
      </p>

      {entries.length === 0 ? (
        <div className="mt-4 rounded-notion border border-notion-border bg-notion-bg-secondary p-6 text-center text-sm text-notion-text-secondary">
          Еще не было сохранений. Нажмите «Сохранить» в шапке, чтобы создать первый снимок.
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-notion-border rounded-notion border border-notion-border">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-3 bg-notion-bg p-3 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Clock className="h-3.5 w-3.5 shrink-0 text-notion-text-tertiary" />
                <span className="truncate text-notion-text">
                  {formatDate(entry.saved_at)}
                </span>
                <span className="hidden font-mono text-[11px] tabular-nums text-notion-text-tertiary sm:inline">
                  w_user={entry.snapshot.weights.w_user.toFixed(1)} ·
                  α₁={entry.snapshot.weights.alpha_type.toFixed(2)} ·
                  α₂={entry.snapshot.weights.alpha_topic.toFixed(2)} ·
                  β={entry.snapshot.weights.beta_ctr.toFixed(1)}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    onRestore({
                      version: 1,
                      exported_at: entry.saved_at,
                      ...entry.snapshot,
                    })
                  }
                  className="inline-flex h-7 items-center gap-1 rounded-notion border border-notion-border bg-notion-bg px-2 text-xs text-notion-text transition-colors hover:bg-notion-bg-hover"
                  title="Восстановить эту версию"
                >
                  <RotateCcw className="h-3 w-3" />
                  Восстановить
                </button>
                <button
                  type="button"
                  onClick={() => setEntries(removeHistoryEntry(entry.id))}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-notion text-notion-text-tertiary transition-colors hover:bg-notion-bg-hover hover:text-red-600"
                  aria-label="Удалить из истории"
                  title="Удалить"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
