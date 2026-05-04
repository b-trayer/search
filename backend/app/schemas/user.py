
from pydantic import BaseModel, ConfigDict, Field, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime


MAX_INTERESTS = 20
MAX_INTEREST_LENGTH = 50


class UserBase(BaseModel):
    username: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    role: str = Field(..., description="User role: bachelor, master, phd, professor")
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


class UserInterestsUpdate(BaseModel):
    """Запрос на полное переопределение списка интересов пользователя."""

    interests: List[str] = Field(
        ...,
        max_length=MAX_INTERESTS,
        description=f"Полный список интересов (max {MAX_INTERESTS}).",
    )

    @field_validator("interests")
    @classmethod
    def normalize_interests(cls, value: List[str]) -> List[str]:
        normalized: List[str] = []
        seen = set()
        for raw in value:
            if not isinstance(raw, str):
                raise ValueError("interest must be a string")
            stripped = raw.strip()
            if not stripped:
                continue
            if len(stripped) > MAX_INTEREST_LENGTH:
                raise ValueError(
                    f"interest length must be <= {MAX_INTEREST_LENGTH} characters"
                )
            key = stripped.lower()
            if key in seen:
                continue
            seen.add(key)
            normalized.append(stripped)
        return normalized
