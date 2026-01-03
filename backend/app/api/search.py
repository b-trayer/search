
import logging
from functools import wraps
from typing import Callable, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from opensearchpy.exceptions import ConnectionError as OpenSearchConnectionError
from opensearchpy.exceptions import NotFoundError as OpenSearchNotFoundError
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_async_db
from backend.app.services.async_search_engine import AsyncSearchEngine
from backend.app.services.async_filter_service import AsyncFilterService
from backend.app.services.async_ctr import get_total_stats
from backend.app.core.exceptions import UserNotFoundError
from backend.app.core.rate_limit import limiter
from backend.app.schemas.search import SearchRequest, ClickEvent, ImpressionsEvent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/search", tags=["search"])


def handle_search_errors(func: Callable):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except OpenSearchConnectionError:
            raise HTTPException(
                status_code=503,
                detail={"code": "OPENSEARCH_UNAVAILABLE", "message": "Search service is temporarily unavailable"}
            )
        except OpenSearchNotFoundError as e:
            raise HTTPException(
                status_code=404,
                detail={"code": "INDEX_NOT_FOUND", "message": f"Search index not found: {str(e)}"}
            )
        except UserNotFoundError as e:
            raise HTTPException(
                status_code=404,
                detail={"code": e.code, "message": e.message}
            )
        except SQLAlchemyError:
            raise HTTPException(
                status_code=503,
                detail={"code": "DATABASE_ERROR", "message": "Database temporarily unavailable"}
            )
        except ValidationError as e:
            raise HTTPException(
                status_code=422,
                detail={"code": "VALIDATION_ERROR", "message": str(e)}
            )
        except Exception as e:
            logger.error(f"Unexpected error in {func.__name__}: {type(e).__name__}: {e}")
            raise HTTPException(
                status_code=500,
                detail={"code": "INTERNAL_ERROR", "message": "An unexpected error occurred"}
            )
    return wrapper


@router.post("/")
@limiter.limit("30/minute")
@handle_search_errors
async def search_documents(
    request: SearchRequest,
    req: Request,
    db: AsyncSession = Depends(get_async_db)
):
    if not request.query or not request.query.strip():
        raise HTTPException(
            status_code=400,
            detail={"code": "EMPTY_QUERY", "message": "Search query cannot be empty"}
        )

    engine = AsyncSearchEngine(db)
    return await engine.search(
        query=request.query,
        user_id=request.user_id,
        top_k=request.top_k,
        enable_personalization=request.enable_personalization,
        filters=request.filters
    )


@router.post("/click")
@handle_search_errors
async def register_click(
    click: ClickEvent,
    db: AsyncSession = Depends(get_async_db)
):
    engine = AsyncSearchEngine(db)
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
    db: AsyncSession = Depends(get_async_db)
):
    engine = AsyncSearchEngine(db)
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
async def get_filters(db: AsyncSession = Depends(get_async_db)):
    filter_service = AsyncFilterService(db)
    return await filter_service.get_filter_options()


@router.get("/stats")
@handle_search_errors
async def get_stats(db: AsyncSession = Depends(get_async_db)):
    return await get_total_stats(db)
