import { describe, it, expect } from 'vitest';
import {
  buildDiffEntries,
  isMatrixCellChanged,
  isMatrixRowChanged,
  isSpecializationChanged,
  isTopicScoreChanged,
  isWeightChanged,
  normalizeAlphas,
  normalizeRow,
} from './changes';
import { initialSettingsData, type SettingsData } from './types';

const baseWeights = {
  w_user: 1.5,
  alpha_type: 0.4,
  alpha_topic: 0.6,
  beta_ctr: 0.5,
  ctr_alpha_prior: 1,
  ctr_beta_prior: 10,
};

const data: SettingsData = {
  ...initialSettingsData,
  weights: { ...baseWeights, w_user: 2 },
  originalWeights: { ...baseWeights },
  presetMap: {},
  customPresets: [],
  roleTypeMatrix: { bachelor: { textbook: 0.6, article: 0.4 } },
  originalRoleTypeMatrix: { bachelor: { textbook: 0.5, article: 0.5 } },
  topicScores: { direct_match: 0.9, keyword_match: 0.8 },
  originalTopicScores: { direct_match: 1, keyword_match: 0.8 },
  specializationTopics: { Физика: ['физик', 'квант'] },
  originalSpecializationTopics: { Физика: ['физик'] },
};

describe('change detection', () => {
  it('detects changed and unchanged weights', () => {
    expect(isWeightChanged(data, 'w_user')).toBe(true);
    expect(isWeightChanged(data, 'alpha_type')).toBe(false);
  });

  it('detects changed matrix cells and rows', () => {
    expect(isMatrixCellChanged(data, 'bachelor', 'textbook')).toBe(true);
    expect(isMatrixCellChanged(data, 'bachelor', 'monograph')).toBe(false);
    expect(isMatrixRowChanged(data, 'bachelor')).toBe(true);
  });

  it('detects topic score changes', () => {
    expect(isTopicScoreChanged(data, 'direct_match')).toBe(true);
    expect(isTopicScoreChanged(data, 'keyword_match')).toBe(false);
  });

  it('detects specialization changes', () => {
    expect(isSpecializationChanged(data, 'Физика')).toBe(true);
  });
});

describe('buildDiffEntries', () => {
  it('groups all change types', () => {
    const entries = buildDiffEntries(data);
    const groups = new Set(entries.map((e) => e.group));
    expect(groups.has('weights')).toBe(true);
    expect(groups.has('matrix')).toBe(true);
    expect(groups.has('topics')).toBe(true);
    expect(groups.has('specializations')).toBe(true);
  });

  it('formats numbers and labels correctly', () => {
    const entries = buildDiffEntries(data);
    const wEntry = entries.find((e) => e.group === 'weights' && e.label === 'w_user');
    expect(wEntry?.before).toBe('1.50');
    expect(wEntry?.after).toBe('2');

    const mEntry = entries.find((e) => e.group === 'matrix');
    expect(mEntry?.label).toMatch(/bachelor/);
  });
});

describe('normalize helpers', () => {
  it('normalizeRow scales to sum=1', () => {
    const out = normalizeRow({ a: 0.3, b: 0.3, c: 0.4 });
    const sum = out.a + out.b + out.c;
    expect(sum).toBeCloseTo(1, 2);

    const out2 = normalizeRow({ a: 1, b: 1, c: 2 });
    expect(out2.a).toBeCloseTo(0.25, 2);
    expect(out2.c).toBeCloseTo(0.5, 2);
  });

  it('normalizeRow returns copy when sum is 0', () => {
    expect(normalizeRow({ a: 0, b: 0 })).toEqual({ a: 0, b: 0 });
  });

  it('normalizeAlphas scales to sum=1', () => {
    const out = normalizeAlphas(0.7, 0.7);
    expect(out.alpha_type + out.alpha_topic).toBeCloseTo(1, 2);
    expect(out.alpha_type).toBeCloseTo(0.5, 2);
  });

  it('normalizeAlphas falls back to 0.5/0.5 when both are zero', () => {
    expect(normalizeAlphas(0, 0)).toEqual({ alpha_type: 0.5, alpha_topic: 0.5 });
  });
});
