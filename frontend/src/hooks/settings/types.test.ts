import { describe, it, expect } from 'vitest';
import { checkHasChanges, deepClone, initialSettingsData, type SettingsData } from './types';

describe('initialSettingsData', () => {
  it('has correct default values', () => {
    expect(initialSettingsData.weights).toBeNull();
    expect(initialSettingsData.isLoading).toBe(true);
    expect(initialSettingsData.isSaving).toBe(false);
    expect(initialSettingsData.hasChanges).toBe(false);
  });
});

describe('checkHasChanges', () => {
  const baseData: SettingsData = {
    ...initialSettingsData,
    weights: { w_user: 1.5, alpha_type: 0.4, alpha_topic: 0.6, beta_ctr: 0.5, ctr_alpha_prior: 1, ctr_beta_prior: 10 },
    originalWeights: { w_user: 1.5, alpha_type: 0.4, alpha_topic: 0.6, beta_ctr: 0.5, ctr_alpha_prior: 1, ctr_beta_prior: 10 },
    roleTypeMatrix: { student: { textbook: 0.5 } },
    originalRoleTypeMatrix: { student: { textbook: 0.5 } },
    topicScores: { Математика: 0.8 },
    originalTopicScores: { Математика: 0.8 },
    specializationTopics: { Физика: ['физик', 'механик'] },
    originalSpecializationTopics: { Физика: ['физик', 'механик'] },
  };

  it('returns false when no changes', () => {
    expect(checkHasChanges(baseData)).toBe(false);
  });

  it('returns true when weights changed', () => {
    const data = {
      ...baseData,
      weights: { ...baseData.weights!, w_user: 2.0 },
    };
    expect(checkHasChanges(data)).toBe(true);
  });

  it('returns true when roleTypeMatrix changed', () => {
    const data = {
      ...baseData,
      roleTypeMatrix: { student: { textbook: 0.7 } },
    };
    expect(checkHasChanges(data)).toBe(true);
  });

  it('returns true when topicScores changed', () => {
    const data = {
      ...baseData,
      topicScores: { Математика: 0.9 },
    };
    expect(checkHasChanges(data)).toBe(true);
  });

  it('returns true when specializationTopics changed', () => {
    const data = {
      ...baseData,
      specializationTopics: { Физика: ['физик'] },
    };
    expect(checkHasChanges(data)).toBe(true);
  });
});

describe('deepClone', () => {
  it('creates a deep copy of an object', () => {
    const original = { a: 1, b: { c: 2 } };
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.b).not.toBe(original.b);
  });

  it('handles arrays', () => {
    const original = [1, [2, 3]];
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned[1]).not.toBe(original[1]);
  });

  it('handles null values', () => {
    const original = { a: null, b: 1 };
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
  });
});
