
import pytest
import asyncio
from typing import AsyncGenerator, Generator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from opensearchpy import AsyncOpenSearch
from testcontainers.postgres import PostgresContainer
from testcontainers.opensearch import OpenSearchContainer

from backend.app.database import Base
from backend.app.models import User, Click, Impression
from backend.app.services.ranking import apply_ranking_formula, bayesian_smoothed_ctr
from backend.app.services.ctr import get_batch_ctr_data, register_click, register_impressions


@pytest.fixture(scope="module")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="module")
def postgres_container() -> Generator[PostgresContainer, None, None]:
    container = PostgresContainer(
        image="postgres:15",
        username="test",
        password="test",
        dbname="test_db",
    )
    container.start()
    yield container
    container.stop()


@pytest.fixture(scope="module")
def opensearch_container() -> Generator[OpenSearchContainer, None, None]:
    container = OpenSearchContainer(image="opensearchproject/opensearch:2.11.0")
    container.start()
    yield container
    container.stop()


@pytest.fixture(scope="module")
async def async_engine(postgres_container: PostgresContainer):
    connection_url = postgres_container.get_connection_url()
    async_url = connection_url.replace("postgresql://", "postgresql+asyncpg://")

    engine = create_async_engine(async_url, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    await engine.dispose()


@pytest.fixture
async def db_session(async_engine) -> AsyncGenerator[AsyncSession, None]:
    async_session_maker = async_sessionmaker(
        bind=async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with async_session_maker() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def opensearch_client(opensearch_container: OpenSearchContainer) -> AsyncGenerator[AsyncOpenSearch, None]:
    host = opensearch_container.get_container_host_ip()
    port = opensearch_container.get_exposed_port(9200)

    client = AsyncOpenSearch(
        hosts=[{"host": host, "port": int(port)}],
        http_compress=True,
        use_ssl=False,
        verify_certs=False,
        timeout=30,
    )

    yield client

    await client.close()


class TestDatabaseIntegration:

    @pytest.mark.asyncio
    async def test_create_user(self, db_session: AsyncSession):
        user = User(
            username="test_student",
            email="student@test.nsu.ru",
            role="student",
            specialization="Физика",
            course=3,
            interests=["квантовая механика", "оптика"],
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        assert user.user_id is not None
        assert user.username == "test_student"
        assert user.role == "student"

    @pytest.mark.asyncio
    async def test_register_click_and_impression(self, db_session: AsyncSession):
        user = User(
            username="click_test_user",
            email="clicktest@nsu.ru",
            role="master",
            specialization="Информатика",
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        await register_impressions(
            db_session,
            query="машинное обучение",
            user_id=user.user_id,
            document_ids=["doc_1", "doc_2", "doc_3"],
            session_id="test_session",
        )

        await register_click(
            db_session,
            query="машинное обучение",
            document_id="doc_1",
            user_id=user.user_id,
            position=1,
            session_id="test_session",
        )

        ctr_data = await get_batch_ctr_data(db_session, "машинное обучение")

        assert "doc_1" in ctr_data
        clicks, impressions = ctr_data["doc_1"]
        assert clicks >= 1
        assert impressions >= 1

    @pytest.mark.asyncio
    async def test_ctr_calculation(self, db_session: AsyncSession):
        user = User(
            username="ctr_test_user",
            email="ctrtest@nsu.ru",
            role="phd",
            specialization="Математика",
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        query = "дифференциальные уравнения"
        doc_id = "ctr_test_doc"

        for _ in range(10):
            await register_impressions(db_session, query, user.user_id, [doc_id])

        for _ in range(3):
            await register_click(db_session, query, doc_id, user.user_id, 1)

        ctr_data = await get_batch_ctr_data(db_session, query)

        assert doc_id in ctr_data
        clicks, impressions = ctr_data[doc_id]
        assert clicks == 3
        assert impressions == 10

        smoothed_ctr = bayesian_smoothed_ctr(clicks, impressions)
        assert 0.1 < smoothed_ctr < 0.5


class TestOpenSearchIntegration:

    @pytest.mark.asyncio
    async def test_index_and_search(self, opensearch_client: AsyncOpenSearch):
        index_name = "test_documents"

        if await opensearch_client.indices.exists(index=index_name):
            await opensearch_client.indices.delete(index=index_name)

        await opensearch_client.indices.create(
            index=index_name,
            body={
                "settings": {"number_of_shards": 1, "number_of_replicas": 0},
                "mappings": {
                    "properties": {
                        "document_id": {"type": "keyword"},
                        "title": {"type": "text", "analyzer": "russian"},
                        "authors": {"type": "text"},
                        "subjects": {"type": "text"},
                    }
                }
            }
        )

        docs = [
            {"document_id": "doc_1", "title": "Квантовая механика", "authors": "Ландау Л.Д.", "subjects": ["физика"]},
            {"document_id": "doc_2", "title": "Математический анализ", "authors": "Зорич В.А.", "subjects": ["математика"]},
            {"document_id": "doc_3", "title": "Введение в квантовую теорию поля", "authors": "Пескин М.", "subjects": ["физика"]},
        ]

        for doc in docs:
            await opensearch_client.index(index=index_name, body=doc, id=doc["document_id"], refresh=True)

        response = await opensearch_client.search(
            index=index_name,
            body={
                "query": {
                    "multi_match": {
                        "query": "квантовая",
                        "fields": ["title^3", "subjects"],
                    }
                }
            }
        )

        hits = response["hits"]["hits"]
        assert len(hits) >= 2

        doc_ids = [hit["_source"]["document_id"] for hit in hits]
        assert "doc_1" in doc_ids
        assert "doc_3" in doc_ids

        await opensearch_client.indices.delete(index=index_name)

    @pytest.mark.asyncio
    async def test_ranking_formula_with_real_hits(self, opensearch_client: AsyncOpenSearch):
        hits = [
            {
                "_score": 10.0,
                "_source": {
                    "document_id": "physics_doc",
                    "title": "Физика твёрдого тела",
                    "коллекция": "Учебные издания",
                    "литература_по_отраслям_знания": "Физика",
                }
            },
            {
                "_score": 8.0,
                "_source": {
                    "document_id": "math_doc",
                    "title": "Линейная алгебра",
                    "коллекция": "Учебные издания",
                    "литература_по_отраслям_знания": "Математика",
                }
            },
        ]

        ctr_data = {"physics_doc": (5, 100), "math_doc": (2, 50)}
        user_profile = {"role": "student", "specialization": "Физика", "interests": []}

        results = apply_ranking_formula(hits, ctr_data, user_profile, enable_personalization=True)

        assert len(results) == 2
        assert results[0]["document_id"] == "physics_doc"
        assert results[0]["position"] == 1
        assert results[0]["final_score"] > results[1]["final_score"]


class TestEndToEndFlow:

    @pytest.mark.asyncio
    async def test_search_with_ctr_boost(self, db_session: AsyncSession):
        user = User(
            username="e2e_user",
            email="e2e@nsu.ru",
            role="student",
            specialization="Физика",
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        query = "теоретическая физика"
        popular_doc = "popular_physics_doc"
        unpopular_doc = "unpopular_physics_doc"

        for _ in range(50):
            await register_impressions(db_session, query, user.user_id, [popular_doc, unpopular_doc])

        for _ in range(20):
            await register_click(db_session, query, popular_doc, user.user_id, 1)

        await register_click(db_session, query, unpopular_doc, user.user_id, 2)

        ctr_data = await get_batch_ctr_data(db_session, query)

        assert ctr_data[popular_doc][0] > ctr_data[unpopular_doc][0]

        hits = [
            {"_score": 10.0, "_source": {"document_id": popular_doc, "title": "Популярная книга"}},
            {"_score": 10.0, "_source": {"document_id": unpopular_doc, "title": "Непопулярная книга"}},
        ]

        results = apply_ranking_formula(hits, ctr_data, None, enable_personalization=False)

        assert results[0]["document_id"] == popular_doc
        assert results[0]["ctr_contrib"] > results[1]["ctr_contrib"]
