
import pytest
from backend.app.core.preferences import (
    calculate_f_type,
    calculate_f_topic,
    infer_document_type,
    ROLE_TYPE_MATRIX,
    SPECIALIZATION_TOPICS,
)


class TestFType:

    def test_student_prefers_textbooks(self):
        score = calculate_f_type("textbook", "student")
        assert score == 0.50

    def test_student_low_preference_for_dissertation(self):
        score = calculate_f_type("dissertation", "student")
        assert score == 0.05

    def test_phd_prefers_dissertations(self):
        score = calculate_f_type("dissertation", "phd")
        assert score == 0.35

    def test_professor_prefers_monographs(self):
        score = calculate_f_type("monograph", "professor")
        assert score == 0.30

    def test_unknown_role_returns_zero(self):
        score = calculate_f_type("textbook", "unknown_role")
        assert score == 0.0

    def test_unknown_type_returns_zero(self):
        score = calculate_f_type("unknown_type", "student")
        assert score == 0.0


class TestFTopic:

    def test_exact_match_returns_one(self):
        score = calculate_f_topic(
            doc_subjects=["Математика. Алгебра"],
            user_specialization="Математика"
        )
        assert score == 1.0

    def test_keyword_match_returns_high_score(self):
        score = calculate_f_topic(
            doc_subjects=["Дифференциальные уравнения"],
            user_specialization="Математика"
        )
        assert score == 0.8

    def test_interest_match_returns_medium_score(self):
        score = calculate_f_topic(
            doc_subjects=["Программирование на Python"],
            user_specialization="История",
            user_interests=["Python"]
        )
        assert score == 0.6

    def test_no_match_returns_zero(self):
        score = calculate_f_topic(
            doc_subjects=["Физика. Механика"],
            user_specialization="История"
        )
        assert score == 0.0


class TestInferDocumentType:

    def test_textbook_inference(self):
        assert infer_document_type("Учебные издания") == "textbook"
        assert infer_document_type("Учебно-методические пособия") == "textbook"

    def test_dissertation_inference(self):
        assert infer_document_type("Диссертации преподавателей") == "dissertation"

    def test_article_inference(self):
        assert infer_document_type("Статьи научные") == "article"

    def test_monograph_inference(self):
        assert infer_document_type("Монографии издательства") == "monograph"

    def test_unknown_returns_other(self):
        assert infer_document_type("Неизвестная коллекция") == "other"
