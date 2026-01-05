
import math
from typing import Dict, Optional, Tuple

from backend.app.services.settings import settings_service
from backend.app.core.types import UserProfileDict, ScoreBreakdown
from .personalization import calculate_f_type_for_doc, calculate_f_topic_for_doc


def bayesian_smoothed_ctr(clicks: int, impressions: int, weights=None) -> float:
    if weights is None:
        weights = settings_service.get_weights()
    alpha = weights.ctr_alpha_prior
    beta = weights.ctr_beta_prior
    return (clicks + alpha) / (impressions + alpha + beta)


def calculate_scores(
    bm25_score: float,
    doc: Dict,
    document_id: str,
    ctr_data: Dict[str, Tuple[int, int]],
    user_profile: Optional[UserProfileDict],
    enable_personalization: bool,
    weights
) -> ScoreBreakdown:
    log_bm25 = math.log(1 + bm25_score)

    f_user = 0.0
    f_type_score = 0.0
    f_topic_score = 0.0

    if enable_personalization and user_profile:
        f_type_score = calculate_f_type_for_doc(doc, user_profile)
        f_topic_score = calculate_f_topic_for_doc(doc, user_profile)
        f_user = weights.alpha_type * f_type_score + weights.alpha_topic * f_topic_score

    ctr_factor = 0.0
    smoothed_ctr = 0.0
    doc_clicks = 0
    doc_impressions = 0

    if document_id in ctr_data:
        doc_clicks, doc_impressions = ctr_data[document_id]
        smoothed_ctr = bayesian_smoothed_ctr(doc_clicks, doc_impressions, weights)
        if smoothed_ctr > 0:
            ctr_factor = math.log(1 + smoothed_ctr * 10)

    user_contrib = weights.w_user * f_user
    ctr_contrib = weights.beta_ctr * ctr_factor

    log_bm25_r = round(log_bm25, 3)
    user_contrib_r = round(user_contrib, 3)
    ctr_contrib_r = round(ctr_contrib, 3)
    final_score = log_bm25_r + user_contrib_r + ctr_contrib_r

    return {
        "base_score": round(bm25_score, 3),
        "log_bm25": log_bm25_r,
        "f_type": round(f_type_score, 3),
        "f_topic": round(f_topic_score, 3),
        "f_user": round(f_user, 3),
        "user_contrib": user_contrib_r,
        "smoothed_ctr": round(smoothed_ctr, 4),
        "ctr_factor": round(ctr_factor, 3),
        "ctr_contrib": ctr_contrib_r,
        "ctr_boost": round(1 + ctr_factor, 3),
        "final_score": round(final_score, 3),
        "clicks": doc_clicks,
        "impressions": doc_impressions,
        "weights": {
            "w_user": weights.w_user,
            "alpha_type": weights.alpha_type,
            "alpha_topic": weights.alpha_topic,
            "beta_ctr": weights.beta_ctr,
            "ctr_alpha_prior": weights.ctr_alpha_prior,
            "ctr_beta_prior": weights.ctr_beta_prior,
        },
    }
