
import pytest
from backend.app.core.metrics import (
    dcg_at_k,
    ndcg_at_k,
    precision_at_k,
    recall_at_k,
    mean_reciprocal_rank,
    calculate_relevance,
    compare_rankings,
)


class TestDCG:

    def test_dcg_perfect_ranking(self):
        relevances = [1.0, 1.0, 1.0]
        dcg = dcg_at_k(relevances, 3)
        assert dcg > 0

    def test_dcg_empty_returns_zero(self):
        dcg = dcg_at_k([], 3)
        assert dcg == 0.0

    def test_dcg_respects_k(self):
        relevances = [1.0, 1.0, 1.0, 1.0, 1.0]
        dcg_3 = dcg_at_k(relevances, 3)
        dcg_5 = dcg_at_k(relevances, 5)
        assert dcg_5 > dcg_3


class TestNDCG:

    def test_ndcg_perfect_ranking_is_one(self):
        relevances = [1.0, 0.8, 0.5, 0.2]
        ndcg = ndcg_at_k(relevances, 4)
        assert ndcg == 1.0

    def test_ndcg_reversed_ranking_less_than_one(self):
        relevances = [0.2, 0.5, 0.8, 1.0]
        ndcg = ndcg_at_k(relevances, 4)
        assert ndcg < 1.0

    def test_ndcg_empty_returns_zero(self):
        ndcg = ndcg_at_k([], 3)
        assert ndcg == 0.0

    def test_ndcg_all_zeros_returns_zero(self):
        ndcg = ndcg_at_k([0.0, 0.0, 0.0], 3)
        assert ndcg == 0.0


class TestPrecision:

    def test_precision_all_relevant(self):
        relevances = [1.0, 1.0, 1.0]
        precision = precision_at_k(relevances, 3)
        assert precision == 1.0

    def test_precision_none_relevant(self):
        relevances = [0.0, 0.0, 0.0]
        precision = precision_at_k(relevances, 3)
        assert precision == 0.0

    def test_precision_half_relevant(self):
        relevances = [1.0, 0.0, 1.0, 0.0]
        precision = precision_at_k(relevances, 4)
        assert precision == 0.5

    def test_precision_respects_k(self):
        relevances = [1.0, 1.0, 0.0, 0.0]
        p2 = precision_at_k(relevances, 2)
        p4 = precision_at_k(relevances, 4)
        assert p2 == 1.0
        assert p4 == 0.5


class TestRecall:

    def test_recall_all_found(self):
        relevances = [1.0, 1.0, 1.0]
        recall = recall_at_k(relevances, 3, total_relevant=3)
        assert recall == 1.0

    def test_recall_partial(self):
        relevances = [1.0, 1.0, 0.0]
        recall = recall_at_k(relevances, 3, total_relevant=4)
        assert recall == 0.5

    def test_recall_zero_total_returns_zero(self):
        recall = recall_at_k([1.0, 1.0], 2, total_relevant=0)
        assert recall == 0.0


class TestMRR:

    def test_mrr_first_relevant(self):
        relevances = [1.0, 0.0, 0.0]
        mrr = mean_reciprocal_rank(relevances)
        assert mrr == 1.0

    def test_mrr_second_relevant(self):
        relevances = [0.0, 1.0, 0.0]
        mrr = mean_reciprocal_rank(relevances)
        assert mrr == 0.5

    def test_mrr_none_relevant(self):
        relevances = [0.0, 0.0, 0.0]
        mrr = mean_reciprocal_rank(relevances)
        assert mrr == 0.0


class TestCalculateRelevance:

    def test_clicked_doc_is_relevant(self):
        doc = {"title": "Test", "subject_area": ""}
        relevance = calculate_relevance(doc, None, clicked=True)
        assert relevance >= 0.5

    def test_specialization_match_adds_relevance(self):
        doc = {"title": "Test", "subject_area": "Физика"}
        user = {"specialization": "Физика", "interests": []}
        relevance = calculate_relevance(doc, user, clicked=False)
        assert relevance >= 0.3


class TestCompareRankings:

    def test_compare_returns_metrics(self):
        results_a = [{"document_id": "1", "title": "A", "subject_area": ""}]
        results_b = [{"document_id": "2", "title": "B", "subject_area": ""}]

        comparison = compare_rankings(results_a, results_b)

        assert "ndcg_a" in comparison
        assert "ndcg_b" in comparison
        assert "precision_a" in comparison
        assert "overlap" in comparison

    def test_compare_counts_overlap(self):
        results_a = [
            {"document_id": "1", "title": "A", "subject_area": ""},
            {"document_id": "2", "title": "B", "subject_area": ""},
        ]
        results_b = [
            {"document_id": "2", "title": "B", "subject_area": ""},
            {"document_id": "3", "title": "C", "subject_area": ""},
        ]

        comparison = compare_rankings(results_a, results_b)
        assert comparison["overlap"] == 1
