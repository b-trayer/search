

export interface User {
  user_id: number;
  username: string;
  email: string;
  role: 'student' | 'master' | 'phd' | 'professor';
  specialization: string | null;
  course: number | null;
  interests: string[] | null;
}

export interface UserProfile {
  user_id: number;
  username: string;
  role: string;
  specialization: string | null;
  faculty: string | null;
  course: number | null;
  interests: string[] | null;
}


export interface SearchFilters {
  collection?: string;
  language?: string;
  document_type?: string | string[];
  knowledge_area?: string;
  source?: string;
  has_pdf?: boolean;
}

export interface DocumentResult {
  document_id: string;
  title: string;
  authors: string;
  url: string;
  cover: string;
  collection: string;
  subject_area: string;
  subjects: string[];
  organization: string;
  publication_info: string;
  language: string;
  source: string;
  year: number | null;
  document_type: string;

  base_score: number;
  log_bm25: number;
  f_type: number;
  f_topic: number;
  f_user: number;
  user_contrib: number;
  smoothed_ctr: number;
  ctr_factor: number;
  ctr_contrib: number;
  ctr_boost: number;
  final_score: number;
  position: number;
  highlights: Record<string, string[]>;
  clicks: number;
  impressions: number;
  weights?: {
    w_user: number;
    alpha_type: number;
    alpha_topic: number;
    beta_ctr: number;
    ctr_alpha_prior: number;
    ctr_beta_prior: number;
  };
}

export interface SearchResponse {
  query: string;
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  results: DocumentResult[];
  personalized: boolean;
  user_profile: UserProfile | null;
}

export interface SearchStats {
  totalResults: number;
  avgCTR: number;
  impressions: number;
}


export interface RankingWeights {
  w_user: number;
  alpha_type: number;
  alpha_topic: number;
  beta_ctr: number;
  ctr_alpha_prior: number;
  ctr_beta_prior: number;
}

export type WeightPreset = 'default' | 'high_personalization' | 'high_ctr' | 'bm25_only';

export interface WeightPresetInfo {
  name: WeightPreset;
  weights: RankingWeights;
}

export interface PresetsResponse {
  presets: WeightPresetInfo[];
  current: WeightPreset | null;
}


export interface FilterItem {
  name: string;
  count: number;
}

export interface FilterOptions {
  collections: FilterItem[];
  knowledge_areas: FilterItem[];
  document_types: FilterItem[];
  languages: FilterItem[];
  sources: FilterItem[];
  has_pdf: { with_pdf: number; without_pdf: number };
}

export interface ActiveFilters {
  collections: string[];
  subjects: string[];
  languages: string[];
}


export interface ClickData {
  query: string;
  user_id: number | null;
  document_id: string;
  position: number;
  session_id?: string;
  dwell_time?: number;
}
