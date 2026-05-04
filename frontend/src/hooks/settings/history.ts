import type { SettingsExport } from './io';

const STORAGE_KEY = 'ranking-settings-history-v1';
const MAX_ENTRIES = 10;

export interface HistoryEntry {
  id: string;
  saved_at: string;
  snapshot: Omit<SettingsExport, 'version' | 'exported_at'>;
}

function safeParse(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function readHistory(): HistoryEntry[] {
  return safeParse();
}

export function pushHistory(snapshot: HistoryEntry['snapshot']): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  const list = safeParse();
  const entry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    saved_at: new Date().toISOString(),
    snapshot,
  };
  const next = [entry, ...list].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    void 0;
  }
  return next;
}

export function removeHistoryEntry(id: string): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  const next = safeParse().filter((e) => e.id !== id);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    void 0;
  }
  return next;
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    void 0;
  }
}
