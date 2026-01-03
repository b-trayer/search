
import logging
from typing import Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException
from opensearchpy.exceptions import ConnectionError as OpenSearchConnectionError
from opensearchpy.exceptions import NotFoundError as OpenSearchNotFoundError
from pydantic import BaseModel, ValidationError
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_async_db
from backend.app.services.async_search_engine import AsyncSearchEngine
from backend.app.services.async_filter_service import AsyncFilterService
from backend.app.services.async_ctr import get_total_stats
from backend.app.core.exceptions import (
    UserNotFoundError,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/search", tags=["search"])


class SearchRequest(BaseModel):
    query: str
    user_id: Optional[int] = None
    top_k: int = 10
    enable_personalization: bool = True
    filters: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None


class ClickEvent(BaseModel):
    query: str
    user_id: int
    document_id: str
    position: int
    session_id: Optional[str] = None
    dwell_time: Optional[int] = None


class ImpressionsEvent(BaseModel):
    query: str
    user_id: int
    document_ids: list[str]
    session_id: Optional[str] = None


@router.post("/")
async def search_documents(
    request: SearchRequest,
    db: AsyncSession = Depends(get_async_db)
):
    if not request.query or not request.query.strip():
        raise HTTPException(
            status_code=400,
            detail={"code": "EMPTY_QUERY", "message": "Search query cannot be empty"}
        )

    engine = AsyncSearchEngine(db)
    try:
        results = await engine.search(
            query=request.query,
            user_id=request.user_id,
            top_k=request.top_k,
            enable_personalization=request.enable_personalization,
            filters=request.filters
        )
        return results

    except OpenSearchConnectionError:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "OPENSEARCH_UNAVAILABLE",
                "message": "Search service is temporarily unavailable"
            }
        )

    except OpenSearchNotFoundError as e:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "INDEX_NOT_FOUND",
                "message": f"Search index not found: {str(e)}"
            }
        )

    except UserNotFoundError as e:
        raise HTTPException(
            status_code=404,
            detail={"code": e.code, "message": e.message}
        )

    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "DATABASE_ERROR",
                "message": "Database temporarily unavailable"
            }
        )

    except ValidationError as e:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "VALIDATION_ERROR",
                "message": str(e)
            }
        )

    except Exception as e:
        logger.error(f"Unexpected search error: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred"
            }
        )

    finally:
        await engine.close()


@router.post("/click")
async def register_click(
    click: ClickEvent,
    db: AsyncSession = Depends(get_async_db)
):
    engine = AsyncSearchEngine(db)
    try:
        await engine.register_click(
            query=click.query,
            user_id=click.user_id,
            document_id=click.document_id,
            position=click.position,
            session_id=click.session_id,
            dwell_time=click.dwell_time
        )
        return {"status": "ok"}

    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "DATABASE_ERROR",
                "message": "Failed to register click"
            }
        )

    except Exception as e:
        logger.error(f"Click registration error: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Failed to register click"
            }
        )

    finally:
        await engine.close()


@router.post("/impressions")
async def register_impressions(
    event: ImpressionsEvent,
    db: AsyncSession = Depends(get_async_db)
):
    engine = AsyncSearchEngine(db)
    try:
        await engine.register_impressions(
            query=event.query,
            user_id=event.user_id,
            document_ids=event.document_ids,
            session_id=event.session_id
        )
        stats = await get_total_stats(db)
        return {"status": "ok", "total_impressions": stats["total_impressions"]}

    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "DATABASE_ERROR",
                "message": "Failed to register impressions"
            }
        )

    except Exception as e:
        logger.error(f"Impressions registration error: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Failed to register impressions"
            }
        )

    finally:
        await engine.close()


@router.get("/filters")
async def get_filters(db: AsyncSession = Depends(get_async_db)):
    try:
        filter_service = AsyncFilterService(db)
        return await filter_service.get_filter_options()

    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "DATABASE_ERROR",
                "message": "Failed to load filters"
            }
        )

    except Exception as e:
        logger.error(f"Filters error: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Failed to load filters"
            }
        )


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_async_db)):
    try:
        stats = await get_total_stats(db)
        return stats

    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "DATABASE_ERROR",
                "message": "Failed to load stats"
            }
        )

    except Exception as e:
        logger.error(f"Stats error: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Failed to load stats"
            }
        )
