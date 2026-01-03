
import math
from typing import Dict, Optional, List
from backend.app.services.settings import settings_service
from backend.app.core.preferences import (
    calculate_f_type,
    calculate_f_topic,
    infer_document_type,
)


def fix_catalog_url(url: str) -> str:
    if not url:
        return ''
    url = url.replace('\\\\', '%5C').replace('\\', '%5C')
    if 'ruslan-neo.nsu.ru/pwb/action/rec?id=' in url:
        url = url.replace('/pwb/action/rec?id=', '/pwb/detail?db=BOOKS&id=')
    return url


def get_authors_str(doc: Dict) -> str:
    authors = doc.get('authors', [])
    if isinstance(authors, list):
        return ', '.join(authors)
    return str(authors) if authors else ''


def get_subjects_str(doc: Dict) -> str:
    subjects = doc.get('subjects', [])
    if isinstance(subjects, list):
        return ', '.join(subjects)
    return str(subjects) if subjects else ''


def calculate_f_type_for_doc(doc: Dict, user_profile: Dict) -> float:
    role = user_profile.get("role", "")
    if not role:
        return 0.0

    collection = doc.get('collection', '') or doc.get('коллекция', '') or ''
    doc_type_field = doc.get('document_type', '')
    doc_type = doc_type_field if doc_type_field else infer_document_type(collection)

    return calculate_f_type(doc_type, role)


def get_title_str(doc: Dict) -> str:
    title = doc.get('title', '')
    if isinstance(title, list):
        return title[0] if title else ''
    return str(title) if title else ''


def calculate_f_topic_for_doc(doc: Dict, user_profile: Dict) -> float:
    specialization = user_profile.get("specialization", "")
    interests = user_profile.get("interests", [])

    doc_subjects = [
        get_subjects_str(doc),
        doc.get('knowledge_area', '') or '',
        doc.get('collection', '') or doc.get('коллекция', '') or '',
        get_title_str(doc),
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

        doc_clicks = 0
        doc_impressions = 0
        if document_id in ctr_data:
            doc_clicks, doc_impressions = ctr_data[document_id]
            smoothed_ctr = bayesian_smoothed_ctr(doc_clicks, doc_impressions, weights)
            if smoothed_ctr > 0:
                ctr_factor = math.log(1 + smoothed_ctr * 10)

        final_score = log_bm25 + weights.w_user * f_user + weights.beta_ctr * ctr_factor

        # Get subjects as list
        subjects_raw = doc.get('subjects', [])
        subjects_list = subjects_raw if isinstance(subjects_raw, list) else []

        result = {
            "document_id": document_id,
            "title": doc.get('title', 'Без названия') if isinstance(doc.get('title'), str) else (doc.get('title', ['Без названия'])[0] if doc.get('title') else 'Без названия'),
            "authors": get_authors_str(doc),
            "url": fix_catalog_url(doc.get('read_url', '') or doc.get('card_url', '') or doc.get('url', '') or ''),
            "cover": doc.get('cover_url', '') or doc.get('cover', ''),
            "collection": doc.get('collection', '') or doc.get('коллекция', ''),
            "subject_area": get_subjects_str(doc) or doc.get('knowledge_area', ''),
            "subjects": subjects_list,
            "organization": doc.get('organization', '') or doc.get('организация', ''),
            "publication_info": doc.get('publication_info', '') or doc.get('выходные_сведения', ''),
            "language": doc.get('language', '') or doc.get('язык', ''),
            "source": doc.get('source', ''),
            "year": doc.get('year'),
            "document_type": doc.get('document_type', ''),

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
            "highlights": hit.get('highlight', {}),
            "clicks": doc_clicks,
            "impressions": doc_impressions,
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
