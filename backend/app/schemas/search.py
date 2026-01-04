
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500, description="Search query")
    user_id: Optional[int] = Field(None, description="User ID for personalization")
    enable_personalization: bool = Field(True, description="Enable personalized ranking")
    page: int = Field(1, ge=1, le=2500, description="Page number")
    per_page: int = Field(20, ge=1, le=100, description="Results per page")
    filters: Optional[Dict[str, Any]] = Field(None, description="Optional filters")
    session_id: Optional[str] = Field(None, description="Session ID for tracking")


class ClickEvent(BaseModel):
    query: str = Field(..., min_length=1, max_length=500, description="Search query")
    user_id: Optional[int] = Field(None, description="User ID (optional for anonymous)")
    document_id: str = Field(..., description="Clicked document ID")
    position: int = Field(..., ge=1, description="Position in results")
    session_id: Optional[str] = Field(None, description="Session ID")
    dwell_time: Optional[int] = Field(None, ge=0, description="Time spent on document in ms")


class ImpressionsEvent(BaseModel):
    query: str = Field(..., min_length=1, max_length=500, description="Search query")
    user_id: Optional[int] = Field(None, description="User ID (optional for anonymous)")
    document_ids: List[str] = Field(..., description="List of shown document IDs")
    session_id: Optional[str] = Field(None, description="Session ID")


class SearchResult(BaseModel):
    document_id: str
    title: str
    authors: str = ""
    url: str = ""
    cover: str = ""
    collection: str = ""
    subject_area: str = ""
    organization: str = ""
    publication_info: str = ""
    language: str = ""
    source: str = ""

    base_score: float = Field(..., description="Raw BM25 score")
    log_bm25: float = Field(..., description="log(1 + BM25)")
    f_type: float = Field(0.0, description="Document type preference score")
    f_topic: float = Field(0.0, description="Topic match score")
    f_user: float = Field(0.0, description="Combined user factor")
    smoothed_ctr: float = Field(0.0, description="Bayesian smoothed CTR")
    ctr_factor: float = Field(0.0, description="CTR contribution to score")
    ctr_boost: float = Field(1.0, description="CTR boost multiplier")
    final_score: float = Field(..., description="Final ranking score")
    position: int = Field(..., description="Result position")
    highlights: Dict[str, List[str]] = Field(default_factory=dict)


class UserProfile(BaseModel):
    user_id: int
    username: str
    role: str
    specialization: Optional[str] = None


class SearchResponse(BaseModel):
    query: str
    total: int
    page: int = 1
    per_page: int = 20
    total_pages: int = 1
    results: List[SearchResult]
    personalized: bool = False
    user_profile: Optional[UserProfile] = None
