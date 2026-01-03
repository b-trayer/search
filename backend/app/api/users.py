from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.database import get_db
from backend.app.models import User, Click
from backend.app.schemas.user import UserResponse, UserStatsResponse

router = APIRouter(prefix="/api/users", tags=["users"])

MAX_LIMIT = 100
DEFAULT_LIMIT = 50


@router.get("/", response_model=List[UserResponse])
async def get_users(
    role: Optional[str] = None,
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(DEFAULT_LIMIT, ge=1, le=MAX_LIMIT, description="Max records to return"),
    db: Session = Depends(get_db)
):
    query = db.query(User)

    if role:
        query = query.filter(User.role == role)

    users = query.offset(offset).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.get("/{user_id}/stats", response_model=UserStatsResponse)
async def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    clicks_count = db.query(Click).filter(Click.user_id == user_id).count()

    return UserStatsResponse(
        user_id=user.user_id,
        username=user.username,
        total_clicks=clicks_count,
        role=user.role,
        specialization=user.specialization
    )
