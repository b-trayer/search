from typing import TypedDict, List, Optional, Union


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


class DocumentSource(TypedDict, total=False):
    document_id: str
    source: str
    title: Union[str, List[str]]
    authors: Union[str, List[str]]
    year: Optional[int]
    document_type: str
    subjects: Union[str, List[str]]
    language: str
    card_url: str
    collection: str
    organization: str
    publication_info: str
    read_url: str
    cover_url: str
    cover: str
    knowledge_area: str


class OpenSearchHit(TypedDict):
    _id: str
    _score: float
    _source: DocumentSource
    highlight: dict


class SearchFilters(TypedDict, total=False):
    document_type: str
    language: str
    collection: str
    year_from: int
    year_to: int
    source: str
