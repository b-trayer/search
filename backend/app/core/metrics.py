"""Information retrieval metrics for offline evaluation.

All functions accept a ranked sequence of document ids and a notion of
relevance, return a float in [0, 1]. Empty inputs return 0.0 - this is the
convention used in trec_eval and most academic literature.

The graded variants (DCG, nDCG) accept a mapping ``doc_id -> gain`` where
gain is a non-negative number, typically 0..3. Documents not present in the
mapping are treated as gain=0.
"""

from __future__ import annotations

import math
from typing import Iterable, Mapping, Sequence


def precision_at_k(ranked: Sequence[str], relevant: Iterable[str], k: int) -> float:
    """Precision@k: fraction of relevant documents among the top k results."""
    if k <= 0 or not ranked:
        return 0.0
    relevant_set = set(relevant)
    if not relevant_set:
        return 0.0
    top_k = ranked[:k]
    hits = sum(1 for doc_id in top_k if doc_id in relevant_set)
    return hits / k


def recall_at_k(ranked: Sequence[str], relevant: Iterable[str], k: int) -> float:
    """Recall@k: fraction of relevant documents that are retrieved in the top k."""
    if k <= 0 or not ranked:
        return 0.0
    relevant_set = set(relevant)
    if not relevant_set:
        return 0.0
    top_k = ranked[:k]
    hits = sum(1 for doc_id in top_k if doc_id in relevant_set)
    return hits / len(relevant_set)


def average_precision(ranked: Sequence[str], relevant: Iterable[str]) -> float:
    """Average precision (AP) - average of precision@i over positions where a
    relevant document is hit. Used as the building block of MAP."""
    relevant_set = set(relevant)
    if not relevant_set or not ranked:
        return 0.0
    hits = 0
    summed = 0.0
    for i, doc_id in enumerate(ranked, start=1):
        if doc_id in relevant_set:
            hits += 1
            summed += hits / i
    return summed / len(relevant_set)


def reciprocal_rank(ranked: Sequence[str], relevant: Iterable[str]) -> float:
    """Reciprocal rank: 1/rank of the first relevant document, 0 if none."""
    relevant_set = set(relevant)
    if not relevant_set:
        return 0.0
    for i, doc_id in enumerate(ranked, start=1):
        if doc_id in relevant_set:
            return 1.0 / i
    return 0.0


def dcg_at_k(ranked: Sequence[str], gains: Mapping[str, float], k: int) -> float:
    """Discounted cumulative gain at k.

    Uses the standard (Burges et al., 2005) formulation:
        DCG@k = sum_{i=1..k} (2^gain_i - 1) / log2(i + 1)
    """
    if k <= 0 or not ranked:
        return 0.0
    total = 0.0
    for i, doc_id in enumerate(ranked[:k], start=1):
        gain = float(gains.get(doc_id, 0.0))
        if gain <= 0:
            continue
        total += (math.pow(2.0, gain) - 1.0) / math.log2(i + 1)
    return total


def ndcg_at_k(ranked: Sequence[str], gains: Mapping[str, float], k: int) -> float:
    """Normalised DCG@k. Returns 0 when no positive-gain documents exist
    (ideal DCG would be zero, division by zero). Returns a value in [0, 1]."""
    if k <= 0 or not ranked:
        return 0.0
    actual = dcg_at_k(ranked, gains, k)
    if actual <= 0:
        return 0.0
    sorted_gains = sorted((g for g in gains.values() if g > 0), reverse=True)
    if not sorted_gains:
        return 0.0
    ideal = 0.0
    for i, gain in enumerate(sorted_gains[:k], start=1):
        ideal += (math.pow(2.0, gain) - 1.0) / math.log2(i + 1)
    if ideal <= 0:
        return 0.0
    return actual / ideal


def mean(values: Sequence[float]) -> float:
    """Tiny helper used by the evaluation harness to average per-query metrics."""
    if not values:
        return 0.0
    return sum(values) / len(values)
