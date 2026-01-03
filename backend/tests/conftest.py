
import pytest
import pytest_asyncio
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from backend.app.main import app
from backend.app.database import get_async_db


@pytest.fixture
def mock_db():
    engine = create_engine("sqlite:///:memory:")
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture
def sample_user_profile():
    return {
        "user_id": 1,
        "username": "test_user",
        "role": "student",
        "specialization": "Физика",
        "faculty": "ФФ",
        "course": 3,
        "interests": ["квантовая механика", "оптика"]
    }


@pytest.fixture
def sample_document():
    return {
        "document_id": "doc_123",
        "title": "Квантовая механика: учебник",
        "авторы": "Ландау Л.Д.",
        "литература_по_отраслям_знания": "Физика. Квантовая механика",
        "коллекция": "Учебные издания",
        "организация": "НГУ",
        "язык": "Русский"
    }


@pytest.fixture
def sample_search_hits(sample_document):
    return [
        {
            "_score": 10.5,
            "_source": sample_document,
            "highlight": {"title": ["<mark>Квантовая</mark> механика"]}
        },
        {
            "_score": 8.2,
            "_source": {
                "document_id": "doc_456",
                "title": "История России",
                "авторы": "Иванов И.И.",
                "литература_по_отраслям_знания": "История",
                "коллекция": "Учебные издания",
            },
            "highlight": {}
        }
    ]


@pytest_asyncio.fixture
async def mock_async_session():
    session = AsyncMock(spec=AsyncSession)
    session.execute = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.close = AsyncMock()
    return session


@pytest_asyncio.fixture
async def mock_opensearch():
    mock_instance = MagicMock()
    mock_instance.search = AsyncMock(return_value={
        "hits": {
            "total": {"value": 2},
            "hits": [
                {
                    "_id": "doc_1",
                    "_score": 10.5,
                    "_source": {
                        "title": "Test Document 1",
                        "авторы": "Test Author",
                        "коллекция": "Учебники"
                    }
                },
                {
                    "_id": "doc_2",
                    "_score": 8.3,
                    "_source": {
                        "title": "Test Document 2",
                        "авторы": "Another Author",
                        "коллекция": "Монографии"
                    }
                }
            ]
        }
    })
    mock_instance.close = AsyncMock()
    return mock_instance


@pytest_asyncio.fixture
async def client(mock_async_session) -> AsyncGenerator[AsyncClient, None]:

    async def override_get_async_db():
        yield mock_async_session

    app.dependency_overrides[get_async_db] = override_get_async_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def sample_search_request():
    return {
        "query": "квантовая механика",
        "user_id": 1,
        "top_k": 10,
        "enable_personalization": True,
        "filters": None
    }


@pytest.fixture
def sample_click_event():
    return {
        "query": "квантовая механика",
        "user_id": 1,
        "document_id": "doc_123",
        "position": 1,
        "session_id": "session_abc",
        "dwell_time": 30
    }
