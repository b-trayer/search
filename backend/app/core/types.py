from typing import TypedDict, List, Optional


class CTRData(TypedDict):
    clicks: int
    impressions: int


class UserProfileDict(TypedDict):
    user_id: int
    username: str
    role: str
    specialization: Optional[str]
    faculty: Optional[str]
    course: Optional[int]
    interests: List[str]


class ScoreBreakdown(TypedDict):
    base_score: float
    log_bm25: float
    f_type: float
    f_topic: float
    f_user: float
    smoothed_ctr: float
    ctr_factor: float
    ctr_boost: float
    final_score: float
    clicks: int
    impressions: int


class SearchFilters(TypedDict, total=False):
    коллекция: str
    язык: str
