
import logging
import uuid
from typing import Dict, List, Optional, Tuple

from sqlalchemy import text, select
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, OperationalError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models import Click, SearchQuery

logger = logging.getLogger(__name__)


class CTRServiceError(Exception):
    """Base exception for CTR service errors."""
    pass


class DatabaseConnectionError(CTRServiceError):
    """Raised when database connection fails."""
    pass


class CTRDataError(CTRServiceError):
    """Raised when CTR data retrieval fails."""
    pass


async def get_batch_ctr_data(
    db: AsyncSession, query: str
) -> Dict[str, Tuple[int, int]]:
    ctr_data: Dict[str, Tuple[int, int]] = {}

    try:
        result = await db.execute(
            text("""
                SELECT document_id,
                       COALESCE(SUM(clicks), 0) as clicks,
                       COALESCE(SUM(impressions), 0) as impressions
                FROM ctr_stats
                WHERE query_text = :query
                GROUP BY document_id
            """),
            {"query": query}
        )
        for row in result.fetchall():
            ctr_data[row[0]] = (int(row[1]), int(row[2]))
    except OperationalError as e:
        logger.error(f"Database connection error while fetching CTR data for query '{query}': {e}")
        raise DatabaseConnectionError(f"Failed to connect to database: {e}") from e
    except IntegrityError as e:
        logger.error(f"Data integrity error for query '{query}': {e}")
        raise CTRDataError(f"Data integrity violation: {e}") from e
    except SQLAlchemyError as e:
        logger.warning(f"Database error while fetching CTR data for query '{query}': {e}")
    except ValueError as e:
        logger.warning(f"Invalid CTR data format for query '{query}': {e}")

    return ctr_data


async def get_aggregated_ctr_data(
    db: AsyncSession, document_ids: List[str]
) -> Dict[str, Tuple[int, int]]:
    """Get aggregated CTR data across all queries for given documents."""
    ctr_data: Dict[str, Tuple[int, int]] = {}

    if not document_ids:
        return ctr_data

    try:
        result = await db.execute(
            text("""
                SELECT document_id,
                       COALESCE(SUM(clicks), 0) as clicks,
                       COALESCE(SUM(impressions), 0) as impressions
                FROM ctr_stats
                WHERE document_id = ANY(:doc_ids)
                GROUP BY document_id
            """),
            {"doc_ids": document_ids}
        )
        for row in result.fetchall():
            ctr_data[row[0]] = (int(row[1]), int(row[2]))
    except OperationalError as e:
        logger.error(f"Database connection error while fetching aggregated CTR data: {e}")
        raise DatabaseConnectionError(f"Failed to connect to database: {e}") from e
    except SQLAlchemyError as e:
        logger.warning(f"Database error while fetching aggregated CTR data: {e}")

    return ctr_data


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


async def _ensure_impression(
    db: AsyncSession,
    query: str,
    doc_id: str,
    user_id: int,
    position: int,
    session_id: str
) -> None:
    try:
        result = await db.execute(
            text("""
                SELECT 1 FROM impressions
                WHERE query_text = :query AND document_id = :doc_id AND session_id = :session
            """),
            {"query": query, "doc_id": doc_id, "session": session_id}
        )
        if not result.fetchone():
            await db.execute(
                text("""
                    INSERT INTO impressions (query_text, document_id, user_id, position, session_id)
                    VALUES (:query, :doc_id, :user_id, :position, :session)
                """),
                {"query": query, "doc_id": doc_id, "user_id": user_id, "position": position, "session": session_id}
            )
    except OperationalError as e:
        logger.error(f"Database connection error while ensuring impression for doc '{doc_id}': {e}")
        raise DatabaseConnectionError(f"Failed to connect to database: {e}") from e
    except IntegrityError:
        pass
    except SQLAlchemyError as e:
        logger.warning(f"Database error while ensuring impression for doc '{doc_id}': {e}")


async def _refresh_ctr_stats(db: AsyncSession) -> None:
    try:
        await db.execute(text("REFRESH MATERIALIZED VIEW CONCURRENTLY ctr_stats"))
        await db.commit()
    except OperationalError as e:
        logger.warning(f"Database connection error while refreshing CTR stats view: {e}")
    except SQLAlchemyError as e:
        logger.warning(f"Failed to refresh CTR stats view: {e}")


async def get_total_stats(db: AsyncSession) -> Dict[str, int]:
    """Get total impressions and clicks from the database."""
    try:
        result = await db.execute(
            text("SELECT COUNT(*) FROM impressions")
        )
        total_impressions = result.scalar() or 0

        result = await db.execute(
            text("SELECT COUNT(*) FROM clicks")
        )
        total_clicks = result.scalar() or 0

        return {
            "total_impressions": total_impressions,
            "total_clicks": total_clicks
        }
    except OperationalError as e:
        logger.error(f"Database connection error while getting total stats: {e}")
        raise DatabaseConnectionError(f"Failed to connect to database: {e}") from e
    except SQLAlchemyError as e:
        logger.error(f"Database error while getting total stats: {e}")
        return {"total_impressions": 0, "total_clicks": 0}
