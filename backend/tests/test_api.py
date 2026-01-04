import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from backend.app.main import app
from backend.app.schemas.settings import RankingWeights, WeightPreset


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def mock_db():
    return Mock()


class TestSearchAPI:

    def test_search_requires_query(self, client):
        response = client.post("/api/v1/search/", json={})
        assert response.status_code == 422

    def test_search_with_empty_query(self, client):
        response = client.post("/api/v1/search/", json={"query": ""})
        assert response.status_code == 422

    @patch("backend.app.api.search.AsyncSearchEngine")
    @patch("backend.app.api.search.get_opensearch_client")
    @patch("backend.app.api.search.get_async_db")
    def test_search_returns_results(self, mock_get_db, mock_get_opensearch, mock_engine_class, client):
        mock_db = AsyncMock()
        mock_get_db.return_value = mock_db
        mock_opensearch = MagicMock()
        mock_get_opensearch.return_value = mock_opensearch

        mock_engine = MagicMock()
        mock_engine.search = AsyncMock(return_value={
            "query": "физика",
            "total": 10,
            "page": 1,
            "per_page": 20,
            "total_pages": 1,
            "results": [
                {
                    "document_id": "doc_1",
                    "title": "Физика атома",
                    "authors": "Иванов И.И.",
                    "final_score": 5.5,
                }
            ],
            "personalized": False,
            "user_profile": None,
        })
        mock_engine_class.return_value = mock_engine

        response = client.post("/api/v1/search/", json={"query": "физика"})

        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert "total" in data

    @patch("backend.app.api.search.AsyncSearchEngine")
    @patch("backend.app.api.search.get_opensearch_client")
    @patch("backend.app.api.search.get_async_db")
    def test_search_with_user_id(self, mock_get_db, mock_get_opensearch, mock_engine_class, client):
        mock_db = AsyncMock()
        mock_get_db.return_value = mock_db
        mock_opensearch = MagicMock()
        mock_get_opensearch.return_value = mock_opensearch

        mock_engine = MagicMock()
        mock_engine.search = AsyncMock(return_value={
            "query": "физика",
            "total": 5,
            "page": 1,
            "per_page": 20,
            "total_pages": 1,
            "results": [],
            "personalized": True,
            "user_profile": {"user_id": 1, "role": "student"},
        })
        mock_engine_class.return_value = mock_engine

        response = client.post(
            "/api/v1/search/",
            json={"query": "физика", "user_id": 1, "enable_personalization": True}
        )

        assert response.status_code == 200
        data = response.json()
        assert data.get("personalized") is True

    @patch("backend.app.api.search.AsyncSearchEngine")
    @patch("backend.app.api.search.get_opensearch_client")
    @patch("backend.app.api.search.get_async_db")
    def test_search_respects_per_page(self, mock_get_db, mock_get_opensearch, mock_engine_class, client):
        mock_db = AsyncMock()
        mock_get_db.return_value = mock_db
        mock_opensearch = MagicMock()
        mock_get_opensearch.return_value = mock_opensearch

        mock_engine = MagicMock()
        mock_engine.search = AsyncMock(return_value={
            "query": "test",
            "total": 100,
            "page": 1,
            "per_page": 5,
            "total_pages": 20,
            "results": [{"document_id": f"doc_{i}"} for i in range(5)],
            "personalized": False,
            "user_profile": None,
        })
        mock_engine_class.return_value = mock_engine

        response = client.post("/api/v1/search/", json={"query": "test", "per_page": 5})

        assert response.status_code == 200
        mock_engine.search.assert_called_once()


class TestSettingsAPI:

    def test_get_weights(self, client):
        response = client.get("/api/v1/settings/weights")

        assert response.status_code == 200
        data = response.json()
        assert "w_user" in data
        assert "alpha_type" in data
        assert "alpha_topic" in data
        assert "beta_ctr" in data

    def test_get_weights_has_valid_ranges(self, client):
        response = client.get("/api/v1/settings/weights")
        data = response.json()

        assert 0 <= data["w_user"] <= 5
        assert 0 <= data["alpha_type"] <= 1
        assert 0 <= data["alpha_topic"] <= 1
        assert 0 <= data["beta_ctr"] <= 3

    def test_update_weights(self, client):
        new_weights = {
            "w_user": 2.0,
            "alpha_type": 0.5,
            "alpha_topic": 0.5,
            "beta_ctr": 1.0,
            "ctr_alpha_prior": 1.0,
            "ctr_beta_prior": 10.0,
        }

        response = client.put("/api/v1/settings/weights", json=new_weights)

        assert response.status_code == 200
        data = response.json()
        assert data["w_user"] == 2.0

    def test_update_weights_validates_range(self, client):
        invalid_weights = {
            "w_user": 10.0,
            "alpha_type": 0.5,
            "alpha_topic": 0.5,
            "beta_ctr": 1.0,
        }

        response = client.put("/api/v1/settings/weights", json=invalid_weights)

        assert response.status_code == 422

    def test_get_presets(self, client):
        response = client.get("/api/v1/settings/presets")

        assert response.status_code == 200
        data = response.json()
        assert "presets" in data
        preset_names = [p["name"] for p in data["presets"]]
        assert "default" in preset_names
        assert "high_personalization" in preset_names
        assert "bm25_only" in preset_names

    def test_apply_preset(self, client):
        response = client.post("/api/v1/settings/presets/high_personalization")

        assert response.status_code == 200
        data = response.json()
        assert data["w_user"] == 3.0

    def test_apply_invalid_preset(self, client):
        response = client.post("/api/v1/settings/presets/invalid_preset")

        assert response.status_code == 400


