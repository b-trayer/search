
import React from 'react';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

function getAllowedFuzziness(wordLength: number): number {
  if (wordLength <= 2) return 0;
  if (wordLength <= 5) return 1;
  return 2;
}

function isFuzzyMatch(word: string, queryWord: string): boolean {
  const w = word.toLowerCase();
  const q = queryWord.toLowerCase();
  if (w === q) return false;
  const allowed = getAllowedFuzziness(q.length);
  if (allowed === 0) return false;
  return levenshtein(w, q) <= allowed;
}

export function highlightText(
  text: string | null | undefined,
  query: string
): React.ReactNode {
  if (!text || typeof text !== 'string') return text || '';
  if (!query.trim()) return text;

  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (queryWords.length === 0) return text;

  const textWords = text.split(/(\s+)/);

  return textWords.map((part, i) => {
    if (/^\s+$/.test(part)) return part;

    const partLower = part.toLowerCase().replace(/[.,!?;:()]/g, '');
    if (partLower.length < 3) return part;

    if (queryWords.some((qw) => partLower === qw)) {
      return (
        <mark key={i} className="bg-yellow-200 text-notion-text px-0.5 rounded">
          {part}
        </mark>
      );
    }

    if (queryWords.some((qw) => isFuzzyMatch(partLower, qw))) {
      return (
        <mark key={i} className="bg-orange-200 text-notion-text px-0.5 rounded">
          {part}
        </mark>
      );
    }

    return part;
  });
}

export function getCollectionColor(collection: string): string {
  const c = collection.toLowerCase();
  if (c.includes('учебн'))
    return 'bg-notion-accent-light text-notion-accent border-notion-accent/20';
  if (c.includes('редк'))
    return 'bg-amber-50 text-amber-700 border-amber-200';
  if (c.includes('науч') || c.includes('статьи'))
    return 'bg-green-50 text-green-700 border-green-200';
  if (c.includes('диссерт'))
    return 'bg-purple-50 text-purple-700 border-purple-200';
  if (c.includes('периодич') || c.includes('журнал'))
    return 'bg-pink-50 text-pink-700 border-pink-200';
  return 'bg-notion-bg-secondary text-notion-text-secondary border-notion-border';
}
