import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronRight, Loader2, Minus, Play, Search as SearchIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { PositionChip, ScoreBreakdown } from '@/components/results';
import { searchDocuments, getUsers } from '@/lib/api';
import type { DocumentResult, RankingWeights, User } from '@/lib/types';

interface TestPreviewProps {
  currentWeights: RankingWeights;
  baselineWeights?: RankingWeights | null;
}

interface PreviewResult {
  doc: DocumentResult;
  delta?: number | null;
  baselinePos?: number | null;
}

export function TestPreview({ currentWeights, baselineWeights }: TestPreviewProps) {
  const [query, setQuery] = useState('квантовая механика');
  const [enablePersonalization, setEnablePersonalization] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [showBaseline, setShowBaseline] = useState(true);
  const [results, setResults] = useState<PreviewResult[] | null>(null);
  const [baselineResults, setBaselineResults] = useState<DocumentResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    getUsers(undefined, 50)
      .then((list) => {
        if (cancelled) return;
        setUsers(list);
        if (list.length > 0) setUserId(list[0].user_id);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const runSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    setTouched(true);
    abortRef.current?.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;
    try {
      const requests: Promise<unknown>[] = [
        searchDocuments(
          query,
          userId ?? undefined,
          enablePersonalization,
          1,
          5,
          undefined,
          'all',
          'relevance',
          { weightsOverride: currentWeights, signal: ctl.signal },
        ),
      ];
      if (showBaseline && baselineWeights) {
        requests.push(
          searchDocuments(
            query,
            userId ?? undefined,
            enablePersonalization,
            1,
            5,
            undefined,
            'all',
            'relevance',
            { weightsOverride: baselineWeights, signal: ctl.signal },
          ),
        );
      }
      const [curr, base] = (await Promise.all(requests)) as Awaited<ReturnType<typeof searchDocuments>>[];
      if (ctl.signal.aborted) return;

      const baseList = base?.results ?? null;
      setBaselineResults(baseList);

      const merged: PreviewResult[] = curr.results.map((doc, idx) => {
        if (!baseList) return { doc };
        const baselineIdx = baseList.findIndex((d) => d.document_id === doc.document_id);
        const baselinePos = baselineIdx === -1 ? null : baselineIdx + 1;
        const delta = baselinePos === null ? null : baselinePos - (idx + 1);
        return { doc, delta, baselinePos };
      });
      setResults(merged);
    } catch (e) {
      if (ctl.signal.aborted) return;
      setError(e instanceof Error ? e.message : 'Не удалось выполнить запрос');
      setResults(null);
      setBaselineResults(null);
    } finally {
      if (!ctl.signal.aborted) setIsLoading(false);
    }
  };

  return (
    <section
      id="section-preview"
      className="scroll-mt-20 rounded-notion border border-notion-border bg-notion-bg p-6"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-notion-text">
          Тест-превью результатов
        </h2>
        <span className="text-xs text-notion-text-tertiary">
          применяет текущие настройки только к этому запросу
        </span>
      </div>
      <p className="mt-1 text-sm text-notion-text-secondary">
        Запрос ранжируется на лету с текущими настройками, сохранять не нужно.
        Включите режим сравнения и увидите, насколько каждый документ поднялся или
        упал по сравнению с последним сохранением.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr,auto]">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-notion-text-tertiary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') runSearch();
            }}
            placeholder="Например: квантовая механика"
            className="h-10 w-full rounded-notion border border-notion-border bg-notion-bg pl-9 pr-3 text-sm text-notion-text placeholder:text-notion-text-tertiary outline-none transition-colors focus:border-notion-accent focus:ring-2 focus:ring-notion-accent/20"
          />
        </div>
        <button
          type="button"
          onClick={runSearch}
          disabled={isLoading || !query.trim()}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-notion bg-notion-text px-4 text-sm font-medium text-white transition-colors hover:bg-notion-text/90 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Поиск
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        <label className="flex items-center gap-2 text-notion-text-secondary">
          <span>Пользователь:</span>
          <select
            value={userId ?? ''}
            onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : null)}
            disabled={!enablePersonalization || users.length === 0}
            className="h-7 rounded-notion border border-notion-border bg-notion-bg px-2 text-xs text-notion-text outline-none focus:border-notion-accent disabled:opacity-50"
          >
            {users.length === 0 && <option value="">— нет —</option>}
            {users.map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {u.username} · {roleShort(u.role)}
                {u.specialization ? ` · ${u.specialization}` : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-notion-text-secondary">
          <Switch
            checked={enablePersonalization}
            onCheckedChange={setEnablePersonalization}
          />
          <span>Персонализация</span>
        </label>
        {baselineWeights && (
          <label className="flex items-center gap-2 text-notion-text-secondary">
            <Switch checked={showBaseline} onCheckedChange={setShowBaseline} />
            <span>Сравнить с последним сохранением</span>
          </label>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-notion border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {touched && !isLoading && results && results.length === 0 && (
        <div className="mt-4 rounded-notion border border-notion-border bg-notion-bg-secondary p-4 text-center text-sm text-notion-text-secondary">
          Ничего не найдено
        </div>
      )}

      {results && results.length > 0 && (
        <ol className="mt-4 space-y-2">
          {results.map((entry) => (
            <ResultCard
              key={entry.doc.document_id}
              entry={entry}
              expanded={expandedId === entry.doc.document_id}
              onToggle={() =>
                setExpandedId((cur) =>
                  cur === entry.doc.document_id ? null : entry.doc.document_id,
                )
              }
              showBaselineBadge={showBaseline && baselineResults !== null}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

function ResultCard({
  entry,
  expanded,
  onToggle,
  showBaselineBadge,
}: {
  entry: PreviewResult;
  expanded: boolean;
  onToggle: () => void;
  showBaselineBadge: boolean;
}) {
  const r = entry.doc;
  return (
    <li className="rounded-notion border border-notion-border bg-notion-bg-secondary">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 p-3 text-left transition-colors hover:bg-notion-bg-hover"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <PositionChip n={r.position} size="sm" />
            {showBaselineBadge && <DeltaBadge delta={entry.delta ?? null} />}
            <h3 className="truncate text-sm font-medium text-notion-text">
              {r.title || 'Без названия'}
            </h3>
          </div>
          {r.authors && (
            <p className="mt-0.5 truncate text-xs text-notion-text-tertiary">{r.authors}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
          <span className="rounded-notion bg-notion-accent-light px-1.5 text-[11px] font-semibold tabular-nums text-notion-accent">
            {r.final_score.toFixed(2)}
          </span>
          <ChevronRight
            className={`h-3.5 w-3.5 text-notion-text-tertiary transition-transform ${
              expanded ? 'rotate-90' : ''
            }`}
          />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-notion-border bg-notion-bg p-3">
          <ScoreBreakdown doc={r} compact />
        </div>
      )}
    </li>
  );
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <span
        className="inline-flex h-5 items-center gap-0.5 rounded-notion bg-emerald-50 px-1.5 text-[10px] font-medium text-emerald-700"
        title="Этого документа не было в Top-5 baseline"
      >
        новый
      </span>
    );
  }
  if (delta === 0) {
    return (
      <span
        className="inline-flex h-5 items-center gap-0.5 rounded-notion bg-notion-bg-secondary px-1 text-[10px] tabular-nums text-notion-text-tertiary"
        title="Позиция не изменилась"
      >
        <Minus className="h-3 w-3" />0
      </span>
    );
  }
  if (delta > 0) {
    return (
      <span
        className="inline-flex h-5 items-center gap-0.5 rounded-notion bg-emerald-50 px-1 text-[10px] font-medium tabular-nums text-emerald-700"
        title={`Поднялся на ${delta} позиций`}
      >
        <ArrowUp className="h-3 w-3" />
        {delta}
      </span>
    );
  }
  return (
    <span
      className="inline-flex h-5 items-center gap-0.5 rounded-notion bg-amber-50 px-1 text-[10px] font-medium tabular-nums text-amber-700"
      title={`Опустился на ${Math.abs(delta)} позиций`}
    >
      <ArrowDown className="h-3 w-3" />
      {Math.abs(delta)}
    </span>
  );
}

function roleShort(role: string): string {
  switch (role) {
    case 'bachelor': return 'бак.';
    case 'master': return 'маг.';
    case 'phd': return 'асп.';
    case 'professor': return 'преп.';
    default: return role;
  }
}
