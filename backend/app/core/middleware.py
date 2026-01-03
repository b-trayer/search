
import time
import uuid
import logging
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from backend.app.core.logging import request_id_var, get_logger

logger = get_logger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get("X-Request-ID")
        if not request_id:
            request_id = str(uuid.uuid4())[:8]

        token = request_id_var.set(request_id)

        try:
            response = await call_next(request)
            response.headers["X-Request-ID"] = request_id
            return response
        finally:
            request_id_var.reset(token)


class RequestLoggingMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.perf_counter()

        method = request.method
        path = request.url.path
        client_ip = request.client.host if request.client else "unknown"
        query_params = str(request.query_params) if request.query_params else ""

        logger.info(
            f"Request: {method} {path}",
            extra={
                "method": method,
                "path": path,
                "client_ip": client_ip,
                "query_params": query_params,
            }
        )

        try:
            response = await call_next(request)

            duration_ms = (time.perf_counter() - start_time) * 1000

            log_level = logging.WARNING if response.status_code >= 400 else logging.INFO
            logger.log(
                log_level,
                f"Response: {response.status_code} ({duration_ms:.2f}ms)",
                extra={
                    "method": method,
                    "path": path,
                    "status_code": response.status_code,
                    "duration_ms": round(duration_ms, 2),
                }
            )

            response.headers["X-Response-Time"] = f"{duration_ms:.2f}ms"

            return response

        except Exception as e:
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                f"Request failed: {type(e).__name__}: {e}",
                extra={
                    "method": method,
                    "path": path,
                    "duration_ms": round(duration_ms, 2),
                    "error_type": type(e).__name__,
                },
                exc_info=True
            )
            raise
