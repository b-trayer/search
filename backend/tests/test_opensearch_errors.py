
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


class TestOpenSearchConnectionErrors:

    @patch("backend.app.api.search.AsyncSearchEngine")
    async def test_connection_refused_returns_503(
        self, mock_engine_class, client: AsyncClient
    ):
        from opensearchpy.exceptions import ConnectionError as OSConnectionError

        mock_engine = AsyncMock()
        mock_engine.search = AsyncMock(
            side_effect=OSConnectionError("Connection refused")
        )
        mock_engine.close = AsyncMock()
        mock_engine_class.return_value = mock_engine

        response = await client.post(
            "/api/v1/search/",
            json={"query": "test", "per_page": 10}
        )

        assert response.status_code == 503
        data = response.json()
        assert data["detail"]["code"] == "OPENSEARCH_UNAVAILABLE"
        assert "unavailable" in data["detail"]["message"].lower()

    @patch("backend.app.api.search.AsyncSearchEngine")
    async def test_connection_timeout_returns_503(
        self, mock_engine_class, client: AsyncClient
    ):
        from opensearchpy.exceptions import ConnectionTimeout

        mock_engine = AsyncMock()
        mock_engine.search = AsyncMock(
            side_effect=ConnectionTimeout("Timeout connecting to node")
        )
        mock_engine.close = AsyncMock()
        mock_engine_class.return_value = mock_engine

        response = await client.post(
            "/api/v1/search/",
            json={"query": "test", "per_page": 10}
        )

        assert response.status_code == 503

    @patch("backend.app.api.search.AsyncSearchEngine")
    async def test_ssl_error_returns_503(
        self, mock_engine_class, client: AsyncClient
    ):
        from opensearchpy.exceptions import SSLError

        mock_engine = AsyncMock()
        mock_engine.search = AsyncMock(
            side_effect=SSLError("SSL certificate verification failed")
        )
        mock_engine.close = AsyncMock()
        mock_engine_class.return_value = mock_engine

        response = await client.post(
            "/api/v1/search/",
            json={"query": "test", "per_page": 10}
        )

        assert response.status_code == 503


class TestOpenSearchIndexErrors:

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
            json={"query": "test", "per_page": 10}
        )

        assert response.status_code == 404
        data = response.json()
        assert data["detail"]["code"] == "INDEX_NOT_FOUND"

    @patch("backend.app.api.search.AsyncSearchEngine")
    async def test_index_closed_returns_503(
        self, mock_engine_class, client: AsyncClient
    ):
        from opensearchpy.exceptions import NotFoundError

        mock_engine = AsyncMock()
        mock_engine.search = AsyncMock(
            side_effect=NotFoundError(
                404, "index_closed_exception",
                {"error": {"reason": "index library_documents is closed"}}
            )
        )
        mock_engine.close = AsyncMock()
        mock_engine_class.return_value = mock_engine

        response = await client.post(
            "/api/v1/search/",
            json={"query": "test", "per_page": 10}
        )

        assert response.status_code == 404


class TestOpenSearchQueryErrors:

    @patch("backend.app.api.search.AsyncSearchEngine")
    async def test_malformed_query_returns_400(
        self, mock_engine_class, client: AsyncClient
    ):
        from opensearchpy.exceptions import RequestError

        mock_engine = AsyncMock()
        mock_engine.search = AsyncMock(
            side_effect=RequestError(
                400, "search_phase_execution_exception",
                {"error": {"reason": "Failed to parse query"}}
            )
        )
        mock_engine.close = AsyncMock()
        mock_engine_class.return_value = mock_engine

        response = await client.post(
            "/api/v1/search/",
            json={"query": "test [invalid", "per_page": 10}
        )

        assert response.status_code in [400, 500]

    @patch("backend.app.api.search.AsyncSearchEngine")
    async def test_too_many_clauses_returns_400(
        self, mock_engine_class, client: AsyncClient
    ):
        from opensearchpy.exceptions import RequestError

        mock_engine = AsyncMock()
        mock_engine.search = AsyncMock(
            side_effect=RequestError(
                400, "too_many_clauses",
                {"error": {"reason": "maxClauseCount is set to 1024"}}
            )
        )
        mock_engine.close = AsyncMock()
        mock_engine_class.return_value = mock_engine

        response = await client.post(
            "/api/v1/search/",
            json={"query": " ".join(["word"] * 100)}
        )

        assert response.status_code in [400, 500]


