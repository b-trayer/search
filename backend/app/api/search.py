from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from backend.app.database import get_db
from backend.app.services.search_engine import SearchEngine

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

@router.post("/")
async def search_documents(
    request: SearchRequest,
    db: Session = Depends(get_db)
):
    """Основной поиск"""
    try:
        engine = SearchEngine(db)
        results = engine.search(
            query=request.query,
            user_id=request.user_id,
            top_k=request.top_k,
            enable_personalization=request.enable_personalization,
            filters=request.filters
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/click")
async def register_click(
    click: ClickEvent,
    db: Session = Depends(get_db)
):
    """Регистрация клика"""
    try:
        engine = SearchEngine(db)
        engine.register_click(
            query=click.query,
            user_id=click.user_id,
            document_id=click.document_id,
            position=click.position,
            session_id=click.session_id,
            dwell_time=click.dwell_time
        )
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/filters")
async def get_filters(db: Session = Depends(get_db)):
    """Получить доступные фильтры"""
    try:
        from backend.app.models import Document
        
        # Типы документов
        doc_types = db.query(Document.document_type).distinct().all()
        doc_types = [t[0] for t in doc_types]
        
        # Предметы
        subjects = db.query(Document.subject).distinct().all()
        subjects = [s[0] for s in subjects if s[0]]
        
        # Годы
        years = db.query(Document.year).distinct().order_by(Document.year).all()
        years = [y[0] for y in years if y[0]]
        
        return {
            "document_types": doc_types,
            "subjects": subjects,
            "year_range": {"min": min(years) if years else None, "max": max(years) if years else None}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
