import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ScoreBreakdown } from './score-breakdown';
import type { DocumentResult } from '@/lib/types';

function makeDoc(overrides: Partial<DocumentResult> = {}): DocumentResult {
  return {
    document_id: 'doc-1',
    title: 'Sample',
    authors: '',
    url: '',
    cover: '',
    collection: '',
    subject_area: '',
    subjects: [],
    organization: '',
    publication_info: '',
    language: 'ru',
    source: 'nsu',
    year: 2020,
    document_type: 'textbook',
    highlights: {},
    position: 1,
    base_score: 10,
    log_bm25: 4.379,
    f_type: 0.5,
    f_topic: 1.0,
    f_user: 0.8,
    user_contrib: 1.2,
    smoothed_ctr: 0.0909,
    ctr_factor: 0.647,
    ctr_contrib: 0.323,
    ctr_boost: 1.647,
    final_score: 5.902,
    clicks: 1,
    impressions: 5,
    display_ctr: 0.2,
    weights: {
      w_user: 1.5,
      alpha_type: 0.4,
      alpha_topic: 0.6,
      beta_ctr: 0.5,
      ctr_alpha_prior: 1.0,
      ctr_beta_prior: 10.0,
    },
    ...overrides,
  } as DocumentResult;
}

describe('ScoreBreakdown', () => {
  describe('full variant', () => {
    it('shows the formula header', () => {
      const { getByText } = render(<ScoreBreakdown doc={makeDoc()} />);
      expect(getByText(/score = log\(1\+BM25\)/)).toBeInTheDocument();
      expect(getByText(/log\(1\+10·CTR̃\)/)).toBeInTheDocument();
    });

    it('renders personalisation and CTR sub-blocks', () => {
      const { getByText } = render(<ScoreBreakdown doc={makeDoc()} />);
      expect(getByText('Персонализация f(U,D)')).toBeInTheDocument();
      expect(getByText('CTR компонент')).toBeInTheDocument();
    });

    it('shows the final score with rounding footnote', () => {
      const { getByText } = render(<ScoreBreakdown doc={makeDoc()} />);
      expect(getByText('5.902')).toBeInTheDocument();
      expect(getByText(/неокругленных компонент/)).toBeInTheDocument();
    });

    it('hides personalisation and CTR sub-blocks without weights', () => {
      const { queryByText } = render(
        <ScoreBreakdown doc={makeDoc({ weights: undefined })} />,
      );
      expect(queryByText('Персонализация f(U,D)')).not.toBeInTheDocument();
      expect(queryByText('CTR компонент')).not.toBeInTheDocument();
    });
  });

  describe('compact variant', () => {
    it('renders five rows with key labels', () => {
      const { getByText } = render(<ScoreBreakdown doc={makeDoc()} compact />);
      expect(getByText('log(1+BM25)')).toBeInTheDocument();
      expect(getByText('f_type')).toBeInTheDocument();
      expect(getByText('f_topic')).toBeInTheDocument();
      expect(getByText('f_user')).toBeInTheDocument();
      expect(getByText('CTR')).toBeInTheDocument();
      expect(getByText('final_score')).toBeInTheDocument();
    });

    it('uses ≈ between final_score and the sum to signal rounding', () => {
      const { container } = render(<ScoreBreakdown doc={makeDoc()} compact />);
      expect(container.textContent).toContain('≈');
    });

    it('omits weight annotations when doc.weights is missing', () => {
      const { container } = render(
        <ScoreBreakdown doc={makeDoc({ weights: undefined })} compact />,
      );
      expect(container.textContent).not.toContain('α₁=');
      expect(container.textContent).not.toContain('α₂=');
      expect(container.textContent).not.toContain('w_user=');
      expect(container.textContent).not.toContain('β=');
    });
  });
});
