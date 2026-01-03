import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ParsedAuthors {
  mainAuthor: string;
  otherAuthors: string[];
  all: string[];
}

export function parseAuthors(authorsStr: string | undefined | null): ParsedAuthors {
  if (!authorsStr) {
    return { mainAuthor: '', otherAuthors: [], all: [] };
  }

  const authorsList = authorsStr.split(',').map(a => a.trim()).filter(Boolean);

  return {
    mainAuthor: authorsList[0] || '',
    otherAuthors: authorsList.slice(1),
    all: authorsList,
  };
}

export function formatOtherAuthors(otherAuthors: string[], maxVisible: number = 2): string {
  if (otherAuthors.length === 0) return '';
  if (otherAuthors.length <= maxVisible) {
    return otherAuthors.join(', ');
  }
  return `${otherAuthors.slice(0, maxVisible).join(', ')} и ещё ${otherAuthors.length - maxVisible}`;
}