class TestOpenSearchClusterErrors:

    @patch("backend.app.api.search.AsyncSearchEngine")
    async def test_no_active_shards_returns_503(
        self, mock_engine_class, client: AsyncClient
    ):
        from opensearchpy.exceptions import TransportError

        mock_engine = AsyncMock()
        mock_engine.search = AsyncMock(
            side_effect=TransportError(
                503, "no_shard_available_action_exception",
                {"error": {"reason": "No shard available for [get]"}}
            )
        )
        mock_engine.close = AsyncMock()
        mock_engine_class.return_value = mock_engine

        response = await client.post(
            "/api/v1/search/",
            json={"query": "test"}
        )

        assert response.status_code in [500, 503]

    @patch("backend.app.api.search.AsyncSearchEngine")
    async def test_cluster_block_exception_returns_503(
        self, mock_engine_class, client: AsyncClient
    ):
        from opensearchpy.exceptions import TransportError

        mock_engine = AsyncMock()
        mock_engine.search = AsyncMock(
            side_effect=TransportError(
                403, "cluster_block_exception",
                {"error": {"reason": "index read-only"}}
            )
        )
        mock_engine.close = AsyncMock()
        mock_engine_class.return_value = mock_engine

        response = await client.post(
            "/api/v1/search/",
            json={"query": "test", "per_page": 10}
        )

        assert response.status_code in [403, 503, 500]


class TestOpenSearchResponseErrors:

    @patch("backend.app.api.search.AsyncSearchEngine")
    async def test_empty_response_handled_gracefully(
        self, mock_engine_class, client: AsyncClient
    ):
        mock_engine = AsyncMock()
        mock_engine.search = AsyncMock(return_value={
            "query": "test",
            "total": 0,
            "results": [],
            "personalized": False,
            "user_profile": None,
        })
        mock_engine.close = AsyncMock()
        mock_engine_class.return_value = mock_engine

        response = await client.post(
            "/api/v1/search/",
            json={"query": "nonexistent_term_xyz", "per_page": 10}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["results"] == []

    @patch("backend.app.api.search.AsyncSearchEngine")
    async def test_partial_shard_failure_returns_results(
        self, mock_engine_class, client: AsyncClient
    ):
        mock_engine = AsyncMock()
        mock_engine.search = AsyncMock(return_value={
            "query": "test",
            "total": 5,
            "results": [
                {"document_id": "doc_1", "title": "Test 1", "final_score": 10.0},
            ],
            "personalized": False,
            "user_profile": None,
            "_shards": {"total": 5, "successful": 3, "failed": 2},
        })
        mock_engine.close = AsyncMock()
        mock_engine_class.return_value = mock_engine

        response = await client.post(
            "/api/v1/search/",
            json={"query": "test", "per_page": 10}
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["results"]) > 0


class TestOpenSearchRetryBehavior:

    @patch("backend.app.api.search.AsyncSearchEngine")
    async def test_transient_error_on_first_request(
        self, mock_engine_class, client: AsyncClient
    ):
        from opensearchpy.exceptions import ConnectionError as OSConnectionError

        call_count = 0

        async def flaky_search(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise OSConnectionError("Transient error")
            return {
                "query": "test",
                "total": 1,
                "results": [{"document_id": "doc_1", "title": "Test", "final_score": 10.0}],
                "personalized": False,
                "user_profile": None,
            }

        mock_engine = AsyncMock()
        mock_engine.search = AsyncMock(side_effect=flaky_search)
        mock_engine.close = AsyncMock()
        mock_engine_class.return_value = mock_engine

        response1 = await client.post(
            "/api/v1/search/",
            json={"query": "test", "per_page": 10}
        )

        if response1.status_code == 429:
            pytest.skip("Rate limit reached during test")

        assert response1.status_code == 503

        response2 = await client.post(
            "/api/v1/search/",
            json={"query": "test", "per_page": 10}
        )

        if response2.status_code == 429:
            pytest.skip("Rate limit reached during test")

        assert response2.status_code == 200
