import { describe, it, expect } from 'vitest';
import { buildExport, parseImport } from './io';
import { initialSettingsData, type SettingsData } from './types';

const data: SettingsData = {
  ...initialSettingsData,
  weights: {
    w_user: 1.5, alpha_type: 0.4, alpha_topic: 0.6,
    beta_ctr: 0.5, ctr_alpha_prior: 1, ctr_beta_prior: 10,
  },
  originalWeights: null,
  presetMap: {},
  customPresets: [],
  roleTypeMatrix: { bachelor: { textbook: 0.5, article: 0.5 } },
  originalRoleTypeMatrix: null,
  topicScores: { direct_match: 1, keyword_match: 0.8 },
  originalTopicScores: null,
  specializationTopics: { Физика: ['физик'] },
  originalSpecializationTopics: null,
};

describe('buildExport', () => {
  it('returns null when payload is incomplete', () => {
    const partial = { ...data, weights: null };
    expect(buildExport(partial)).toBeNull();
  });

  it('returns a versioned snapshot when complete', () => {
    const out = buildExport(data);
    expect(out).not.toBeNull();
    expect(out!.version).toBe(1);
    expect(out!.weights).toEqual(data.weights);
    expect(out!.role_type_matrix).toEqual(data.roleTypeMatrix);
    expect(out!.topic_scores).toEqual(data.topicScores);
    expect(out!.specialization_topics).toEqual(data.specializationTopics);
    expect(typeof out!.exported_at).toBe('string');
  });
});

describe('parseImport', () => {
  it('rejects non-JSON', () => {
    const r = parseImport('not json');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/JSON/);
  });

  it('rejects non-object roots', () => {
    const r = parseImport('123');
    expect(r.ok).toBe(false);
  });

  it('rejects when required fields missing', () => {
    const r = parseImport(JSON.stringify({ weights: {} }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/role_type_matrix/);
  });

  it('accepts a complete payload', () => {
    const payload = {
      version: 1,
      exported_at: '2026-01-01',
      weights: data.weights,
      role_type_matrix: data.roleTypeMatrix,
      topic_scores: data.topicScores,
      specialization_topics: data.specializationTopics,
    };
    const r = parseImport(JSON.stringify(payload));
    expect(r.ok).toBe(true);
    expect(r.payload?.weights).toEqual(data.weights);
  });
});
