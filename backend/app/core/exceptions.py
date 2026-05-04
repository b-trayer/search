
from typing import Optional


class SearchError(Exception):

    def __init__(self, message: str, code: str = "SEARCH_ERROR"):
        self.message = message
        self.code = code
        super().__init__(message)


class OpenSearchConnectionError(SearchError):

    def __init__(self, message: str = "Search service unavailable"):
        super().__init__(message, code="OPENSEARCH_UNAVAILABLE")


class OpenSearchIndexError(SearchError):

    def __init__(self, index_name: str):
        super().__init__(
            f"Search index '{index_name}' not found",
            code="INDEX_NOT_FOUND"
        )


class EmptyQueryError(SearchError):

    def __init__(self):
        super().__init__("Search query cannot be empty", code="EMPTY_QUERY")


class InvalidWeightsError(SearchError):

    def __init__(self, field: str, value: float, min_val: float, max_val: float):
        super().__init__(
            f"Weight '{field}' value {value} is out of range [{min_val}, {max_val}]",
            code="INVALID_WEIGHTS"
        )


class UserNotFoundError(SearchError):

    def __init__(self, user_id: int):
        super().__init__(f"User with ID {user_id} not found", code="USER_NOT_FOUND")


class DocumentNotFoundError(SearchError):

    def __init__(self, document_id: str):
        super().__init__(
            f"Document with ID '{document_id}' not found",
            code="DOCUMENT_NOT_FOUND"
        )


class DatabaseError(SearchError):

    def __init__(self, message: str = "Database operation failed"):
        super().__init__(message, code="DATABASE_ERROR")


class RateLimitError(SearchError):

    def __init__(self, retry_after: Optional[int] = None):
        self.retry_after = retry_after
        message = "Too many requests"
        if retry_after:
            message += f", retry after {retry_after} seconds"
        super().__init__(message, code="RATE_LIMIT_EXCEEDED")
