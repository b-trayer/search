
from pydantic import BaseModel, ConfigDict, Field, EmailStr
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    username: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    role: str = Field(..., description="User role: student, master, phd, professor")
    specialization: Optional[str] = Field(None, max_length=100)
    faculty: Optional[str] = Field(None, max_length=200)
    course: Optional[int] = Field(None, ge=1, le=6)
    interests: Optional[List[str]] = None


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    user_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserStatsResponse(BaseModel):
    user_id: int
    username: str
    total_clicks: int
    role: str
    specialization: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
