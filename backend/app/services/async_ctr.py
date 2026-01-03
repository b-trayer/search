
import uuid
from typing import Dict, List, Optional, Tuple

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def get_batch_ctr_data(
    db: AsyncSession, query: str
) -> Dict[str, Tuple[int, int]]:
    ctr_data = {}

    try:
        result = await db.execute(
            text("""
                SELECT document_id,
                       COALESCE(SUM(clicks), 0) as clicks,
                       COALESCE(SUM(impressions), 0) as impressions
                FROM ctr_stats
                WHERE query_text = :query
                GROUP BY document_id
    from backend.app.models import Click, SearchQuery
    from sqlalchemy import select

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
    try:
        result = await db.execute(
            text("""
                SELECT 1 FROM impressions
                WHERE query_text = :query AND document_id = :doc_id AND session_id = :session
                    INSERT INTO impressions (query_text, document_id, user_id, position, session_id)
                    VALUES (:query, :doc_id, :user_id, :position, :session)
    try:
        await db.execute(text("REFRESH MATERIALIZED VIEW ctr_stats"))
        await db.commit()
    except Exception:
        pass
