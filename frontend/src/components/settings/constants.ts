import type { RankingWeights, WeightPreset } from '@/lib/types';

export interface WeightConfigItem {
  key: keyof RankingWeights;
  labelKey: string;
  descKey: string;
  tipKey?: string;
  min: number;
  max: number;
  step: number;
}

export const WEIGHT_CONFIG: WeightConfigItem[] = [
  { key: 'w_user', labelKey: 'weight.label.w_user', descKey: 'weight.desc.w_user', tipKey: 'weight.tip.w_user', min: 0, max: 5, step: 0.1 },
  { key: 'alpha_type', labelKey: 'weight.label.alpha_type', descKey: 'weight.desc.alpha_type', tipKey: 'weight.tip.alpha_type', min: 0, max: 1, step: 0.05 },
  { key: 'alpha_topic', labelKey: 'weight.label.alpha_topic', descKey: 'weight.desc.alpha_topic', tipKey: 'weight.tip.alpha_topic', min: 0, max: 1, step: 0.05 },
  { key: 'beta_ctr', labelKey: 'weight.label.beta_ctr', descKey: 'weight.desc.beta_ctr', tipKey: 'weight.tip.beta_ctr', min: 0, max: 3, step: 0.1 },
  { key: 'ctr_alpha_prior', labelKey: 'weight.label.ctr_alpha_prior', descKey: 'weight.desc.ctr_alpha_prior', tipKey: 'weight.tip.ctr_alpha_prior', min: 0, max: 10, step: 0.5 },
  { key: 'ctr_beta_prior', labelKey: 'weight.label.ctr_beta_prior', descKey: 'weight.desc.ctr_beta_prior', tipKey: 'weight.tip.ctr_beta_prior', min: 1, max: 100, step: 1 },
];

export const PRESET_LABEL_KEYS: Record<WeightPreset, string> = {
  default: 'preset.default',
  high_personalization: 'preset.high_personalization',
  high_ctr: 'preset.high_ctr',
  bm25_only: 'preset.bm25_only',
};

export const ROLE_LABEL_KEYS: Record<string, string> = {
  bachelor: 'role.bachelor',
  master: 'role.master',
  phd: 'role.phd',
  professor: 'role.professor',
};

export const DOC_TYPE_LABEL_KEYS: Record<string, string> = {
  textbook: 'doctype.textbook',
  tutorial: 'doctype.tutorial',
  monograph: 'doctype.monograph',
  dissertation: 'doctype.dissertation',
  article: 'doctype.article',
};

export const TOPIC_SCORE_LABEL_KEYS: Record<string, string> = {
  direct_match: 'topicScores.directMatch',
  keyword_match: 'topicScores.keywordMatch',
};
