
import math
from typing import Dict, Optional, List
from backend.app.services.settings import settings_service
from backend.app.core.preferences import (
    calculate_f_type,
    calculate_f_topic,
    infer_document_type,
)


def calculate_f_type_for_doc(doc: Dict, user_profile: Dict) -> float:
    role = user_profile.get("role", "")
    if not role:
        return 0.0

    collection = doc.get('коллекция', '') or ''
    doc_type = infer_document_type(collection)

    return calculate_f_type(doc_type, role)


def calculate_f_topic_for_doc(doc: Dict, user_profile: Dict) -> float:
    specialization = user_profile.get("specialization", "")
    interests = user_profile.get("interests", [])

    doc_subjects = [
        doc.get('литература_по_отраслям_знания', '') or '',
        doc.get('коллекция', '') or '',
        doc.get('title', '') or '',
    ]

    return calculate_f_topic(doc_subjects, specialization, interests)


def apply_ranking_formula(
    hits: List[Dict],
    ctr_data: Dict[str, tuple],
    user_profile: Optional[Dict],
    enable_personalization: bool
) -> List[Dict]:
    weights = settings_service.get_weights()
    results = []

    for i, hit in enumerate(hits):
        doc = hit['_source']
        document_id = doc.get('document_id', '')

        bm25_score = hit['_score']
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

        if document_id in ctr_data:
            clicks, impressions = ctr_data[document_id]
            smoothed_ctr = bayesian_smoothed_ctr(clicks, impressions, weights)
            if smoothed_ctr > 0:
                ctr_factor = math.log(1 + smoothed_ctr * 10)

        final_score = log_bm25 + weights.w_user * f_user + weights.beta_ctr * ctr_factor

        result = {
            "document_id": document_id,
            "title": doc.get('title', 'Без названия'),
            "authors": doc.get('авторы', doc.get('другие_авторы', '')),
            "url": doc.get('url', ''),
            "cover": doc.get('cover', ''),
            "collection": doc.get('коллекция', ''),
            "subject_area": doc.get('литература_по_отраслям_знания', ''),
            "organization": doc.get('организация', ''),
            "publication_info": doc.get('выходные_сведения', ''),
            "language": doc.get('язык', ''),
            "source": doc.get('source', ''),

            "base_score": round(bm25_score, 3),
            "log_bm25": round(log_bm25, 3),
            "f_type": round(f_type_score, 3),
            "f_topic": round(f_topic_score, 3),
            "f_user": round(f_user, 3),
            "smoothed_ctr": round(smoothed_ctr, 4),
            "ctr_factor": round(ctr_factor, 3),
            "ctr_boost": round(1 + ctr_factor, 3),
            "final_score": round(final_score, 3),
            "position": i + 1,
            "highlights": hit.get('highlight', {})
        }

        results.append(result)

    results.sort(key=lambda x: x['final_score'], reverse=True)

    for i, result in enumerate(results):
        result['position'] = i + 1

    return results


def bayesian_smoothed_ctr(clicks: int, impressions: int, weights=None) -> float:
    if weights is None:
        weights = settings_service.get_weights()
    alpha = weights.ctr_alpha_prior
    beta = weights.ctr_beta_prior
    return (clicks + alpha) / (impressions + alpha + beta)
