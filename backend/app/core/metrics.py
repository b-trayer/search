
import math
from typing import List, Dict, Optional


def dcg_at_k(relevances: List[float], k: int) -> float:
    relevances = relevances[:k]
    if not relevances:
        return 0.0

    dcg = 0.0
    for i, rel in enumerate(relevances):
        dcg += (2 ** rel - 1) / math.log2(i + 2)

    return dcg


def ndcg_at_k(relevances: List[float], k: int) -> float:
    dcg = dcg_at_k(relevances, k)

    ideal_relevances = sorted(relevances, reverse=True)
    idcg = dcg_at_k(ideal_relevances, k)

    if idcg == 0:
        return 0.0

    return dcg / idcg


def precision_at_k(relevances: List[float], k: int, threshold: float = 0.5) -> float:
    relevances = relevances[:k]
    if not relevances:
        return 0.0

    relevant_count = sum(1 for r in relevances if r >= threshold)
    return relevant_count / k


def recall_at_k(
    relevances: List[float],
    k: int,
    total_relevant: int,
    threshold: float = 0.5
) -> float:
    if total_relevant == 0:
        return 0.0

    relevances = relevances[:k]
    relevant_count = sum(1 for r in relevances if r >= threshold)

    return relevant_count / total_relevant


def mean_reciprocal_rank(relevances: List[float], threshold: float = 0.5) -> float:
    for i, rel in enumerate(relevances):
        if rel >= threshold:
            return 1.0 / (i + 1)

    return 0.0


def calculate_relevance(
    doc: Dict,
    user_profile: Optional[Dict],
    clicked: bool = False
) -> float:
    relevance = 0.0

    if clicked:
        relevance += 0.5

    if user_profile:
        specialization = user_profile.get('specialization', '').lower()
        subject = (doc.get('subject_area', '') or '').lower()

        if specialization and specialization in subject:
            relevance += 0.3

        interests = user_profile.get('interests', [])
        title = (doc.get('title', '') or '').lower()

        for interest in interests:
            if interest.lower() in title or interest.lower() in subject:
                relevance += 0.2
                break

    return min(relevance, 1.0)


def compare_rankings(
    results_a: List[Dict],
    results_b: List[Dict],
    user_profile: Optional[Dict] = None,
    clicks_a: List[str] = None,
    clicks_b: List[str] = None
) -> Dict:
    clicks_a = clicks_a or []
    clicks_b = clicks_b or []

    rel_a = [
        calculate_relevance(
            doc,
            user_profile,
            doc.get('document_id') in clicks_a
        )
        for doc in results_a
    ]

    rel_b = [
        calculate_relevance(
            doc,
            user_profile,
            doc.get('document_id') in clicks_b
        )
        for doc in results_b
    ]

    return {
        "ndcg_a": round(ndcg_at_k(rel_a, 10), 4),
        "ndcg_b": round(ndcg_at_k(rel_b, 10), 4),
        "precision_a": round(precision_at_k(rel_a, 10), 4),
        "precision_b": round(precision_at_k(rel_b, 10), 4),
        "mrr_a": round(mean_reciprocal_rank(rel_a), 4),
        "mrr_b": round(mean_reciprocal_rank(rel_b), 4),
        "overlap": len(
            set(d['document_id'] for d in results_a) &
            set(d['document_id'] for d in results_b)
        ),
    }
