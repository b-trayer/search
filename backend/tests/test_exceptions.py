
import pytest
from backend.app.core.exceptions import (
    SearchError,
    OpenSearchConnectionError,
    OpenSearchIndexError,
    EmptyQueryError,
    InvalidWeightsError,
    UserNotFoundError,
    DocumentNotFoundError,
    DatabaseError,
    RateLimitError,
)


class TestSearchError:

    def test_search_error_has_message_and_code(self):
        error = SearchError("Test error", code="TEST_CODE")
        assert error.message == "Test error"
        assert error.code == "TEST_CODE"
        assert str(error) == "Test error"

    def test_search_error_default_code(self):
        error = SearchError("Test error")
        assert error.code == "SEARCH_ERROR"


class TestOpenSearchConnectionError:

    def test_default_message(self):
        error = OpenSearchConnectionError()
        assert error.message == "Search service unavailable"
        assert error.code == "OPENSEARCH_UNAVAILABLE"

    def test_custom_message(self):
        error = OpenSearchConnectionError("Custom connection error")
        assert error.message == "Custom connection error"
        assert error.code == "OPENSEARCH_UNAVAILABLE"


class TestOpenSearchIndexError:

    def test_includes_index_name(self):
        error = OpenSearchIndexError("library_documents")
        assert "library_documents" in error.message
        assert error.code == "INDEX_NOT_FOUND"


class TestEmptyQueryError:

    def test_has_correct_code(self):
        error = EmptyQueryError()
        assert error.code == "EMPTY_QUERY"
        assert "empty" in error.message.lower()


class TestInvalidWeightsError:

    def test_includes_field_info(self):
        error = InvalidWeightsError("w_user", 10.0, 0.0, 5.0)
        assert "w_user" in error.message
        assert "10" in error.message
        assert error.code == "INVALID_WEIGHTS"

    def test_includes_range(self):
        error = InvalidWeightsError("beta_ctr", -1.0, 0.0, 3.0)
        assert "0" in error.message and "3" in error.message


class TestUserNotFoundError:

    def test_includes_user_id(self):
        error = UserNotFoundError(42)
        assert "42" in error.message
        assert error.code == "USER_NOT_FOUND"


class TestDocumentNotFoundError:

    def test_includes_document_id(self):
        error = DocumentNotFoundError("doc_123")
        assert "doc_123" in error.message
        assert error.code == "DOCUMENT_NOT_FOUND"


class TestDatabaseError:

    def test_default_message(self):
        error = DatabaseError()
        assert error.code == "DATABASE_ERROR"

    def test_custom_message(self):
        error = DatabaseError("Connection timeout")
        assert error.message == "Connection timeout"


class TestRateLimitError:

    def test_without_retry_after(self):
        error = RateLimitError()
        assert error.code == "RATE_LIMIT_EXCEEDED"
        assert error.retry_after is None

    def test_with_retry_after(self):
        error = RateLimitError(retry_after=60)
        assert error.retry_after == 60
        assert "60" in error.message


class TestExceptionInheritance:

    def test_all_exceptions_inherit_from_search_error(self):
        exceptions = [
            OpenSearchConnectionError(),
            OpenSearchIndexError("test"),
            EmptyQueryError(),
            InvalidWeightsError("test", 0, 0, 1),
            UserNotFoundError(1),
            DocumentNotFoundError("test"),
            DatabaseError(),
            RateLimitError(),
        ]

        for exc in exceptions:
            assert isinstance(exc, SearchError)
            assert isinstance(exc, Exception)

    def test_exceptions_can_be_caught_as_search_error(self):
        with pytest.raises(SearchError):
            raise OpenSearchConnectionError()

        with pytest.raises(SearchError):
            raise UserNotFoundError(1)
