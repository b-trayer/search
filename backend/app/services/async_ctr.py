
import logging
import uuid
from typing import Dict, List, Optional, Tuple

from sqlalchemy import text, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models import Click, SearchQuery

logger = logging.getLogger(__name__)


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
    except Exception as e:
        logger.warning(f"Failed to get CTR data for query '{query}': {e}")

    return ctr_data


async def register_click(
    db: AsyncSession,
    query: str,
    document_id: str,
    user_id: int,
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

    await _ensure_impression(db, query, document_id, user_id, position, session_id)

    await db.commit()

    await _refresh_ctr_stats(db)


async def register_impressions(
    db: AsyncSession,
    query: str,
    user_id: int,
    document_ids: List[str],
    session_id: Optional[str] = None
) -> None:
    if not session_id:
        session_id = str(uuid.uuid4())

    try:
        for position, doc_id in enumerate(document_ids, 1):
            await db.execute(
                text("""
                    INSERT INTO impressions (query_text, document_id, user_id, position, session_id)
                    VALUES (:query, :doc_id, :user_id, :position, :session)
                    ON CONFLICT DO NOTHING
                """),
                {"query": query, "doc_id": doc_id, "user_id": user_id, "position": position, "session": session_id}
            )
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to register impressions for query '{query}': {e}")
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
    except Exception as e:
        logger.warning(f"Failed to ensure impression for doc '{doc_id}': {e}")


async def _refresh_ctr_stats(db: AsyncSession) -> None:
    try:
        await db.execute(text("REFRESH MATERIALIZED VIEW CONCURRENTLY ctr_stats"))
        await db.commit()
    except Exception as e:
        logger.debug(f"Failed to refresh CTR stats view: {e}")


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
    except Exception as e:
        logger.error(f"Failed to get total stats: {e}")
        return {"total_impressions": 0, "total_clicks": 0}
