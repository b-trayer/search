
import pytest
from backend.app.services.ranking import (
    apply_ranking_formula,
    bayesian_smoothed_ctr,
    calculate_f_type_for_doc,
    calculate_f_topic_for_doc,
)


class TestBayesianCTR:

    def test_cold_start_returns_prior(self):
        ctr = bayesian_smoothed_ctr(0, 0)
        assert 0.08 < ctr < 0.1

    def test_single_click_not_100_percent(self):
        ctr = bayesian_smoothed_ctr(1, 1)
        assert 0.15 < ctr < 0.2

    def test_high_ctr_with_many_impressions(self):
        ctr = bayesian_smoothed_ctr(50, 100)
        assert 0.4 < ctr < 0.5


class TestFTypeForDoc:

    def test_bachelor_textbook_high_score(self):
        doc = {"коллекция": "Учебные издания"}
        user = {"role": "bachelor"}
        score = calculate_f_type_for_doc(doc, user)
        assert score == 0.50

    def test_missing_role_returns_zero(self):
        doc = {"коллекция": "Учебные издания"}
        user = {}
        score = calculate_f_type_for_doc(doc, user)
        assert score == 0.0


class TestFTopicForDoc:

    def test_specialization_match(self):
        doc = {
            "литература_по_отраслям_знания": "Физика. Механика",
            "коллекция": "Научные издания",
            "title": "Квантовая механика"
        }
        user = {"specialization": "Физика", "interests": []}
        score = calculate_f_topic_for_doc(doc, user)
        assert score >= 0.8


class TestApplyRankingFormula:

    def test_returns_sorted_results(self):
        hits = [
            {"_score": 5.0, "_source": {"document_id": "doc1", "title": "Doc 1"}},
            {"_score": 10.0, "_source": {"document_id": "doc2", "title": "Doc 2"}},
        ]
        ctr_data = {}
        user_profile = None

        results = apply_ranking_formula(hits, ctr_data, user_profile, False)

        assert results[0]["document_id"] == "doc2"
        assert results[1]["document_id"] == "doc1"

    def test_positions_updated_after_sort(self):
        hits = [
            {"_score": 5.0, "_source": {"document_id": "doc1", "title": "Doc 1"}},
            {"_score": 10.0, "_source": {"document_id": "doc2", "title": "Doc 2"}},
        ]

        results = apply_ranking_formula(hits, {}, None, False)

        assert results[0]["position"] == 1
        assert results[1]["position"] == 2

    def test_personalization_boosts_relevant_docs(self):
        hits = [
            {
                "_score": 10.0,
                "_source": {
                    "document_id": "doc1",
                    "title": "История России",
                    "литература_по_отраслям_знания": "История",
                    "коллекция": "Учебники"
                }
            },
            {
                "_score": 10.0,
                "_source": {
                    "document_id": "doc2",
                    "title": "Физика атома",
                    "литература_по_отраслям_знания": "Физика",
                    "коллекция": "Учебники"
                }
            },
        ]

        user_profile = {"role": "bachelor", "specialization": "История", "interests": []}

        results = apply_ranking_formula(hits, {}, user_profile, True)

        assert results[0]["document_id"] == "doc1"

    def test_weights_override_changes_personalization_strength(self):
        hits = [
            {
                "_score": 10.0,
                "_source": {
                    "document_id": "doc1",
                    "title": "История России",
                    "литература_по_отраслям_знания": "История",
                    "коллекция": "Учебники",
                },
            },
        ]
        user_profile = {"role": "bachelor", "specialization": "История", "interests": []}

        baseline = apply_ranking_formula(hits, {}, user_profile, True)
        boosted = apply_ranking_formula(
            hits, {}, user_profile, True, weights_override={"w_user": 4.0}
        )
        assert boosted[0]["final_score"] > baseline[0]["final_score"]

    def test_weights_override_can_zero_personalization(self):
        hits = [
            {
                "_score": 10.0,
                "_source": {
                    "document_id": "doc1",
                    "title": "История России",
                    "литература_по_отраслям_знания": "История",
                    "коллекция": "Учебники",
                },
            },
        ]
        user_profile = {"role": "bachelor", "specialization": "История", "interests": []}
        result = apply_ranking_formula(
            hits, {}, user_profile, True, weights_override={"w_user": 0.0}
        )
        assert result[0]["user_contrib"] == 0.0

    def test_popularity_sort_orders_by_smoothed_ctr(self):
        hits = [
            {"_score": 10.0, "_source": {"document_id": "doc_low_ctr", "title": "A"}},
            {"_score": 10.0, "_source": {"document_id": "doc_high_ctr", "title": "B"}},
        ]
        ctr_data = {
            "doc_low_ctr": (1, 100),
            "doc_high_ctr": (50, 100),
        }

        results = apply_ranking_formula(
            hits, ctr_data, None, False, sort_by="popularity_desc"
        )

        assert results[0]["document_id"] == "doc_high_ctr"
        assert results[0]["position"] == 1
        assert results[1]["document_id"] == "doc_low_ctr"
        assert results[0]["smoothed_ctr"] > results[1]["smoothed_ctr"]
