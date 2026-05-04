
import logging
from typing import Dict, List, Tuple

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, OperationalError
from sqlalchemy.ext.asyncio import AsyncSession

from .ctr_exceptions import CTRServiceError, DatabaseConnectionError, CTRDataError

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
    except OperationalError as e:
        logger.error(f"Database connection error while fetching CTR data for query '{query}': {e}")
        raise DatabaseConnectionError(f"Failed to connect to database: {e}") from e
    except IntegrityError as e:
        logger.error(f"Data integrity error for query '{query}': {e}")
        raise CTRDataError(f"Data integrity violation: {e}") from e
    except SQLAlchemyError as e:
        logger.error(f"Database error while fetching CTR data for query '{query}': {e}")
        raise CTRDataError(f"Failed to fetch CTR data: {e}") from e
    except ValueError as e:
        logger.error(f"Invalid CTR data format for query '{query}': {e}")
        raise CTRDataError(f"Invalid CTR data format: {e}") from e

    return ctr_data


async def get_aggregated_ctr_data(
    db: AsyncSession, document_ids: List[str]
) -> Dict[str, Tuple[int, int]]:
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
        logger.error(f"Database error while fetching aggregated CTR data: {e}")
        raise CTRDataError(f"Failed to fetch aggregated CTR data: {e}") from e

    return ctr_data


async def get_total_stats(db: AsyncSession) -> Dict[str, int]:
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
        raise CTRDataError(f"Failed to get total stats: {e}") from e
