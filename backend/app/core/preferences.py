
from typing import List


ROLE_TYPE_MATRIX: dict[str, dict[str, float]] = {
    "student": {
        "textbook": 0.50,
        "tutorial": 0.25,
        "monograph": 0.10,
        "dissertation": 0.05,
        "article": 0.10,
    },
    "master": {
        "textbook": 0.30,
        "tutorial": 0.20,
        "monograph": 0.20,
        "dissertation": 0.15,
        "article": 0.15,
    },
    "phd": {
        "textbook": 0.10,
        "tutorial": 0.05,
        "monograph": 0.25,
        "dissertation": 0.35,
        "article": 0.25,
    },
    "professor": {
        "textbook": 0.10,
        "tutorial": 0.05,
        "monograph": 0.30,
        "dissertation": 0.25,
        "article": 0.30,
    },
}

COLLECTION_TYPE_MAPPING: dict[str, str] = {
    "учебник": "textbook",
    "учебн": "textbook",
    "пособи": "textbook",
    "практик": "tutorial",
    "методич": "tutorial",
    "монограф": "monograph",
    "научн": "monograph",
    "диссертац": "dissertation",
    "авторефер": "dissertation",
    "статьи": "article",
    "журнал": "article",
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
    return ROLE_TYPE_MATRIX.get(user_role, {}).get(doc_type, 0.0)


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
        return 1.0

    keywords = SPECIALIZATION_TOPICS.get(user_specialization, [])
    for kw in keywords:
        if kw in doc_text:
            return 0.8

    for interest in user_interests:
        if interest.lower() in doc_text:
            return 0.6

    return 0.0
