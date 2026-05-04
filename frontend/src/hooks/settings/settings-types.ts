import type { RankingWeights, WeightPreset } from '@/lib/types';

export const DEFAULT_WEIGHTS: RankingWeights = {
  w_user: 1.5,
  alpha_type: 0.4,
  alpha_topic: 0.6,
  beta_ctr: 0.5,
  ctr_alpha_prior: 1.0,
  ctr_beta_prior: 10.0,
};

export interface UseSettingsReturn {
  weights: RankingWeights;
  preset: WeightPreset | null;
  isModified: boolean;
  isLoading: boolean;
  error: string | null;
  updateWeight: <K extends keyof RankingWeights>(key: K, value: number) => void;
  applyPreset: (preset: WeightPreset) => Promise<void>;
  save: () => Promise<void>;
  reset: () => Promise<void>;
  reload: () => Promise<void>;
}
