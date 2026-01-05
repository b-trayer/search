
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport

from backend.app.main import app

pytestmark = pytest.mark.asyncio


@pytest.fixture
def mock_db():
    return AsyncMock()


@pytest.fixture
def mock_opensearch():
    return AsyncMock()


class TestClickEndpoint:

    async def test_register_click_success(self):
        with patch("backend.app.api.interactions.AsyncSearchEngine") as MockEngine:
            mock_engine = AsyncMock()
            MockEngine.return_value = mock_engine

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test"
            ) as client:
                response = await client.post(
                    "/api/v1/search/click",
                    json={
                        "query": "test query",
                        "document_id": "doc-1",
                        "position": 1,
                        "user_id": None
                    }
                )

            assert response.status_code == 200
            assert response.json()["status"] == "ok"

    async def test_register_click_with_user_id(self):
        with patch("backend.app.api.interactions.AsyncSearchEngine") as MockEngine:
            mock_engine = AsyncMock()
            MockEngine.return_value = mock_engine

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test"
            ) as client:
                response = await client.post(
                    "/api/v1/search/click",
                    json={
                        "query": "test",
                        "document_id": "doc-1",
                        "position": 2,
                        "user_id": 42,
                        "session_id": "sess-123"
                    }
                )

            assert response.status_code == 200
            mock_engine.register_click.assert_called_once()


class TestImpressionsEndpoint:

    async def test_register_impressions_success(self):
        with patch("backend.app.api.interactions.AsyncSearchEngine") as MockEngine, \
             patch("backend.app.api.interactions.get_total_stats") as mock_stats:
            mock_engine = AsyncMock()
            MockEngine.return_value = mock_engine
            mock_stats.return_value = {"total_impressions": 100, "total_clicks": 10}

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test"
            ) as client:
                response = await client.post(
                    "/api/v1/search/impressions",
                    json={
                        "query": "test query",
                        "document_ids": ["doc-1", "doc-2"],
                        "user_id": 1
                    }
                )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"
            assert data["total_impressions"] == 100

    async def test_register_impressions_empty_list(self):
        with patch("backend.app.api.interactions.AsyncSearchEngine") as MockEngine, \
             patch("backend.app.api.interactions.get_total_stats") as mock_stats:
            mock_engine = AsyncMock()
            MockEngine.return_value = mock_engine
            mock_stats.return_value = {"total_impressions": 0, "total_clicks": 0}

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test"
            ) as client:
                response = await client.post(
                    "/api/v1/search/impressions",
                    json={
                        "query": "test",
                        "document_ids": [],
                        "user_id": None
                    }
                )

            assert response.status_code == 200


class TestFiltersEndpoint:

    async def test_get_filters_success(self):
        with patch("backend.app.api.interactions.AsyncSearchEngine") as MockEngine:
            mock_engine = AsyncMock()
            mock_engine.get_filter_options.return_value = {
                "collections": ["Учебные издания", "Научные издания"],
                "years": [2020, 2021, 2022]
            }
            MockEngine.return_value = mock_engine

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test"
            ) as client:
                response = await client.get("/api/v1/search/filters")

            assert response.status_code == 200
            data = response.json()
            assert "collections" in data
            assert "years" in data


class TestStatsEndpoint:

    async def test_get_stats_success(self):
        with patch("backend.app.api.interactions.get_total_stats") as mock_stats:
            mock_stats.return_value = {
                "total_impressions": 500,
                "total_clicks": 50
            }

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test"
            ) as client:
                response = await client.get("/api/v1/search/stats")

            assert response.status_code == 200
            data = response.json()
            assert data["total_impressions"] == 500
            assert data["total_clicks"] == 50
