
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, MagicMock
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
        response = client.post("/api/search/", json={})
        assert response.status_code == 422

    def test_search_with_empty_query(self, client):
        response = client.post("/api/search/", json={"query": ""})
        assert response.status_code == 422

    @patch("backend.app.api.search.SearchEngine")
    def test_search_returns_results(self, mock_engine_class, client):
        mock_engine = MagicMock()
        mock_engine.search.return_value = {
            "query": "физика",
            "total": 10,
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
        }
        mock_engine_class.return_value = mock_engine

        response = client.post("/api/search/", json={"query": "физика"})

        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert "total" in data

    @patch("backend.app.api.search.SearchEngine")
    def test_search_with_user_id(self, mock_engine_class, client):
        mock_engine = MagicMock()
        mock_engine.search.return_value = {
            "query": "физика",
            "total": 5,
            "results": [],
            "personalized": True,
            "user_profile": {"user_id": 1, "role": "student"},
        }
        mock_engine_class.return_value = mock_engine

        response = client.post(
            "/api/search/",
            json={"query": "физика", "user_id": 1, "enable_personalization": True}
        )

        assert response.status_code == 200
        data = response.json()
        assert data.get("personalized") is True

    @patch("backend.app.api.search.SearchEngine")
    def test_search_respects_top_k(self, mock_engine_class, client):
        mock_engine = MagicMock()
        mock_engine.search.return_value = {
            "query": "test",
            "total": 100,
            "results": [{"document_id": f"doc_{i}"} for i in range(5)],
            "personalized": False,
            "user_profile": None,
        }
        mock_engine_class.return_value = mock_engine

        response = client.post("/api/search/", json={"query": "test", "top_k": 5})

        assert response.status_code == 200
        mock_engine.search.assert_called_once()
        call_kwargs = mock_engine.search.call_args[1]
        assert call_kwargs.get("top_k") == 5


class TestSettingsAPI:

    def test_get_weights(self, client):
        response = client.get("/api/settings/weights")

        assert response.status_code == 200
        data = response.json()
        assert "w_user" in data
        assert "alpha_type" in data
        assert "alpha_topic" in data
        assert "beta_ctr" in data

    def test_get_weights_has_valid_ranges(self, client):
        response = client.get("/api/settings/weights")
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

        response = client.put("/api/settings/weights", json=new_weights)

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

        response = client.put("/api/settings/weights", json=invalid_weights)

        assert response.status_code == 422

    def test_get_presets(self, client):
        response = client.get("/api/settings/presets")

        assert response.status_code == 200
        data = response.json()
        assert "presets" in data
        preset_names = [p["name"] for p in data["presets"]]
        assert "default" in preset_names
        assert "high_personalization" in preset_names
        assert "bm25_only" in preset_names

    def test_apply_preset(self, client):
        response = client.post("/api/settings/presets/high_personalization")

        assert response.status_code == 200
        data = response.json()
        assert data["w_user"] == 3.0

    def test_apply_invalid_preset(self, client):
        response = client.post("/api/settings/presets/invalid_preset")

        assert response.status_code == 400


class TestUsersAPI:

    @patch("backend.app.api.users.get_db")
    def test_get_users_list(self, mock_get_db, client):
        mock_db = MagicMock()
        mock_query = MagicMock()
        mock_query.offset.return_value.limit.return_value.all.return_value = [
            MagicMock(
                user_id=1,
                username="test_user",
                email="test@nsu.ru",
                role="student",
                specialization="Физика",
                course=3,
                interests=["физика"],
                created_at=None,
                updated_at=None,
            )
        ]
        mock_db.query.return_value = mock_query
        mock_get_db.return_value = iter([mock_db])

        response = client.get("/api/users/")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    @patch("backend.app.api.users.get_db")
    def test_get_user_by_id(self, mock_get_db, client):
        mock_db = MagicMock()
        mock_user = MagicMock(
            user_id=1,
            username="test_user",
            email="test@nsu.ru",
            role="student",
            specialization="Физика",
            course=3,
            interests=["физика"],
            created_at=None,
            updated_at=None,
        )
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        mock_get_db.return_value = iter([mock_db])

        response = client.get("/api/users/1")

        assert response.status_code == 200

    @patch("backend.app.api.users.get_db")
    def test_get_nonexistent_user(self, mock_get_db, client):
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = None
        mock_get_db.return_value = iter([mock_db])

        response = client.get("/api/users/99999")

        assert response.status_code == 404

    def test_get_users_limit_validation(self, client):
        response = client.get("/api/users/?limit=500")
        assert response.status_code == 422

    def test_get_users_negative_offset(self, client):
        response = client.get("/api/users/?offset=-1")
        assert response.status_code == 422

    def test_get_users_zero_limit(self, client):
        response = client.get("/api/users/?limit=0")
        assert response.status_code == 422

    @patch("backend.app.api.users.get_db")
    def test_get_users_with_role_filter(self, mock_get_db, client):
        mock_db = MagicMock()
        mock_query = MagicMock()
        mock_query.filter.return_value = mock_query
        mock_query.offset.return_value.limit.return_value.all.return_value = []
        mock_db.query.return_value = mock_query
        mock_get_db.return_value = iter([mock_db])

        response = client.get("/api/users/?role=student")

        assert response.status_code == 200
        mock_query.filter.assert_called_once()

    @patch("backend.app.api.users.get_db")
    def test_get_user_stats(self, mock_get_db, client):
        mock_db = MagicMock()
        mock_user = MagicMock(
            user_id=1,
            username="test_user",
            role="student",
            specialization="Физика",
        )
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        mock_db.query.return_value.filter.return_value.count.return_value = 42
        mock_get_db.return_value = iter([mock_db])

        response = client.get("/api/users/1/stats")

        assert response.status_code == 200
        data = response.json()
        assert "total_clicks" in data
        assert "username" in data

    @patch("backend.app.api.users.get_db")
    def test_get_stats_nonexistent_user(self, mock_get_db, client):
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = None
        mock_get_db.return_value = iter([mock_db])

        response = client.get("/api/users/99999/stats")

        assert response.status_code == 404


class TestClickAPI:

    @patch("backend.app.api.search.SearchEngine")
    def test_register_click(self, mock_engine_class, client):
        mock_engine = MagicMock()
        mock_engine_class.return_value = mock_engine

        response = client.post(
            "/api/search/click",
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
        response = client.post("/api/search/click", json={"query": "test"})

        assert response.status_code == 422


class TestHealthCheck:

    def test_health_check(self, client):
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
