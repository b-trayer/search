
import pytest
from fastapi import HTTPException
from opensearchpy.exceptions import ConnectionError as OpenSearchConnectionError
from opensearchpy.exceptions import NotFoundError as OpenSearchNotFoundError
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError

from backend.app.api.error_handlers import handle_search_errors
from backend.app.core.exceptions import UserNotFoundError

pytestmark = pytest.mark.asyncio


class TestHandleSearchErrors:

    async def test_returns_result_on_success(self):
        @handle_search_errors
        async def success_func():
            return {"result": "ok"}

        result = await success_func()
        assert result == {"result": "ok"}

    async def test_handles_opensearch_connection_error(self):
        @handle_search_errors
        async def raise_connection_error():
            raise OpenSearchConnectionError()

        with pytest.raises(HTTPException) as exc_info:
            await raise_connection_error()

        assert exc_info.value.status_code == 503
        assert exc_info.value.detail["code"] == "OPENSEARCH_UNAVAILABLE"

    async def test_handles_opensearch_not_found_error(self):
        @handle_search_errors
        async def raise_not_found():
            raise OpenSearchNotFoundError(404, "index_not_found_exception")

        with pytest.raises(HTTPException) as exc_info:
            await raise_not_found()

        assert exc_info.value.status_code == 404
        assert exc_info.value.detail["code"] == "INDEX_NOT_FOUND"

    async def test_handles_user_not_found_error(self):
        @handle_search_errors
        async def raise_user_not_found():
            raise UserNotFoundError(user_id=42)

        with pytest.raises(HTTPException) as exc_info:
            await raise_user_not_found()

        assert exc_info.value.status_code == 404
        assert exc_info.value.detail["code"] == "USER_NOT_FOUND"

    async def test_handles_sqlalchemy_error(self):
        @handle_search_errors
        async def raise_db_error():
            raise SQLAlchemyError("Database error")

        with pytest.raises(HTTPException) as exc_info:
            await raise_db_error()

        assert exc_info.value.status_code == 503
        assert exc_info.value.detail["code"] == "DATABASE_ERROR"

    async def test_handles_generic_exception(self):
        @handle_search_errors
        async def raise_generic():
            raise RuntimeError("Something went wrong")

        with pytest.raises(HTTPException) as exc_info:
            await raise_generic()

        assert exc_info.value.status_code == 500
        assert exc_info.value.detail["code"] == "INTERNAL_ERROR"

    async def test_preserves_function_name(self):
        @handle_search_errors
        async def my_function():
            return True

        assert my_function.__name__ == "my_function"

    async def test_passes_args_and_kwargs(self):
        @handle_search_errors
        async def func_with_args(a, b, c=None):
            return {"a": a, "b": b, "c": c}

        result = await func_with_args(1, 2, c=3)
        assert result == {"a": 1, "b": 2, "c": 3}
