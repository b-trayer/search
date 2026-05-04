import math

import pytest

from backend.app.core.metrics import (
    average_precision,
    dcg_at_k,
    mean,
    ndcg_at_k,
    precision_at_k,
    recall_at_k,
    reciprocal_rank,
)


class TestPrecisionAtK:

    def test_perfect_ranking(self):
        assert precision_at_k(["a", "b", "c"], {"a", "b", "c"}, 3) == 1.0

    def test_no_hits(self):
        assert precision_at_k(["a", "b", "c"], {"x", "y"}, 3) == 0.0

    def test_partial_hits(self):
        assert precision_at_k(["a", "b", "c", "d"], {"a", "c"}, 4) == pytest.approx(0.5)

    def test_top_k_smaller_than_relevant_set(self):
        assert precision_at_k(["a", "b"], {"a", "b", "c"}, 2) == 1.0

    def test_k_zero_returns_zero(self):
        assert precision_at_k(["a", "b"], {"a"}, 0) == 0.0

    def test_empty_ranked_returns_zero(self):
        assert precision_at_k([], {"a"}, 5) == 0.0

    def test_empty_relevant_returns_zero(self):
        assert precision_at_k(["a", "b"], set(), 2) == 0.0

    def test_k_larger_than_results(self):
        assert precision_at_k(["a", "b"], {"a"}, 10) == pytest.approx(1 / 10)


class TestRecallAtK:

    def test_perfect_recall(self):
        assert recall_at_k(["a", "b", "c"], {"a", "b", "c"}, 3) == 1.0

    def test_partial_recall(self):
        assert recall_at_k(["a", "x", "y"], {"a", "b", "c"}, 3) == pytest.approx(1 / 3)

    def test_recall_grows_with_k(self):
        relevant = {"a", "b", "c"}
        ranked = ["x", "a", "y", "b", "z", "c"]
        r1 = recall_at_k(ranked, relevant, 1)
        r3 = recall_at_k(ranked, relevant, 3)
        r6 = recall_at_k(ranked, relevant, 6)
        assert r1 == 0.0
        assert r3 == pytest.approx(1 / 3)
        assert r6 == 1.0

    def test_empty_relevant(self):
        assert recall_at_k(["a"], set(), 1) == 0.0


class TestAveragePrecision:

    def test_perfect_ordering(self):
        assert average_precision(["a", "b"], {"a", "b"}) == 1.0

    def test_relevant_first_then_misses(self):
        ap = average_precision(["a", "x", "y"], {"a"})
        assert ap == pytest.approx(1.0)

    def test_relevant_at_position_two(self):
        ap = average_precision(["x", "a"], {"a"})
        assert ap == pytest.approx(0.5)

    def test_two_relevants_with_gap(self):
        ap = average_precision(["a", "x", "b"], {"a", "b"})
        assert ap == pytest.approx((1.0 + 2 / 3) / 2)

    def test_empty(self):
        assert average_precision([], {"a"}) == 0.0
        assert average_precision(["a"], set()) == 0.0


class TestReciprocalRank:

    def test_first_position(self):
        assert reciprocal_rank(["a", "b"], {"a"}) == 1.0

    def test_second_position(self):
        assert reciprocal_rank(["x", "a"], {"a"}) == 0.5

    def test_no_relevant_in_results(self):
        assert reciprocal_rank(["x", "y"], {"a"}) == 0.0

    def test_empty_relevant(self):
        assert reciprocal_rank(["x"], set()) == 0.0


class TestDcgAtK:

    def test_zero_when_no_gains(self):
        assert dcg_at_k(["a", "b"], {}, 2) == 0.0

    def test_single_relevant_at_top(self):
        gains = {"a": 1.0}
        expected = (math.pow(2.0, 1.0) - 1.0) / math.log2(2)
        assert dcg_at_k(["a"], gains, 1) == pytest.approx(expected)

    def test_graded_relevance_decays_with_position(self):
        gains = {"a": 3.0, "b": 3.0}
        dcg_top = dcg_at_k(["a", "b"], gains, 2)
        dcg_bottom = dcg_at_k(["b", "a"], gains, 2)
        assert dcg_top == pytest.approx(dcg_bottom)
        single = dcg_at_k(["a"], gains, 1)
        assert dcg_top > single

    def test_irrelevant_documents_contribute_nothing(self):
        gains = {"a": 2.0}
        dcg_with_filler = dcg_at_k(["a", "x", "y"], gains, 3)
        dcg_alone = dcg_at_k(["a"], gains, 1)
        assert dcg_with_filler == pytest.approx(dcg_alone)


class TestNdcgAtK:

    def test_perfect_ordering_is_one(self):
        gains = {"a": 3.0, "b": 2.0, "c": 1.0}
        assert ndcg_at_k(["a", "b", "c"], gains, 3) == pytest.approx(1.0)

    def test_reverse_ordering_is_below_one(self):
        gains = {"a": 3.0, "b": 2.0, "c": 1.0}
        score = ndcg_at_k(["c", "b", "a"], gains, 3)
        assert 0 < score < 1

    def test_no_relevant_returns_zero(self):
        assert ndcg_at_k(["a", "b"], {}, 2) == 0.0

    def test_partial_top_k(self):
        gains = {"a": 3.0, "b": 2.0, "c": 1.0}
        assert ndcg_at_k(["a"], gains, 1) == pytest.approx(1.0)

    def test_in_range(self):
        gains = {"a": 3.0, "b": 1.0}
        for ranked in (["a", "b"], ["b", "a"], ["a", "x", "b"], ["x", "a", "b"]):
            score = ndcg_at_k(ranked, gains, 5)
            assert 0.0 <= score <= 1.0

    def test_persoonalisation_can_outperform_baseline(self):
        gains = {"d1": 3.0, "d2": 2.0, "d3": 1.0}
        baseline = ["d3", "d2", "d1"]
        personalised = ["d1", "d2", "d3"]
        assert ndcg_at_k(personalised, gains, 3) > ndcg_at_k(baseline, gains, 3)


class TestMean:

    def test_average(self):
        assert mean([1.0, 2.0, 3.0]) == 2.0

    def test_empty_returns_zero(self):
        assert mean([]) == 0.0
