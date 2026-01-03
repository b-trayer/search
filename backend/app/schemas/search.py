
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Search query")
    user_id: Optional[int] = Field(None, description="User ID for personalization")
    enable_personalization: bool = Field(True, description="Enable personalized ranking")
    top_k: int = Field(10, ge=1, le=100, description="Number of results to return")
    filters: Optional[Dict[str, str]] = Field(None, description="Optional filters")


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
    results: List[SearchResult]
    personalized: bool = False
    user_profile: Optional[UserProfile] = None
