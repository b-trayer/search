from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.database import get_db
from backend.app.models import User, Click

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/")
async def get_users(
    role: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Получить список пользователей"""
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
    
    users = query.limit(limit).all()
    
    return [{
        "user_id": u.user_id,
        "username": u.username,
        "email": u.email,
        "role": u.role,
        "specialization": u.specialization,
        "course": u.course,
        "interests": u.interests
    } for u in users]

@router.get("/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Получить профиль пользователя"""
    user = db.query(User).filter(User.user_id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "user_id": user.user_id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "specialization": user.specialization,
        "course": user.course,
        "interests": user.interests
    }

@router.get("/{user_id}/stats")
async def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    """Получить статистику пользователя"""
    user = db.query(User).filter(User.user_id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Количество кликов
    clicks_count = db.query(Click).filter(Click.user_id == user_id).count()
    
    return {
        "user_id": user_id,
        "username": user.username,
        "total_clicks": clicks_count,
        "role": user.role,
        "specialization": user.specialization
    }
