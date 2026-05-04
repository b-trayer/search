from typing import TypedDict, List, Optional


class UserProfileDict(TypedDict):
    user_id: int
    username: str
    role: str
    specialization: Optional[str]
    faculty: Optional[str]
    course: Optional[int]
    interests: List[str]


class RankingWeightsDict(TypedDict):
    w_user: float
    alpha_type: float
    alpha_topic: float
    beta_ctr: float
    ctr_alpha_prior: float
    ctr_beta_prior: float


class ScoreBreakdown(TypedDict):
    base_score: float
    log_bm25: float
    f_type: float
    f_topic: float
    f_user: float
    user_contrib: float
    smoothed_ctr: float
    ctr_factor: float
    ctr_contrib: float
    ctr_boost: float
    final_score: float
    clicks: int
    impressions: int
    weights: RankingWeightsDict
