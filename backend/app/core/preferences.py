
from typing import List
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


SPECIALIZATION_TOPICS: dict[str, List[str]] = {
    "Математика": [
        "математик", "алгебр", "анализ", "геометр", "топологи",
        "дифференциальн", "интеграл", "теория чисел",
    ],
    "Физика": [
        "физик", "механик", "оптик", "квант", "термодинам",
        "электродинам", "ядерн", "теоретическ",
    ],
    "Информатика": [
        "информатик", "программир", "алгоритм", "данных",
        "машинн", "нейрон", "искусственн интеллект", "компьютер",
    ],
    "Химия": [
        "хими", "органич", "неорганич", "аналитич", "биохим",
    ],
    "Биология": [
        "биолог", "генетик", "экологи", "эволюц", "молекуляр",
    ],
    "Экономика": [
        "экономик", "финанс", "менеджмент", "маркетинг", "бухгалтер",
    ],
    "История": [
        "истори", "археолог", "древн", "средневеков", "источник",
    ],
    "Филология": [
        "филолог", "лингвист", "литератур", "языкозн", "фонетик",
    ],
    "Право": [
        "право", "юридич", "законодат", "граждан", "судебн",
    ],
    "Философия": [
        "философ", "этик", "логик", "метафизик", "эпистемолог",
    ],
    "Геология": [
        "геолог", "минерал", "петрограф", "тектоник", "палеонтолог",
    ],
    "Востоковедение и африканистика": [
        "восток", "азия", "африк", "арабск", "китайск", "японск",
    ],
}


def calculate_f_type(doc_type: str, user_role: str) -> float:
    return preferences_service.get_f_type(doc_type, user_role)


def infer_document_type(collection: str) -> str:
    collection_lower = collection.lower()

    for keyword, doc_type in COLLECTION_TYPE_MAPPING.items():
        if keyword in collection_lower:
            return doc_type

    return "other"


def calculate_f_topic(
    doc_subjects: List[str],
    user_specialization: str,
    user_interests: List[str] = None
) -> float:
    if user_interests is None:
        user_interests = []

    doc_text = ' '.join(doc_subjects).lower()

    if user_specialization and user_specialization.lower() in doc_text:
        return preferences_service.get_topic_score("direct_match")

    keywords = SPECIALIZATION_TOPICS.get(user_specialization, [])
    for kw in keywords:
        if kw in doc_text:
            return preferences_service.get_topic_score("keyword_match")

    for interest in user_interests:
        if interest.lower() in doc_text:
            return preferences_service.get_topic_score("interest_match")

    return 0.0
