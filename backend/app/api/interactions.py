from fastapi import APIRouter, Depends
from opensearchpy import AsyncOpenSearch
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database import get_async_db, get_opensearch_client
from backend.app.services.async_search_engine import AsyncSearchEngine
from backend.app.services.ctr import get_total_stats
from backend.app.schemas.search import ClickEvent, ImpressionsEvent
from backend.app.api.error_handlers import handle_search_errors

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


@router.get("/stats")
@handle_search_errors
async def get_stats(db: AsyncSession = Depends(get_async_db)):
    return await get_total_stats(db)
