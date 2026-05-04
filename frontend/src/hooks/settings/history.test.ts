import { describe, it, expect, beforeEach } from 'vitest';
import { pushHistory, readHistory, removeHistoryEntry, clearHistory } from './history';

const baseSnapshot = {
  weights: {
    w_user: 1, alpha_type: 0.5, alpha_topic: 0.5,
    beta_ctr: 0.5, ctr_alpha_prior: 1, ctr_beta_prior: 10,
  },
  role_type_matrix: { bachelor: { textbook: 1 } },
  topic_scores: { direct_match: 1, keyword_match: 0.8 },
  specialization_topics: { Физика: ['физик'] },
};

describe('history', () => {
  beforeEach(() => {
    clearHistory();
  });

  it('starts empty', () => {
    expect(readHistory()).toEqual([]);
  });

  it('pushes new entries to the front', async () => {
    pushHistory(baseSnapshot);
    await new Promise((r) => setTimeout(r, 5));
    pushHistory({ ...baseSnapshot, weights: { ...baseSnapshot.weights, w_user: 2 } });
    const list = readHistory();
    expect(list).toHaveLength(2);
    expect(list[0].snapshot.weights.w_user).toBe(2);
    expect(list[1].snapshot.weights.w_user).toBe(1);
  });

  it('caps at 10 entries', () => {
    for (let i = 0; i < 12; i++) {
      pushHistory({ ...baseSnapshot, weights: { ...baseSnapshot.weights, w_user: i } });
    }
    expect(readHistory()).toHaveLength(10);
  });

  it('removes entry by id', () => {
    pushHistory(baseSnapshot);
    const [entry] = readHistory();
    const next = removeHistoryEntry(entry.id);
    expect(next).toEqual([]);
    expect(readHistory()).toEqual([]);
  });

  it('clears all history', () => {
    pushHistory(baseSnapshot);
    pushHistory(baseSnapshot);
    clearHistory();
    expect(readHistory()).toEqual([]);
  });
});
