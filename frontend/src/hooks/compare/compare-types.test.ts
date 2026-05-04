import { describe, it, expect } from 'vitest';
import {
  calculateStats,
  spearmanOnIntersection,
  formatSigned,
} from './compare-types';
import type { DocumentResult } from '@/lib/types';

function makeDoc(
  id: string,
  overrides: Partial<DocumentResult> = {},
): DocumentResult {
  return {
    document_id: id,
    title: `Doc ${id}`,
    authors: 'Author',
    url: '',
    cover: null,
    collection: null,
    subject_area: null,
    subjects: [],
    organization: null,
    publication_info: null,
    language: 'ru',
    source: 'test',
    year: 2024,
    document_type: 'book',
    highlights: {},
    position: 1,
    base_score: 10,
    log_bm25: 2,
    f_type: 0,
    f_topic: 0,
    f_user: 0,
    user_contrib: 0,
    smoothed_ctr: 0,
    ctr_factor: 0,
    ctr_contrib: 0,
    ctr_boost: 1,
    final_score: 10,
    clicks: 0,
    impressions: 0,
    weights: {
      w_user: 1.5,
      alpha_type: 0.4,
      alpha_topic: 0.6,
      beta_ctr: 0.5,
      ctr_alpha_prior: 1,
      ctr_beta_prior: 10,
    },
    ...overrides,
  };
}

describe('calculateStats', () => {
  it('returns null when one side is empty', () => {
    expect(calculateStats([], [makeDoc('a')])).toBeNull();
    expect(calculateStats([makeDoc('a')], [])).toBeNull();
  });

  it('counts intersection and unique docs per side', () => {
    const left = [makeDoc('a'), makeDoc('b'), makeDoc('c')];
    const right = [makeDoc('b'), makeDoc('c'), makeDoc('d')];

    const stats = calculateStats(left, right)!;
    expect(stats.common).toBe(2);
    expect(stats.total).toBe(3);
    expect(stats.uniqueLeft).toBe(1);
    expect(stats.uniqueRight).toBe(1);
  });

  it('averages user_contrib and final_score per side', () => {
    const left = [
      makeDoc('a', { user_contrib: 0.2, final_score: 5 }),
      makeDoc('b', { user_contrib: 0.4, final_score: 7 }),
    ];
    const right = [
      makeDoc('a', { user_contrib: -0.1, final_score: 3 }),
      makeDoc('c', { user_contrib: 0.5, final_score: 4 }),
    ];

    const stats = calculateStats(left, right)!;
    expect(stats.avgPersonalization1).toBeCloseTo(0.3);
    expect(stats.avgPersonalization2).toBeCloseTo(0.2);
    expect(stats.avgFinalScore1).toBeCloseTo(6);
    expect(stats.avgFinalScore2).toBeCloseTo(3.5);
  });
});

describe('spearmanOnIntersection', () => {
  it('returns 1 when both rankings are identical on common docs', () => {
    const left = [makeDoc('a'), makeDoc('b'), makeDoc('c'), makeDoc('d')];
    const right = [makeDoc('a'), makeDoc('b'), makeDoc('c')];

    expect(spearmanOnIntersection(left, right)).toBeCloseTo(1, 6);
  });

  it('returns -1 when rankings are perfectly reversed on intersection', () => {
    const left = [makeDoc('a'), makeDoc('b'), makeDoc('c')];
    const right = [makeDoc('c'), makeDoc('b'), makeDoc('a')];

    expect(spearmanOnIntersection(left, right)).toBeCloseTo(-1, 6);
  });

  it('returns null when intersection is smaller than 2 documents', () => {
    expect(spearmanOnIntersection([makeDoc('a')], [makeDoc('a')])).toBeNull();
    expect(spearmanOnIntersection([makeDoc('a')], [makeDoc('b')])).toBeNull();
  });
});

describe('formatSigned', () => {
  it('prepends + only for positive numbers', () => {
    expect(formatSigned(0.123)).toBe('+0.123');
    expect(formatSigned(-0.123)).toBe('-0.123');
    expect(formatSigned(0)).toBe('0.000');
  });

  it('respects fractionDigits parameter', () => {
    expect(formatSigned(1.5678, 1)).toBe('+1.6');
    expect(formatSigned(-2.345, 2)).toBe('-2.35');
  });

  it('returns dash for NaN', () => {
    expect(formatSigned(Number.NaN)).toBe('—');
  });
});
