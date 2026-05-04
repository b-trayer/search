
from typing import List, Optional
from backend.app.services.preferences import preferences_service

COLLECTION_TYPE_MAPPING: dict[str, str] = {
    "учебник": "textbook",
    "учебн": "textbook",
    "пособи": "textbook",
    "практик": "tutorial",
    "методич": "tutorial",
    "монограф": "monograph",
    "диссертац": "dissertation",
    "авторефер": "dissertation",
    "статьи": "article",
    "журнал": "article",
    "научн": "monograph",
}

DOC_TYPE_CANONICAL: dict[str, str] = {
    "textbook": "textbook",
    "Учебник": "textbook",
    "manual": "textbook",

    "tutorial": "tutorial",
    "methodical": "tutorial",

    "monograph": "monograph",
    "book": "monograph",
    "collection": "monograph",
    "Другой": "monograph",

    "dissertation": "dissertation",
    "doctoral_dissertation": "dissertation",
    "autoreferat": "dissertation",
    "Диссертация": "dissertation",

    "article": "article",
    "nsu_article": "article",
    "book_article": "article",
    "Статья, доклад": "article",
    "serial": "article",
    "Журнал, газета": "article",
    "proceedings": "article",
}


def calculate_f_type(doc_type: str, user_role: str) -> float:
    return preferences_service.get_f_type(doc_type, user_role)


def infer_document_type(collection: str) -> str:
    collection_lower = collection.lower()

    for keyword, doc_type in COLLECTION_TYPE_MAPPING.items():
        if keyword in collection_lower:
            return doc_type

    return "other"


def canonicalize_document_type(
    doc_type: Optional[str],
    collection: str = "",
) -> str:
    if doc_type:
        canonical = DOC_TYPE_CANONICAL.get(doc_type)
        if canonical is not None:
            return canonical

    if collection:
        inferred = infer_document_type(collection)
        if inferred != "other":
            return inferred

    return "other"


INTEREST_BONUS_PER_MATCH = 0.2
INTEREST_BONUS_CAP = 0.5


def calculate_f_topic(
    doc_subjects: List[str],
    user_specialization: str,
    user_interests: Optional[List[str]] = None
) -> float:
    if user_interests is None:
        user_interests = []

    doc_text = ' '.join(doc_subjects).lower()

    base = 0.0
    if user_specialization and user_specialization.lower() in doc_text:
        base = preferences_service.get_topic_score("direct_match")
    else:
        keywords = preferences_service.get_keywords_for_specialization(user_specialization)
        for kw in keywords:
            if kw in doc_text:
                base = preferences_service.get_topic_score("keyword_match")
                break

    matched_interests = sum(
        1 for interest in user_interests if interest and interest.lower() in doc_text
    )
    bonus = min(INTEREST_BONUS_CAP, INTEREST_BONUS_PER_MATCH * matched_interests)

    return base + bonus
