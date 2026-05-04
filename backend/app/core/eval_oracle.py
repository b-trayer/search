"""Relevance oracle for offline evaluation.

The oracle is fully deterministic and reuses the same matching helpers that
power live ranking - so the metrics measured against it stay reproducible
across environments without requiring human labels.

Two oracles are exposed:

- :func:`topical_relevance` returns 1 when at least one query term occurs
  in the document title or subjects. It is independent of the user profile
  and serves as the classic IR ground truth.

- :func:`full_relevance` returns a graded score in 0..3 combining the
  topical match with two profile criteria (topic fit and document-type
  fit). It is partially circular - by construction personalisation is
  expected to perform well on it - so reports should always present both
  oracles side by side.
"""

from __future__ import annotations

from typing import Iterable, List, Mapping, Optional

from backend.app.core.preferences import (
    calculate_f_topic,
    calculate_f_type,
    canonicalize_document_type,
)

MIN_QUERY_TOKEN_LENGTH = 3
TOPIC_FIT_THRESHOLD = 0.6
TYPE_FIT_THRESHOLD = 0.3


def _tokenize_query(query: str) -> List[str]:
    if not query:
        return []
    tokens = []
    for raw in query.lower().split():
        token = raw.strip('.,;:?!"()[]{}«»\u00ab\u00bb-')
        if len(token) >= MIN_QUERY_TOKEN_LENGTH:
            tokens.append(token)
    return tokens


def _doc_haystack(doc: Mapping) -> str:
    title = (doc.get('title') or '').lower()
    subjects = doc.get('subjects') or []
    if not isinstance(subjects, (list, tuple)):
        subjects = [subjects]
    subjects_text = ' '.join(str(s).lower() for s in subjects if s)
    return f"{title} {subjects_text}"


def topical_relevance(doc: Mapping, query: str) -> int:
    """Return 1 if any query term occurs in title or subjects, 0 otherwise."""
    tokens = _tokenize_query(query)
    if not tokens:
        return 0
    haystack = _doc_haystack(doc)
    return int(any(token in haystack for token in tokens))


def topic_fit(doc: Mapping, user: Optional[Mapping]) -> bool:
    if not user:
        return False
    specialization = user.get('specialization') or ''
    interests = user.get('interests') or []
    if not isinstance(interests, (list, tuple)):
        interests = [interests]
    subjects = doc.get('subjects') or []
    if not isinstance(subjects, (list, tuple)):
        subjects = [subjects]
    score = calculate_f_topic(list(subjects), specialization, list(interests))
    return score >= TOPIC_FIT_THRESHOLD


def type_fit(doc: Mapping, user: Optional[Mapping]) -> bool:
    if not user:
        return False
    role = user.get('role') or ''
    canonical = canonicalize_document_type(
        doc.get('document_type'),
        doc.get('collection') or '',
    )
    score = calculate_f_type(canonical, role)
    return score >= TYPE_FIT_THRESHOLD


def full_relevance(doc: Mapping, query: str, user: Optional[Mapping]) -> int:
    """Graded relevance in [0, 3]:
    +1 for topical match between query and (title, subjects).
    +1 if document subjects fit the user's specialisation/interests.
    +1 if document type matches the user's role profile.
    """
    score = topical_relevance(doc, query)
    if user is None:
        return score
    if topic_fit(doc, user):
        score += 1
    if type_fit(doc, user):
        score += 1
    return score


def build_gain_map(
    docs: Iterable[Mapping],
    query: str,
    user: Optional[Mapping],
    *,
    oracle: str = 'full',
) -> dict:
    """Build a {document_id: gain} mapping for use with metrics.ndcg_at_k.

    ``oracle`` is one of ``"full"`` or ``"topical"``.
    Documents with zero gain are still included with value 0 so callers can
    rely on the dictionary covering the entire candidate set.
    """
    if oracle not in {'full', 'topical'}:
        raise ValueError(f"unknown oracle: {oracle!r}")
    gains: dict = {}
    for doc in docs:
        doc_id = doc.get('document_id')
        if not doc_id:
            continue
        if oracle == 'topical':
            gains[doc_id] = topical_relevance(doc, query)
        else:
            gains[doc_id] = full_relevance(doc, query, user)
    return gains
