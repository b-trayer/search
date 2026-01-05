
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
async def register_click(
    click: ClickEvent,
    db: AsyncSession = Depends(get_async_db),
    opensearch: AsyncOpenSearch = Depends(get_opensearch_client)
):
    engine = AsyncSearchEngine(db, opensearch)
    await engine.register_click(
        query=click.query,
        user_id=click.user_id,
        document_id=click.document_id,
        position=click.position,
        session_id=click.session_id,
        dwell_time=click.dwell_time
    )
    return {"status": "ok"}


@router.post("/impressions")
@handle_search_errors
async def register_impressions(
    event: ImpressionsEvent,
    db: AsyncSession = Depends(get_async_db),
    opensearch: AsyncOpenSearch = Depends(get_opensearch_client)
):
    engine = AsyncSearchEngine(db, opensearch)
    await engine.register_impressions(
        query=event.query,
        user_id=event.user_id,
        document_ids=event.document_ids,
        session_id=event.session_id
    )
    stats = await get_total_stats(db)
    return {"status": "ok", "total_impressions": stats["total_impressions"]}


@router.get("/filters")
@handle_search_errors
async def get_filters(
    db: AsyncSession = Depends(get_async_db),
    opensearch: AsyncOpenSearch = Depends(get_opensearch_client)
):
    engine = AsyncSearchEngine(db, opensearch)
    return await engine.get_filter_options()


@router.get("/stats")
@handle_search_errors
async def get_stats(db: AsyncSession = Depends(get_async_db)):
    return await get_total_stats(db)
