from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api import search, users

app = FastAPI(
    title="Library Search API",
    description="Персонализированная поисковая система для библиотеки",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключить роутеры
app.include_router(search.router)
app.include_router(users.router)

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
