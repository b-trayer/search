
from typing import Dict, List, Optional

from backend.app.services.settings import settings_service
from .document_helpers import get_field, get_list_field, join_list_field, fix_catalog_url, get_title
from .score_calculator import calculate_scores


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
