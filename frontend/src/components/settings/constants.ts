import type { RankingWeights, WeightPreset } from '@/lib/types';

export const WEIGHT_CONFIG: Array<{
  key: keyof RankingWeights;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: 'w_user', label: 'Персонализация (w_user)', description: 'Общий вес персонализации', min: 0, max: 5, step: 0.1 },
  { key: 'alpha_type', label: 'Тип документа (α₁)', description: 'Вес типа документа', min: 0, max: 1, step: 0.05 },
  { key: 'alpha_topic', label: 'Тема (α₂)', description: 'Вес темы', min: 0, max: 1, step: 0.05 },
  { key: 'beta_ctr', label: 'CTR (β)', description: 'Вес кликабельности', min: 0, max: 3, step: 0.1 },
  { key: 'ctr_alpha_prior', label: 'CTR α prior', description: 'Псевдо-клики', min: 0, max: 10, step: 0.5 },
  { key: 'ctr_beta_prior', label: 'CTR β prior', description: 'Псевдо-показы', min: 1, max: 100, step: 1 },
];

export const PRESET_LABELS: Record<WeightPreset, string> = {
  default: 'По умолчанию',
  high_personalization: 'Высокая персонализация',
  high_ctr: 'Высокий CTR',
  bm25_only: 'Только BM25',
};

export const ROLE_LABELS: Record<string, string> = {
  student: 'Студент',
  master: 'Магистр',
  phd: 'Аспирант',
  professor: 'Профессор',
};

export const DOC_TYPE_LABELS: Record<string, string> = {
  textbook: 'Учебник',
  tutorial: 'Практикум',
  monograph: 'Монография',
  dissertation: 'Диссертация',
  article: 'Статья',
};

export const TOPIC_SCORE_LABELS: Record<string, string> = {
  direct_match: 'Прямое совпадение специализации',
  keyword_match: 'Совпадение ключевых слов',
  interest_match: 'Совпадение интересов',
};
