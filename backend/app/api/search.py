
from fastapi import APIRouter, Depends, HTTPException, Request
from opensearchpy import AsyncOpenSearch
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_async_db, get_opensearch_client
from backend.app.services.async_search_engine import AsyncSearchEngine
from backend.app.core.rate_limit import limiter
from backend.app.schemas.search import SearchRequest
from backend.app.api.error_handlers import handle_search_errors

router = APIRouter(prefix="/api/v1/search", tags=["search"])


@router.post("/")
@limiter.limit("30/minute")
@handle_search_errors
async def search_documents(
    request: Request,
    search_request: SearchRequest,
    db: AsyncSession = Depends(get_async_db),
    opensearch: AsyncOpenSearch = Depends(get_opensearch_client)
):
    if not search_request.query or not search_request.query.strip():
        raise HTTPException(
            status_code=400,
            detail={"code": "EMPTY_QUERY", "message": "Search query cannot be empty"}
        )

    engine = AsyncSearchEngine(db, opensearch)
    return await engine.search(
        query=search_request.query,
        user_id=search_request.user_id,
        page=search_request.page,
        per_page=search_request.per_page,
        enable_personalization=search_request.enable_personalization,
        filters=search_request.filters
    )
