import { describe, it, expect } from 'vitest';
import { getPositionChange } from './use-compare';
import type { DocumentResult } from '@/lib/types';

const createMockResult = (id: string): DocumentResult => ({
  document_id: id,
  title: `Document ${id}`,
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
});

describe('getPositionChange', () => {
  const results1 = [
    createMockResult('doc1'),
    createMockResult('doc2'),
    createMockResult('doc3'),
  ];

  const results2 = [
    createMockResult('doc3'),
    createMockResult('doc1'),
    createMockResult('doc2'),
  ];

  it('returns null if document not in other results', () => {
    const change = getPositionChange('doc4', results1, results2);
    expect(change).toBeNull();
  });

  it('returns positive when document moved up in current', () => {
    const change = getPositionChange('doc3', results2, results1);
    expect(change).toBe(2);
  });

  it('returns negative when document moved down in current', () => {
    const change = getPositionChange('doc1', results2, results1);
    expect(change).toBe(-1);
  });

  it('returns 0 when position unchanged', () => {
    const change = getPositionChange('doc1', results1, results1);
    expect(change).toBe(0);
  });

  it('returns null when document not in current results', () => {
    const change = getPositionChange('doc1', [], results1);
    expect(change).toBe(1);
  });

  it('returns null when other results empty', () => {
    const change = getPositionChange('doc1', results1, []);
    expect(change).toBeNull();
  });
});
