import { describe, it, expect } from 'vitest';
import { countPendingChanges } from './diff';
import { initialSettingsData, type SettingsData } from './types';

const baseWeights = {
  w_user: 1.5,
  alpha_type: 0.4,
  alpha_topic: 0.6,
  beta_ctr: 0.5,
  ctr_alpha_prior: 1,
  ctr_beta_prior: 10,
};

const baseData: SettingsData = {
  ...initialSettingsData,
  weights: { ...baseWeights },
  originalWeights: { ...baseWeights },
  presetMap: {},
  customPresets: [],
  roleTypeMatrix: { bachelor: { textbook: 0.5, article: 0.5 } },
  originalRoleTypeMatrix: { bachelor: { textbook: 0.5, article: 0.5 } },
  topicScores: { direct_match: 1, keyword_match: 0.8 },
  originalTopicScores: { direct_match: 1, keyword_match: 0.8 },
  specializationTopics: { Физика: ['физик'], Математика: ['алгебр'] },
  originalSpecializationTopics: { Физика: ['физик'], Математика: ['алгебр'] },
};

describe('countPendingChanges', () => {
  it('returns 0 when nothing changed', () => {
    expect(countPendingChanges(baseData)).toBe(0);
  });

  it('counts a single weight change', () => {
    const data = { ...baseData, weights: { ...baseWeights, w_user: 2 } };
    expect(countPendingChanges(data)).toBe(1);
  });

  it('counts multiple weight changes', () => {
    const data = {
      ...baseData,
      weights: { ...baseWeights, w_user: 2, alpha_type: 0.7 },
    };
    expect(countPendingChanges(data)).toBe(2);
  });

  it('counts a single matrix cell change', () => {
    const data = {
      ...baseData,
      roleTypeMatrix: { bachelor: { textbook: 0.6, article: 0.5 } },
    };
    expect(countPendingChanges(data)).toBe(1);
  });

  it('counts a topic score change', () => {
    const data = {
      ...baseData,
      topicScores: { direct_match: 0.9, keyword_match: 0.8 },
    };
    expect(countPendingChanges(data)).toBe(1);
  });

  it('counts a specialization topics change', () => {
    const data = {
      ...baseData,
      specializationTopics: { Физика: ['физик', 'квант'], Математика: ['алгебр'] },
    };
    expect(countPendingChanges(data)).toBe(1);
  });

  it('aggregates changes across all groups', () => {
    const data = {
      ...baseData,
      weights: { ...baseWeights, w_user: 2 },
      roleTypeMatrix: { bachelor: { textbook: 0.6, article: 0.4 } },
      topicScores: { direct_match: 0.9, keyword_match: 0.8 },
      specializationTopics: { Физика: ['физик', 'квант'], Математика: ['алгебр'] },
    };
    expect(countPendingChanges(data)).toBe(1 + 2 + 1 + 1);
  });
});
