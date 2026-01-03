
import uuid
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import text


def get_batch_ctr_data(db: Session, query: str) -> Dict[str, Tuple[int, int]]:
    ctr_data = {}

    try:
        result = db.execute(
            text("""
                SELECT document_id,
                       COALESCE(SUM(clicks), 0) as clicks,
                       COALESCE(SUM(impressions), 0) as impressions
                FROM ctr_stats
                WHERE query_text = :query
                GROUP BY document_id
    Get global prior CTR (average across all documents).
    Used for new queries.
                SELECT
                    COALESCE(AVG(clicks::float / NULLIF(impressions, 0)), 0.1) as avg_ctr,
                    COALESCE(AVG(impressions), 10) as avg_impressions
                FROM ctr_stats
    from backend.app.models import Click, SearchQuery

    if not session_id:
        session_id = str(uuid.uuid4())

    query_obj = db.query(SearchQuery).filter(
        SearchQuery.query_text == query,
        SearchQuery.session_id == session_id
    ).first()

    if not query_obj:
        query_obj = SearchQuery(
            user_id=user_id,
            query_text=query,
            session_id=session_id
        )
        db.add(query_obj)
        db.flush()

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

    _ensure_impression(db, query, document_id, user_id, position, session_id)

    db.commit()

    _refresh_ctr_stats(db)


def register_impressions(
    db: Session,
    query: str,
    user_id: int,
    document_ids: List[str],
    session_id: Optional[str] = None
) -> None:
    if not session_id:
        session_id = str(uuid.uuid4())

    try:
        for position, doc_id in enumerate(document_ids, 1):
            db.execute(
                text("""
                    INSERT INTO impressions (query_text, document_id, user_id, position, session_id)
                    VALUES (:query, :doc_id, :user_id, :position, :session)
                    ON CONFLICT DO NOTHING
    try:
        existing = db.execute(
            text("""
                SELECT 1 FROM impressions
                WHERE query_text = :query AND document_id = :doc_id AND session_id = :session
                    INSERT INTO impressions (query_text, document_id, user_id, position, session_id)
                    VALUES (:query, :doc_id, :user_id, :position, :session)
    try:
        db.execute(text("REFRESH MATERIALIZED VIEW ctr_stats"))
        db.commit()
    except Exception:
        pass
