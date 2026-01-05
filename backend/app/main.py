from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from backend.app.api import search, interactions, users, settings
from backend.app.config import settings as app_settings
from backend.app.core.logging import setup_logging, get_logger
from backend.app.core.middleware import RequestIDMiddleware, RequestLoggingMiddleware
from backend.app.core.rate_limit import limiter, rate_limit_exceeded_handler
from backend.app.database import OpenSearchClientManager

setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up...")
    yield
    logger.info("Shutting down...")
    await OpenSearchClientManager.close_client()


app = FastAPI(
    title="NSU Library Search API",
    description="Персонализированная поисковая система для библиотеки НГУ",
    version="0.1.0",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=app_settings.cors_origins_list,
    allow_credentials=app_settings.cors_allow_credentials,
    allow_methods=app_settings.cors_allow_methods,
    allow_headers=app_settings.cors_allow_headers,
)

app.include_router(search.router)
app.include_router(interactions.router)
app.include_router(users.router)
app.include_router(settings.router)

logger.info("NSU Library Search API started")

@app.get("/")
async def root():
    return {
        "message": "Library Search API",
        "version": "0.1.0",
        "status": "operational",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
