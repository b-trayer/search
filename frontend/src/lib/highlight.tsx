
import React from 'react';

export function highlightText(
  text: string,
  query: string
): React.ReactNode {
  if (!query.trim() || !text) return text;

  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (words.length === 0) return text;

  const regex = new RegExp(`(${words.join('|')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (words.some((word) => part.toLowerCase() === word)) {
      return (
        <mark
          key={i}
          className="bg-yellow-200 text-notion-text px-0.5 rounded"
        >
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
