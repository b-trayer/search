
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


class TestHealthEndpoint:

    async def test_health_returns_healthy(self, client: AsyncClient):
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    async def test_root_returns_api_info(self, client: AsyncClient):
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "version" in data
        assert data["status"] == "operational"


class TestSearchEndpoint:

    async def test_empty_query_returns_400(self, client: AsyncClient):
        response = await client.post(
            "/api/search/",
            json={"query": "", "top_k": 10}
        )
        assert response.status_code == 400
        data = response.json()
        assert data["detail"]["code"] == "EMPTY_QUERY"

    async def test_whitespace_query_returns_400(self, client: AsyncClient):
        response = await client.post(
            "/api/search/",
            json={"query": "   ", "top_k": 10}
        )
        assert response.status_code == 400
        data = response.json()
        assert data["detail"]["code"] == "EMPTY_QUERY"

    @patch("backend.app.api.search.AsyncSearchEngine")
    async def test_opensearch_unavailable_returns_503(
        self, mock_engine_class, client: AsyncClient
    ):
        from opensearchpy.exceptions import ConnectionError as OSConnectionError

        mock_engine = AsyncMock()
        mock_engine.search = AsyncMock(side_effect=OSConnectionError("Connection refused"))
        mock_engine.close = AsyncMock()
        mock_engine_class.return_value = mock_engine

        response = await client.post(
            "/api/search/",
            json={"query": "test query", "top_k": 10}
        )

        assert response.status_code == 503
        data = response.json()
        assert data["detail"]["code"] == "OPENSEARCH_UNAVAILABLE"

    @patch("backend.app.api.search.AsyncSearchEngine")
    async def test_index_not_found_returns_404(
        self, mock_engine_class, client: AsyncClient
    ):
        from opensearchpy.exceptions import NotFoundError

        mock_engine = AsyncMock()
        mock_engine.search = AsyncMock(
            side_effect=NotFoundError(404, "index_not_found_exception", {})
        )
        mock_engine.close = AsyncMock()
        mock_engine_class.return_value = mock_engine

        response = await client.post(
            "/api/search/",
            json={"query": "test query", "top_k": 10}
        )

        assert response.status_code == 404
        data = response.json()
        assert data["detail"]["code"] == "INDEX_NOT_FOUND"

    @patch("backend.app.api.search.AsyncSearchEngine")
    async def test_successful_search_returns_results(
        self, mock_engine_class, client: AsyncClient
    ):
        mock_engine = AsyncMock()
        mock_engine.search = AsyncMock(return_value={
            "query": "test",
            "total": 2,
            "results": [
                {"document_id": "doc_1", "title": "Test 1", "final_score": 10.5},
                {"document_id": "doc_2", "title": "Test 2", "final_score": 8.3}
            ],
            "personalized": False,
            "user_profile": None
        })
        mock_engine.close = AsyncMock()
        mock_engine_class.return_value = mock_engine

        response = await client.post(
            "/api/search/",
            json={"query": "test query", "top_k": 10}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["query"] == "test"
        assert data["total"] == 2
        assert len(data["results"]) == 2

    @patch("backend.app.api.search.AsyncSearchEngine")
    async def test_search_with_personalization(
        self, mock_engine_class, client: AsyncClient
    ):
        mock_engine = AsyncMock()
        mock_engine.search = AsyncMock(return_value={
            "query": "D878:0",
            "total": 1,
            "results": [{"document_id": "doc_1", "title": "Physics", "final_score": 15.0}],
            "personalized": True,
            "user_profile": {"role": "student", "specialization": "$878:0"}
        })
        mock_engine.close = AsyncMock()
        mock_engine_class.return_value = mock_engine

        response = await client.post(
            "/api/search/",
            json={"query": "D878:0", "user_id": 1, "enable_personalization": True}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["personalized"] is True
        assert data["user_profile"] is not None


class TestClickEndpoint:

    @patch("backend.app.api.search.AsyncSearchEngine")
    async def test_register_click_success(
        self, mock_engine_class, client: AsyncClient
    ):
        mock_engine = AsyncMock()
        mock_engine.register_click = AsyncMock()
        mock_engine.close = AsyncMock()
        mock_engine_class.return_value = mock_engine

        response = await client.post(
            "/api/search/click",
            json={
                "query": "test query",
                "user_id": 1,
                "document_id": "doc_123",
                "position": 1,
                "session_id": "session_abc",
                "dwell_time": 30
            }
        )

        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    async def test_click_missing_required_fields(self, client: AsyncClient):
        response = await client.post(
            "/api/search/click",
            json={"query": "test"}
        )
        assert response.status_code == 422

    @patch("backend.app.api.search.AsyncSearchEngine")
    async def test_click_database_error_returns_503(
        self, mock_engine_class, client: AsyncClient
    ):
        from sqlalchemy.exc import SQLAlchemyError

        mock_engine = AsyncMock()
        mock_engine.register_click = AsyncMock(
            side_effect=SQLAlchemyError("DB connection failed")
        )
        mock_engine.close = AsyncMock()
        mock_engine_class.return_value = mock_engine

        response = await client.post(
            "/api/search/click",
            json={
                "query": "test",
                "user_id": 1,
                "document_id": "doc_1",
                "position": 1
            }
        )

        assert response.status_code == 503
        data = response.json()
        assert data["detail"]["code"] == "DATABASE_ERROR"


class TestFiltersEndpoint:

    @patch("backend.app.api.search.AsyncFilterService")
    async def test_get_filters_success(
        self, mock_filter_class, client: AsyncClient
    ):
        mock_filter = AsyncMock()
        mock_filter.get_filter_options = AsyncMock(return_value={
            "document_types": ["textbook", "monograph"],
            "subjects": ["$878:0", "0B5<0B8:0"],
            "year_range": {"min": 1990, "max": 2024}
        })
        mock_filter_class.return_value = mock_filter

        response = await client.get("/api/search/filters")

        assert response.status_code == 200
        data = response.json()
        assert "document_types" in data
        assert "subjects" in data

    @patch("backend.app.api.search.AsyncFilterService")
    async def test_filters_database_error_returns_503(
        self, mock_filter_class, client: AsyncClient
    ):
        from sqlalchemy.exc import SQLAlchemyError

        mock_filter = AsyncMock()
        mock_filter.get_filter_options = AsyncMock(
            side_effect=SQLAlchemyError("DB error")
        )
        mock_filter_class.return_value = mock_filter

        response = await client.get("/api/search/filters")

        assert response.status_code == 503
        data = response.json()
        assert data["detail"]["code"] == "DATABASE_ERROR"


class TestErrorResponses:

    async def test_error_response_has_code_and_message(self, client: AsyncClient):
        response = await client.post(
            "/api/search/",
            json={"query": ""}
        )

        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "code" in data["detail"]
        assert "message" in data["detail"]

    async def test_validation_error_returns_422(self, client: AsyncClient):
        response = await client.post(
            "/api/search/",
            json={"query": 123}
        )
        assert response.status_code == 422
