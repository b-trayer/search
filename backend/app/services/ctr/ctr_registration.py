
import logging
import uuid
from typing import List, Optional

from sqlalchemy import text, select
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, OperationalError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models import Click, SearchQuery
from .ctr_exceptions import DatabaseConnectionError

logger = logging.getLogger(__name__)


async def _refresh_ctr_stats(db: AsyncSession) -> None:
    try:
        await db.execute(text("REFRESH MATERIALIZED VIEW CONCURRENTLY ctr_stats"))
        await db.commit()
    except OperationalError as e:
        logger.warning(f"Database connection error while refreshing CTR stats view: {e}")
    except SQLAlchemyError as e:
        logger.warning(f"Failed to refresh CTR stats view: {e}")


async def register_click(
    db: AsyncSession,
    query: str,
    document_id: str,
    user_id: Optional[int],
    position: int,
    session_id: Optional[str] = None,
    dwell_time: Optional[int] = None
) -> None:
    if not session_id:
        session_id = str(uuid.uuid4())

    stmt = select(SearchQuery).where(
        SearchQuery.query_text == query,
        SearchQuery.session_id == session_id
    )
    result = await db.execute(stmt)
    query_obj = result.scalar_one_or_none()

    if not query_obj:
        query_obj = SearchQuery(
            user_id=user_id,
            query_text=query,
            session_id=session_id
        )
        db.add(query_obj)
        await db.flush()

    click = Click(
        query_id=query_obj.query_id,
        user_id=user_id,
        document_id=document_id,
        query_text=query,
        position=position,
        session_id=session_id,
        dwell_time=dwell_time
    )
    db.add(click)

    await db.commit()

    await _refresh_ctr_stats(db)


async def register_impressions(
    db: AsyncSession,
    query: str,
    user_id: Optional[int],
    document_ids: List[str],
    session_id: Optional[str] = None
) -> None:
    if not session_id:
        session_id = str(uuid.uuid4())

    if not document_ids:
        return

    try:
        values = [
            {"query": query, "doc_id": doc_id, "user_id": user_id, "position": position, "session": session_id}
            for position, doc_id in enumerate(document_ids, 1)
        ]

        await db.execute(
            text("""
                INSERT INTO impressions (query_text, document_id, user_id, position, session_id)
                VALUES (:query, :doc_id, :user_id, :position, :session)
                ON CONFLICT DO NOTHING
            """),
            values
        )
        await db.commit()
        await _refresh_ctr_stats(db)
    except OperationalError as e:
        logger.error(f"Database connection error while registering impressions for query '{query}': {e}")
        await db.rollback()
        raise DatabaseConnectionError(f"Failed to connect to database: {e}") from e
    except IntegrityError as e:
        logger.warning(f"Duplicate impression detected for query '{query}': {e}")
        await db.rollback()
    except SQLAlchemyError as e:
        logger.error(f"Database error while registering impressions for query '{query}': {e}")
        await db.rollback()
