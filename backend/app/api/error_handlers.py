
import logging
from functools import wraps
from typing import Callable

from fastapi import HTTPException
from opensearchpy.exceptions import ConnectionError as OpenSearchConnectionError
from opensearchpy.exceptions import NotFoundError as OpenSearchNotFoundError
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError

from backend.app.core.exceptions import UserNotFoundError

logger = logging.getLogger(__name__)


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
