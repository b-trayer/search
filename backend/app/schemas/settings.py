
from pydantic import BaseModel, Field
from enum import Enum


class RankingWeights(BaseModel):

    w_user: float = Field(1.5, ge=0, le=5, description="Вес персонализации wᵤ")
    alpha_type: float = Field(0.4, ge=0, le=1, description="Вес типа документа α₁")
    alpha_topic: float = Field(0.6, ge=0, le=1, description="Вес темы α₂")
    beta_ctr: float = Field(0.5, ge=0, le=3, description="Вес CTR β")

    ctr_alpha_prior: float = Field(1.0, ge=0, le=10, description="Псевдо-клики")
    ctr_beta_prior: float = Field(10.0, ge=1, le=100, description="Псевдо-показы")


class WeightPreset(str, Enum):
    DEFAULT = "default"
    HIGH_PERSONALIZATION = "high_personalization"
    HIGH_CTR = "high_ctr"
    BM25_ONLY = "bm25_only"


WEIGHT_PRESETS: dict[WeightPreset, RankingWeights] = {
    WeightPreset.DEFAULT: RankingWeights(),
    WeightPreset.HIGH_PERSONALIZATION: RankingWeights(w_user=3.0, beta_ctr=0.3),
    WeightPreset.HIGH_CTR: RankingWeights(w_user=0.5, beta_ctr=2.0),
    WeightPreset.BM25_ONLY: RankingWeights(w_user=0.0, beta_ctr=0.0),
}
