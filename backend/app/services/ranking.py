
import math
from typing import Dict, Optional, List, Tuple
from backend.app.services.settings import settings_service
from backend.app.core.preferences import (
    calculate_f_type,
    calculate_f_topic,
    infer_document_type,
)
from backend.app.core.types import UserProfileDict, ScoreBreakdown


def get_field(doc: Dict, *field_names: str, default: str = '') -> str:
    for name in field_names:
        value = doc.get(name)
        if value:
            return value if isinstance(value, str) else str(value)
    return default


def get_list_field(doc: Dict, field_name: str) -> List[str]:
    value = doc.get(field_name, [])
    if isinstance(value, list):
        return value
    return [str(value)] if value else []


def join_list_field(doc: Dict, field_name: str) -> str:
    items = get_list_field(doc, field_name)
    return ', '.join(items)


def fix_catalog_url(url: str) -> str:
    if not url:
        return ''
    url = url.replace('\\\\', '%5C').replace('\\', '%5C')
    if 'ruslan-neo.nsu.ru/pwb/action/rec?id=' in url:
        url = url.replace('/pwb/action/rec?id=', '/pwb/detail?db=BOOKS&id=')
    if 'e-lib.nsu.ru' in url and url.endswith('/view'):
        url = url[:-5] + '/info'
    return url


def get_title(doc: Dict) -> str:
    title = doc.get('title', '')
    if isinstance(title, list):
        return title[0] if title else 'Без названия'
    return str(title) if title else 'Без названия'


def calculate_f_type_for_doc(doc: Dict, user_profile: Dict) -> float:
    role = user_profile.get("role", "")
    if not role:
        return 0.0

    collection = get_field(doc, 'collection', 'коллекция')
    doc_type = doc.get('document_type') or infer_document_type(collection)

    return calculate_f_type(doc_type, role)


def calculate_f_topic_for_doc(doc: Dict, user_profile: Dict) -> float:
    specialization = user_profile.get("specialization", "")
    interests = user_profile.get("interests", [])

    doc_subjects = [
        join_list_field(doc, 'subjects'),
        get_field(doc, 'knowledge_area'),
        get_field(doc, 'collection', 'коллекция'),
        get_title(doc),
    ]

    return calculate_f_topic(doc_subjects, specialization, interests)


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


def build_result_dict(hit: Dict, scores: Dict, position: int) -> Dict:
    doc = hit['_source']

    return {
        "document_id": doc.get('document_id', ''),
        "title": get_title(doc),
        "authors": join_list_field(doc, 'authors'),
        "url": fix_catalog_url(
            get_field(doc, 'read_url', 'card_url', 'url')
        ),
        "cover": get_field(doc, 'cover_url', 'cover'),
        "collection": get_field(doc, 'collection', 'коллекция'),
        "subject_area": join_list_field(doc, 'subjects') or get_field(doc, 'knowledge_area'),
        "subjects": get_list_field(doc, 'subjects'),
        "organization": get_field(doc, 'organization', 'организация'),
        "publication_info": get_field(doc, 'publication_info', 'выходные_сведения'),
        "language": get_field(doc, 'language', 'язык'),
        "source": get_field(doc, 'source'),
        "year": doc.get('year'),
        "document_type": get_field(doc, 'document_type'),
        "highlights": hit.get('highlight', {}),
        "position": position,
        **scores,
    }


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

        scores = calculate_scores(
            bm25_score, doc, document_id, ctr_data,
            user_profile, enable_personalization, weights
        )

        result = build_result_dict(hit, scores, i + 1)
        results.append(result)

    results.sort(key=lambda x: x['final_score'], reverse=True)

    for i, result in enumerate(results):
        result['position'] = i + 1

    return results
