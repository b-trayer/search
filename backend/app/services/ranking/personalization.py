
from typing import Dict

from backend.app.core.preferences import (
    calculate_f_type,
    calculate_f_topic,
    infer_document_type,
)
from .document_helpers import get_field, join_list_field, get_title


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
