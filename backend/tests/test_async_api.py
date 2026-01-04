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

    async def test_empty_query_returns_422(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/search/",
            json={"query": ""}
        )
        assert response.status_code == 422

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
            "/api/v1/search/",
            json={"query": "test query"}
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
            "/api/v1/search/",
            json={"query": "test query"}
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
            "page": 1,
            "per_page": 20,
            "total_pages": 1,
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
            "/api/v1/search/",
            json={"query": "test query"}
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
            "query": "physics",
            "total": 1,
            "page": 1,
            "per_page": 20,
            "total_pages": 1,
            "results": [{"document_id": "doc_1", "title": "Physics", "final_score": 15.0}],
            "personalized": True,
            "user_profile": {"role": "student", "specialization": "Physics"}
        })
        mock_engine.close = AsyncMock()
        mock_engine_class.return_value = mock_engine

        response = await client.post(
            "/api/v1/search/",
            json={"query": "physics", "user_id": 1, "enable_personalization": True}
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
            "/api/v1/search/click",
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
            "/api/v1/search/click",
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
            "/api/v1/search/click",
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

    @patch("backend.app.api.search.AsyncSearchEngine")
    async def test_get_filters_success(
        self, mock_engine_class, client: AsyncClient
    ):
        mock_engine = AsyncMock()
        mock_engine.get_filter_options = AsyncMock(return_value={
            "document_types": [{"name": "textbook", "count": 100}],
            "languages": [{"name": "ru", "count": 200}],
            "collections": [],
            "knowledge_areas": [],
            "sources": [],
            "has_pdf": {"with_pdf": 50, "total": 100},
        })
        mock_engine_class.return_value = mock_engine

        response = await client.get("/api/v1/search/filters")

        assert response.status_code == 200
        data = response.json()
        assert "document_types" in data

    @patch("backend.app.api.search.AsyncSearchEngine")
    async def test_filters_database_error_returns_503(
        self, mock_engine_class, client: AsyncClient
    ):
        from sqlalchemy.exc import SQLAlchemyError

        mock_engine = AsyncMock()
        mock_engine.get_filter_options = AsyncMock(
            side_effect=SQLAlchemyError("DB error")
        )
        mock_engine_class.return_value = mock_engine

        response = await client.get("/api/v1/search/filters")

        assert response.status_code == 503
        data = response.json()
        assert data["detail"]["code"] == "DATABASE_ERROR"


class TestErrorResponses:

    async def test_error_response_format(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/search/",
            json={"query": ""}
        )

        assert response.status_code == 422

    async def test_validation_error_returns_422(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/search/",
            json={"query": 123}
        )
        assert response.status_code == 422
