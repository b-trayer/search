
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Generator, Optional

from opensearchpy import AsyncOpenSearch
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import Session, sessionmaker

from backend.app.config import settings


Base = declarative_base()


sync_engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async_engine = create_async_engine(
    settings.async_database_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=False,
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


@asynccontextmanager
async def async_session_context() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


engine = sync_engine


class OpenSearchClientManager:
    _client: Optional[AsyncOpenSearch] = None

    @classmethod
    def get_client(cls) -> AsyncOpenSearch:
        if cls._client is None:
            cls._client = AsyncOpenSearch(
                hosts=[{'host': settings.opensearch_host, 'port': settings.opensearch_port}],
                http_compress=True,
                use_ssl=False,
                verify_certs=False,
                timeout=30,
            )
        return cls._client

    @classmethod
    async def close_client(cls) -> None:
        if cls._client is not None:
            await cls._client.close()
            cls._client = None


async def get_opensearch_client() -> AsyncGenerator[AsyncOpenSearch, None]:
    client = OpenSearchClientManager.get_client()
    yield client
