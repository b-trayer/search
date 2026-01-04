
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


class TestSearchFlowE2E:

    @patch("backend.app.api.search.AsyncSearchEngine")
    async def test_full_search_and_click_flow(
        self, mock_engine_class, client: AsyncClient
    ):
        mock_engine = AsyncMock()
        mock_engine.search = AsyncMock(return_value={
            "query": "quantum physics",
            "total": 2,
            "results": [
                {
                    "document_id": "doc_1",
                    "title": "Quantum Mechanics",
                    "final_score": 15.5,
                    "position": 1,
                },
                {
                    "document_id": "doc_2",
                    "title": "Quantum Field Theory",
                    "final_score": 12.3,
                    "position": 2,
                },
            ],
            "personalized": True,
            "user_profile": {"role": "student", "specialization": "Physics"},
        })
        mock_engine.register_click = AsyncMock()
        mock_engine.register_impressions = AsyncMock()
        mock_engine.close = AsyncMock()
        mock_engine_class.return_value = mock_engine

        search_response = await client.post(
            "/api/v1/search/",
            json={
                "query": "quantum physics",
                "user_id": 1,
                "enable_personalization": True,
            }
        )

        assert search_response.status_code == 200
        search_data = search_response.json()
        assert search_data["total"] == 2
        assert len(search_data["results"]) == 2
        assert search_data["personalized"] is True

        click_response = await client.post(
            "/api/v1/search/click",
            json={
                "query": "quantum physics",
                "user_id": 1,
                "document_id": "doc_1",
                "position": 1,
                "session_id": "test_session",
                "dwell_time": 45,
            }
        )

        assert click_response.status_code == 200
        assert click_response.json()["status"] == "ok"

    @patch("backend.app.api.search.AsyncSearchEngine")
    async def test_search_with_filters(
        self, mock_engine_class, client: AsyncClient
    ):
        mock_engine = AsyncMock()
        mock_engine.search = AsyncMock(return_value={
            "query": "mathematics",
            "total": 1,
            "results": [
                {
                    "document_id": "doc_math",
                    "title": "Linear Algebra",
                    "final_score": 20.0,
                    "position": 1,
                }
            ],
            "personalized": False,
            "user_profile": None,
        })
        mock_engine.close = AsyncMock()
        mock_engine_class.return_value = mock_engine

        response = await client.post(
            "/api/v1/search/",
            json={
                "query": "mathematics",
                "filters": {
                    "document_type": "textbook",
                }
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1


class TestSettingsFlowE2E:

    async def test_get_and_update_weights_flow(self, client: AsyncClient):
        get_response = await client.get("/api/v1/settings/weights")
        assert get_response.status_code == 200

        update_response = await client.put(
            "/api/v1/settings/weights",
            json={
                "w_user": 2.5,
                "alpha_type": 0.3,
                "alpha_topic": 0.7,
                "beta_ctr": 1.0,
                "ctr_alpha_prior": 1.0,
                "ctr_beta_prior": 10.0,
            }
        )
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["w_user"] == 2.5

        verify_response = await client.get("/api/v1/settings/weights")
        assert verify_response.status_code == 200
        verified = verify_response.json()
        assert verified["w_user"] == 2.5

    async def test_preset_flow(self, client: AsyncClient):
        presets_response = await client.get("/api/v1/settings/presets")
        assert presets_response.status_code == 200
        presets_data = presets_response.json()
        assert "presets" in presets_data

        apply_response = await client.post("/api/v1/settings/presets/high_personalization")
        assert apply_response.status_code == 200
        applied = apply_response.json()
        assert applied["w_user"] > 1.5

        reset_response = await client.post("/api/v1/settings/reset")
        assert reset_response.status_code == 200


class TestErrorRecoveryE2E:

    @patch("backend.app.api.search.AsyncSearchEngine")
    async def test_search_recovers_after_error(
        self, mock_engine_class, client: AsyncClient
    ):
        from opensearchpy.exceptions import ConnectionError as OSConnectionError

        call_count = 0

        async def search_side_effect(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise OSConnectionError("Temporary failure")
            return {
                "query": "test",
                "total": 1,
                "results": [{"document_id": "doc_1", "title": "Test", "final_score": 10.0}],
                "personalized": False,
                "user_profile": None,
            }

        mock_engine = AsyncMock()
        mock_engine.search = AsyncMock(side_effect=search_side_effect)
        mock_engine.close = AsyncMock()
        mock_engine_class.return_value = mock_engine

        response1 = await client.post(
            "/api/v1/search/",
            json={"query": "test"}
        )
        assert response1.status_code == 503

        response2 = await client.post(
            "/api/v1/search/",
            json={"query": "test"}
        )
        assert response2.status_code == 200

    @patch("backend.app.api.search.AsyncSearchEngine")
    async def test_graceful_degradation_without_personalization(
        self, mock_engine_class, client: AsyncClient
    ):
        mock_engine = AsyncMock()
        mock_engine.search = AsyncMock(return_value={
            "query": "test",
            "total": 1,
            "results": [{"document_id": "doc_1", "title": "Test", "final_score": 10.0}],
            "personalized": False,
            "user_profile": None,
        })
        mock_engine.close = AsyncMock()
        mock_engine_class.return_value = mock_engine

        response = await client.post(
            "/api/v1/search/",
            json={
                "query": "test",
                "user_id": 999999,
                "enable_personalization": True,
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["personalized"] is False


class TestConcurrentRequestsE2E:

    @patch("backend.app.api.search.AsyncSearchEngine")
    async def test_concurrent_searches(
        self, mock_engine_class, client: AsyncClient
    ):
        import asyncio

        mock_engine = AsyncMock()
        mock_engine.search = AsyncMock(return_value={
            "query": "test",
            "total": 1,
            "results": [{"document_id": "doc_1", "title": "Test", "final_score": 10.0}],
            "personalized": False,
            "user_profile": None,
        })
        mock_engine.close = AsyncMock()
        mock_engine_class.return_value = mock_engine

        async def do_search(query: str):
            return await client.post(
                "/api/v1/search/",
                json={"query": query}
            )

        tasks = [do_search(f"query_{i}") for i in range(10)]
        responses = await asyncio.gather(*tasks)

        assert all(r.status_code == 200 for r in responses)

    @patch("backend.app.api.search.AsyncSearchEngine")
    async def test_concurrent_clicks(
        self, mock_engine_class, client: AsyncClient
    ):
        import asyncio

        mock_engine = AsyncMock()
        mock_engine.register_click = AsyncMock()
        mock_engine.close = AsyncMock()
        mock_engine_class.return_value = mock_engine

        async def do_click(doc_id: str):
            return await client.post(
                "/api/v1/search/click",
                json={
                    "query": "test",
                    "user_id": 1,
                    "document_id": doc_id,
                    "position": 1,
                }
            )

        tasks = [do_click(f"doc_{i}") for i in range(10)]
        responses = await asyncio.gather(*tasks)

        assert all(r.status_code == 200 for r in responses)
