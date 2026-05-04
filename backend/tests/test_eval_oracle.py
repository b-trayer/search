import pytest

from backend.app.core.eval_oracle import (
    TOPIC_FIT_THRESHOLD,
    TYPE_FIT_THRESHOLD,
    build_gain_map,
    full_relevance,
    topic_fit,
    topical_relevance,
    type_fit,
)


@pytest.fixture
def math_textbook():
    return {
        'document_id': 'doc-1',
        'title': 'Сборник задач и упражнений по математическому анализу',
        'subjects': ['Математика', 'Математический анализ'],
        'document_type': 'textbook',
        'collection': 'Учебные издания',
    }


@pytest.fixture
def history_dissertation():
    return {
        'document_id': 'doc-2',
        'title': 'Хозяйство Демидовых в XVIII веке',
        'subjects': ['История', 'Экономика'],
        'document_type': 'dissertation',
        'collection': 'Диссертации',
    }


@pytest.fixture
def history_monograph():
    return {
        'document_id': 'doc-3',
        'title': 'Источниковедение Древней Руси',
        'subjects': ['История', 'Источниковедение'],
        'document_type': 'monograph',
        'collection': 'Научные издания',
    }


@pytest.fixture
def bachelor_math():
    return {
        'user_id': 1,
        'role': 'bachelor',
        'specialization': 'Математика',
        'interests': ['алгебра', 'анализ'],
    }


@pytest.fixture
def professor_history():
    return {
        'user_id': 2,
        'role': 'professor',
        'specialization': 'История',
        'interests': ['источниковедение'],
    }


class TestTopicalRelevance:

    def test_match_in_title(self, math_textbook):
        assert topical_relevance(math_textbook, 'математический анализ') == 1

    def test_match_in_subjects(self, math_textbook):
        assert topical_relevance(math_textbook, 'алгебра анализ') == 1

    def test_no_match(self, math_textbook):
        assert topical_relevance(math_textbook, 'химия органика') == 0

    def test_short_tokens_filtered(self, math_textbook):
        assert topical_relevance(math_textbook, 'и в по') == 0

    def test_empty_query(self, math_textbook):
        assert topical_relevance(math_textbook, '') == 0

    def test_handles_missing_fields(self):
        assert topical_relevance({}, 'математика') == 0


class TestTopicFit:

    def test_specialisation_in_subjects(self, math_textbook, bachelor_math):
        assert topic_fit(math_textbook, bachelor_math) is True

    def test_specialisation_mismatch(self, history_dissertation, bachelor_math):
        assert topic_fit(history_dissertation, bachelor_math) is False

    def test_no_user_returns_false(self, math_textbook):
        assert topic_fit(math_textbook, None) is False


class TestTypeFit:

    def test_textbook_for_bachelor(self, math_textbook, bachelor_math):
        assert type_fit(math_textbook, bachelor_math) is True

    def test_dissertation_for_bachelor(self, history_dissertation, bachelor_math):
        assert type_fit(history_dissertation, bachelor_math) is False

    def test_monograph_for_professor(self, history_monograph, professor_history):
        assert type_fit(history_monograph, professor_history) is True

    def test_dissertation_below_threshold_for_professor(
        self, history_dissertation, professor_history
    ):
        assert type_fit(history_dissertation, professor_history) is False

    def test_no_user_returns_false(self, math_textbook):
        assert type_fit(math_textbook, None) is False


class TestFullRelevance:

    def test_perfect_match(self, math_textbook, bachelor_math):
        assert (
            full_relevance(math_textbook, 'математический анализ', bachelor_math) == 3
        )

    def test_topical_only(self, math_textbook, professor_history):
        score = full_relevance(math_textbook, 'математический анализ', professor_history)
        assert score == 1

    def test_off_topic_for_user(self, history_dissertation, bachelor_math):
        score = full_relevance(history_dissertation, 'демидовы', bachelor_math)
        assert score == 1

    def test_no_match_at_all(self, math_textbook, professor_history):
        score = full_relevance(math_textbook, 'химия', professor_history)
        assert score == 0

    def test_anonymous_user_falls_back_to_topical(self, math_textbook):
        anon_score = full_relevance(math_textbook, 'математика', None)
        topical = topical_relevance(math_textbook, 'математика')
        assert anon_score == topical

    def test_score_in_range(self, math_textbook, bachelor_math):
        for q in ['математика', 'химия', '', 'анализ']:
            score = full_relevance(math_textbook, q, bachelor_math)
            assert 0 <= score <= 3


class TestBuildGainMap:

    def test_includes_all_docs(self, math_textbook, history_dissertation, bachelor_math):
        gains = build_gain_map(
            [math_textbook, history_dissertation],
            'математический анализ',
            bachelor_math,
        )
        assert set(gains.keys()) == {'doc-1', 'doc-2'}

    def test_topical_oracle_ignores_user_profile(
        self, math_textbook, history_dissertation, bachelor_math
    ):
        gains = build_gain_map(
            [math_textbook, history_dissertation],
            'математический анализ',
            bachelor_math,
            oracle='topical',
        )
        assert gains['doc-1'] == 1
        assert gains['doc-2'] == 0

    def test_full_oracle_grades_high(self, math_textbook, bachelor_math):
        gains = build_gain_map(
            [math_textbook],
            'математический анализ',
            bachelor_math,
            oracle='full',
        )
        assert gains['doc-1'] == 3

    def test_unknown_oracle_raises(self, math_textbook, bachelor_math):
        with pytest.raises(ValueError):
            build_gain_map([math_textbook], 'q', bachelor_math, oracle='bogus')

    def test_thresholds_are_documented(self):
        assert 0 < TOPIC_FIT_THRESHOLD < 1
        assert 0 < TYPE_FIT_THRESHOLD < 1
