import logging

from fastapi import APIRouter, Body, Depends
from opensearchpy import AsyncOpenSearch, OpenSearchException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, Dict, Optional
from backend.app.config import settings
from backend.app.database import get_async_db, get_opensearch_client
from backend.app.services.async_search_engine import AsyncSearchEngine
from backend.app.services.ctr import get_total_stats
from backend.app.schemas.search import ClickEvent, ImpressionsEvent, FilterOptionsRequest
from backend.app.api.error_handlers import handle_search_errors

logger = logging.getLogger(__name__)


async def _get_total_documents(opensearch: AsyncOpenSearch) -> int:
    try:
        response = await opensearch.count(index=settings.opensearch_index)
        return int(response.get("count", 0))
    except OpenSearchException as exc:
        logger.warning("Failed to fetch document count from OpenSearch: %s", exc)
        return 0

router = APIRouter(prefix="/api/v1/search", tags=["search"])


@router.post("/click")
@handle_search_errors
async def register_click(click: ClickEvent, db: AsyncSession = Depends(get_async_db), opensearch: AsyncOpenSearch = Depends(get_opensearch_client)):
    await AsyncSearchEngine(db, opensearch).register_click(click.query, click.user_id, click.document_id, click.position, click.session_id, click.dwell_time)
    return {"status": "ok"}


@router.post("/impressions")
@handle_search_errors
async def register_impressions(event: ImpressionsEvent, db: AsyncSession = Depends(get_async_db), opensearch: AsyncOpenSearch = Depends(get_opensearch_client)):
    await AsyncSearchEngine(db, opensearch).register_impressions(event.query, event.user_id, event.document_ids, event.session_id)
    return {"status": "ok", "total_impressions": (await get_total_stats(db))["total_impressions"]}


@router.get("/filters")
@handle_search_errors
async def get_filters(db: AsyncSession = Depends(get_async_db), opensearch: AsyncOpenSearch = Depends(get_opensearch_client)):
    return await AsyncSearchEngine(db, opensearch).get_filter_options()


@router.post("/filters")
@handle_search_errors
async def get_filters_contextual(
    payload: FilterOptionsRequest = Body(default_factory=FilterOptionsRequest),
    db: AsyncSession = Depends(get_async_db),
    opensearch: AsyncOpenSearch = Depends(get_opensearch_client),
):
    return await AsyncSearchEngine(db, opensearch).get_filter_options(
        query=payload.query,
        filters=payload.filters,
        search_field=payload.search_field,
    )


@router.get("/stats")
@handle_search_errors
async def get_stats(
    db: AsyncSession = Depends(get_async_db),
    opensearch: AsyncOpenSearch = Depends(get_opensearch_client),
):
    stats = await get_total_stats(db)
    stats["total_documents"] = await _get_total_documents(opensearch)
    return stats
