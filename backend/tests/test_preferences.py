
import pytest
from backend.app.core.preferences import (
    calculate_f_type,
    calculate_f_topic,
    canonicalize_document_type,
    infer_document_type,
)


class TestFType:

    def test_bachelor_prefers_textbooks(self):
        score = calculate_f_type("textbook", "bachelor")
        assert score == 0.50

    def test_bachelor_low_preference_for_dissertation(self):
        score = calculate_f_type("dissertation", "bachelor")
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
        score = calculate_f_type("unknown_type", "bachelor")
        assert score == 0.0


class TestFTopic:

    def test_direct_match_returns_one(self):
        score = calculate_f_topic(
            doc_subjects=["Математика. Алгебра"],
            user_specialization="Математика"
        )
        assert score == 1.0

    def test_keyword_match_returns_base_zero_eight(self):
        score = calculate_f_topic(
            doc_subjects=["Дифференциальные уравнения"],
            user_specialization="Математика"
        )
        assert score == 0.8

    def test_interest_only_returns_bonus(self):
        score = calculate_f_topic(
            doc_subjects=["Программирование на Python"],
            user_specialization="История",
            user_interests=["Python"]
        )
        assert score == pytest.approx(0.2)

    def test_direct_match_plus_interests_bonus(self):
        score = calculate_f_topic(
            doc_subjects=["Математика. Алгебра. Топология"],
            user_specialization="Математика",
            user_interests=["алгебра", "топология"]
        )
        assert score == pytest.approx(1.4)

    def test_interest_bonus_capped(self):
        score = calculate_f_topic(
            doc_subjects=["Биология. Генетика. Молекулярная биология. Эволюция"],
            user_specialization="Право",
            user_interests=["генетика", "молекулярная биология", "эволюция", "биология"]
        )
        assert score == pytest.approx(0.5)

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


class TestCanonicalizeDocumentType:

    def test_book_maps_to_monograph(self):
        assert canonicalize_document_type("book") == "monograph"
        assert canonicalize_document_type("collection") == "monograph"
        assert canonicalize_document_type("Другой") == "monograph"

    def test_serial_and_journal_map_to_article(self):
        assert canonicalize_document_type("serial") == "article"
        assert canonicalize_document_type("Журнал, газета") == "article"
        assert canonicalize_document_type("proceedings") == "article"

    def test_russian_uchebnik_maps_to_textbook(self):
        assert canonicalize_document_type("Учебник") == "textbook"
        assert canonicalize_document_type("manual") == "textbook"

    def test_methodical_maps_to_tutorial(self):
        assert canonicalize_document_type("methodical") == "tutorial"

    def test_dissertation_synonyms(self):
        assert canonicalize_document_type("doctoral_dissertation") == "dissertation"
        assert canonicalize_document_type("autoreferat") == "dissertation"
        assert canonicalize_document_type("Диссертация") == "dissertation"

    def test_article_synonyms(self):
        assert canonicalize_document_type("nsu_article") == "article"
        assert canonicalize_document_type("book_article") == "article"
        assert canonicalize_document_type("Статья, доклад") == "article"

    def test_canonical_passthrough(self):
        for canonical in ("textbook", "tutorial", "monograph", "dissertation", "article"):
            assert canonicalize_document_type(canonical) == canonical

    def test_unknown_type_returns_other(self):
        assert canonicalize_document_type("electronic") == "other"
        assert canonicalize_document_type("network_resource") == "other"
        assert canonicalize_document_type("reference") == "other"

    def test_empty_type_falls_back_to_collection_inference(self):
        assert canonicalize_document_type("", "Учебно-методические пособия") == "textbook"
        assert canonicalize_document_type(None, "Диссертации преподавателей") == "dissertation"

    def test_known_type_takes_priority_over_collection(self):
        assert canonicalize_document_type("monograph", "Учебники") == "monograph"

    def test_unknown_type_with_unknown_collection_returns_other(self):
        assert canonicalize_document_type("video", "Random collection") == "other"