class TestUsersAPI:

    @pytest.fixture
    def mock_db_session(self):
        mock_db = MagicMock()
        return mock_db

    @pytest.fixture
    def client_with_mock_db(self, mock_db_session):
        from backend.app.database import get_db

        def override_get_db():
            yield mock_db_session

        app.dependency_overrides[get_db] = override_get_db
        yield TestClient(app), mock_db_session
        app.dependency_overrides.clear()

    def test_get_users_list(self, client_with_mock_db):
        client, mock_db = client_with_mock_db
        mock_query = MagicMock()
        mock_user = MagicMock()
        mock_user.user_id = 1
        mock_user.username = "test_user"
        mock_user.email = "test@nsu.ru"
        mock_user.role = "student"
        mock_user.specialization = "Физика"
        mock_user.faculty = "ФФ"
        mock_user.course = 3
        mock_user.interests = ["физика"]
        mock_user.created_at = None
        mock_user.updated_at = None
        mock_query.offset.return_value.limit.return_value.all.return_value = [mock_user]
        mock_db.query.return_value = mock_query

        response = client.get("/api/v1/users/")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_user_by_id(self, client_with_mock_db):
        client, mock_db = client_with_mock_db
        mock_user = MagicMock()
        mock_user.user_id = 1
        mock_user.username = "test_user"
        mock_user.email = "test@nsu.ru"
        mock_user.role = "student"
        mock_user.specialization = "Физика"
        mock_user.faculty = "ФФ"
        mock_user.course = 3
        mock_user.interests = ["физика"]
        mock_user.created_at = None
        mock_user.updated_at = None
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user

        response = client.get("/api/v1/users/1")

        assert response.status_code == 200

    def test_get_nonexistent_user(self, client_with_mock_db):
        client, mock_db = client_with_mock_db
        mock_db.query.return_value.filter.return_value.first.return_value = None

        response = client.get("/api/v1/users/99999")

        assert response.status_code == 404

    def test_get_users_limit_validation(self, client):
        response = client.get("/api/v1/users/?limit=500")
        assert response.status_code == 422

    def test_get_users_negative_offset(self, client):
        response = client.get("/api/v1/users/?offset=-1")
        assert response.status_code == 422

    def test_get_users_zero_limit(self, client):
        response = client.get("/api/v1/users/?limit=0")
        assert response.status_code == 422

    def test_get_users_with_role_filter(self, client_with_mock_db):
        client, mock_db = client_with_mock_db
        mock_query = MagicMock()
        mock_query.filter.return_value = mock_query
        mock_query.offset.return_value.limit.return_value.all.return_value = []
        mock_db.query.return_value = mock_query

        response = client.get("/api/v1/users/?role=student")

        assert response.status_code == 200

    def test_get_user_stats(self, client_with_mock_db):
        client, mock_db = client_with_mock_db
        mock_user = MagicMock()
        mock_user.user_id = 1
        mock_user.username = "test_user"
        mock_user.role = "student"
        mock_user.specialization = "Физика"
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        mock_db.query.return_value.filter.return_value.count.return_value = 42

        response = client.get("/api/v1/users/1/stats")

        assert response.status_code == 200
        data = response.json()
        assert "total_clicks" in data
        assert "username" in data

    def test_get_stats_nonexistent_user(self, client_with_mock_db):
        client, mock_db = client_with_mock_db
        mock_db.query.return_value.filter.return_value.first.return_value = None

        response = client.get("/api/v1/users/99999/stats")

        assert response.status_code == 404


class TestClickAPI:

    @patch("backend.app.api.search.AsyncSearchEngine")
    @patch("backend.app.api.search.get_opensearch_client")
    @patch("backend.app.api.search.get_async_db")
    def test_register_click(self, mock_get_db, mock_get_opensearch, mock_engine_class, client):
        mock_db = AsyncMock()
        mock_get_db.return_value = mock_db
        mock_opensearch = MagicMock()
        mock_get_opensearch.return_value = mock_opensearch

        mock_engine = MagicMock()
        mock_engine.register_click = AsyncMock()
        mock_engine_class.return_value = mock_engine

        response = client.post(
            "/api/v1/search/click",
            json={
                "query": "физика",
                "user_id": 1,
                "document_id": "doc_123",
                "position": 1,
            }
        )

        assert response.status_code == 200
        mock_engine.register_click.assert_called_once()

    def test_register_click_requires_fields(self, client):
        response = client.post("/api/v1/search/click", json={"query": "test"})

        assert response.status_code == 422


class TestHealthCheck:

    def test_health_check(self, client):
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
