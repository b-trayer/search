#!/usr/bin/env python3
"""Offline evaluation harness for the personalised search ranker.

Runs a fixed JSONL dataset of (query, user_id) pairs against the live API
under several weight presets and reports nDCG@10, Precision@5, Precision@10,
Recall@10, MAP and MRR averaged over the dataset.

Two oracles are evaluated side by side:

- ``topical``  - independent IR ground truth (query terms vs title/subjects).
- ``full``     - graded oracle that also accounts for the user profile.

By construction personalisation should help on ``full`` while not hurting
``topical`` significantly. Reports both as Markdown and CSV.

Example:

    python scripts/run_evaluation.py \\
        --dataset data/eval/queries.jsonl \\
        --output data/eval/report \\
        --presets default bm25_only high_personalization
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Mapping, Optional

import requests

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT))

from backend.app.core.eval_oracle import build_gain_map, full_relevance, topical_relevance
from backend.app.core.metrics import (
    average_precision,
    mean,
    ndcg_at_k,
    precision_at_k,
    recall_at_k,
    reciprocal_rank,
)
from backend.app.schemas.settings import WEIGHT_PRESETS, WeightPreset

DEFAULT_API = "http://localhost:8000"
DEFAULT_POOL_SIZE = 100
DEFAULT_METRIC_K = 10
DEFAULT_DELAY_SEC = 2.1  # backend rate-limits to 30 req/min
ORACLES = ("topical", "full")
METRIC_KS = (5, 10)


@dataclass
class QuerySpec:
    id: str
    query: str
    user_id: Optional[int]
    intent: str

    @classmethod
    def from_jsonl(cls, raw: dict) -> "QuerySpec":
        return cls(
            id=str(raw["id"]),
            query=str(raw["query"]),
            user_id=raw.get("user_id"),
            intent=str(raw.get("intent", "")),
        )


@dataclass
class QueryResult:
    spec: QuerySpec
    preset: str
    ndcg_topical_10: float
    ndcg_full_10: float
    precision_topical_5: float
    precision_topical_10: float
    precision_full_5: float
    precision_full_10: float
    recall_topical_10: float
    recall_full_10: float
    map_topical: float
    map_full: float
    mrr_topical: float
    mrr_full: float


def load_dataset(path: Path) -> List[QuerySpec]:
    specs: List[QuerySpec] = []
    with path.open(encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("//"):
                continue
            specs.append(QuerySpec.from_jsonl(json.loads(line)))
    if not specs:
        raise SystemExit(f"dataset {path} is empty")
    return specs


def fetch_user(api_base: str, user_id: int) -> Mapping[str, Any]:
    resp = requests.get(f"{api_base}/api/v1/users/{user_id}", timeout=10)
    resp.raise_for_status()
    return resp.json()


RATE_LIMIT_BACKOFF_SEC = 5.0
RATE_LIMIT_MAX_RETRIES = 5


def search(
    api_base: str,
    query: str,
    user_id: Optional[int],
    weights: Optional[Mapping[str, float]],
    top_k: int,
) -> List[Mapping[str, Any]]:
    payload: Dict[str, Any] = {
        "query": query,
        "top_k": top_k,
        "enable_personalization": user_id is not None,
    }
    if user_id is not None:
        payload["user_id"] = user_id
    if weights is not None:
        payload["weights_override"] = dict(weights)

    for attempt in range(RATE_LIMIT_MAX_RETRIES):
        resp = requests.post(f"{api_base}/api/v1/search/", json=payload, timeout=30)
        if resp.status_code == 429:
            wait = RATE_LIMIT_BACKOFF_SEC * (attempt + 1)
            print(f"  [rate-limited, sleeping {wait:.1f}s]", file=sys.stderr)
            time.sleep(wait)
            continue
        resp.raise_for_status()
        return resp.json().get("results") or []

    raise requests.RequestException("rate-limited after max retries")


def evaluate_one(
    spec: QuerySpec,
    preset_name: str,
    weights: Optional[Mapping[str, float]],
    api_base: str,
    user_cache: Dict[int, Mapping[str, Any]],
    pool_size: int,
) -> QueryResult:
    user = None
    if spec.user_id is not None:
        if spec.user_id not in user_cache:
            user_cache[spec.user_id] = fetch_user(api_base, spec.user_id)
        user = user_cache[spec.user_id]

    docs = search(api_base, spec.query, spec.user_id, weights, pool_size)
    ranked = [d.get("document_id") for d in docs if d.get("document_id")]

    gains_topical = build_gain_map(docs, spec.query, user, oracle="topical")
    gains_full = build_gain_map(docs, spec.query, user, oracle="full")

    relevant_topical = {d for d, g in gains_topical.items() if g > 0}
    relevant_full = {d for d, g in gains_full.items() if g > 0}

    return QueryResult(
        spec=spec,
        preset=preset_name,
        ndcg_topical_10=ndcg_at_k(ranked, gains_topical, 10),
        ndcg_full_10=ndcg_at_k(ranked, gains_full, 10),
        precision_topical_5=precision_at_k(ranked, relevant_topical, 5),
        precision_topical_10=precision_at_k(ranked, relevant_topical, 10),
        precision_full_5=precision_at_k(ranked, relevant_full, 5),
        precision_full_10=precision_at_k(ranked, relevant_full, 10),
        recall_topical_10=recall_at_k(ranked, relevant_topical, 10),
        recall_full_10=recall_at_k(ranked, relevant_full, 10),
        map_topical=average_precision(ranked, relevant_topical),
        map_full=average_precision(ranked, relevant_full),
        mrr_topical=reciprocal_rank(ranked, relevant_topical),
        mrr_full=reciprocal_rank(ranked, relevant_full),
    )


def aggregate(rows: List[QueryResult]) -> Dict[str, Dict[str, float]]:
    agg: Dict[str, Dict[str, float]] = {}
    by_preset: Dict[str, List[QueryResult]] = {}
    for row in rows:
        by_preset.setdefault(row.preset, []).append(row)
    for preset, items in by_preset.items():
        agg[preset] = {
            "n": float(len(items)),
            "ndcg@10 (topical)": mean([r.ndcg_topical_10 for r in items]),
            "ndcg@10 (full)": mean([r.ndcg_full_10 for r in items]),
            "P@5 (topical)": mean([r.precision_topical_5 for r in items]),
            "P@10 (topical)": mean([r.precision_topical_10 for r in items]),
            "P@5 (full)": mean([r.precision_full_5 for r in items]),
            "P@10 (full)": mean([r.precision_full_10 for r in items]),
            "Recall@10 (topical)": mean([r.recall_topical_10 for r in items]),
            "Recall@10 (full)": mean([r.recall_full_10 for r in items]),
            "MAP (topical)": mean([r.map_topical for r in items]),
            "MAP (full)": mean([r.map_full for r in items]),
            "MRR (topical)": mean([r.mrr_topical for r in items]),
            "MRR (full)": mean([r.mrr_full for r in items]),
        }
    return agg


def render_markdown(agg: Dict[str, Dict[str, float]]) -> str:
    metric_keys = [
        "ndcg@10 (topical)", "ndcg@10 (full)",
        "P@5 (topical)", "P@5 (full)",
        "P@10 (topical)", "P@10 (full)",
        "Recall@10 (topical)", "Recall@10 (full)",
        "MAP (topical)", "MAP (full)",
        "MRR (topical)", "MRR (full)",
    ]
    presets = list(agg.keys())
    header = "| Metric | " + " | ".join(presets) + " |"
    sep = "|" + "|".join(["---"] * (len(presets) + 1)) + "|"
    lines = [header, sep]
    for key in metric_keys:
        row = [key]
        for preset in presets:
            row.append(f"{agg[preset][key]:.3f}")
        lines.append("| " + " | ".join(row) + " |")
    n = int(next(iter(agg.values()))["n"]) if agg else 0
    lines.append("")
    lines.append(f"_Averaged over {n} queries_")
    return "\n".join(lines)


def write_csv(rows: List[QueryResult], path: Path) -> None:
    fieldnames = [
        "preset", "id", "query", "user_id", "intent",
        "ndcg_topical_10", "ndcg_full_10",
        "precision_topical_5", "precision_topical_10",
        "precision_full_5", "precision_full_10",
        "recall_topical_10", "recall_full_10",
        "map_topical", "map_full",
        "mrr_topical", "mrr_full",
    ]
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({
                "preset": row.preset,
                "id": row.spec.id,
                "query": row.spec.query,
                "user_id": row.spec.user_id if row.spec.user_id is not None else "",
                "intent": row.spec.intent,
                "ndcg_topical_10": f"{row.ndcg_topical_10:.4f}",
                "ndcg_full_10": f"{row.ndcg_full_10:.4f}",
                "precision_topical_5": f"{row.precision_topical_5:.4f}",
                "precision_topical_10": f"{row.precision_topical_10:.4f}",
                "precision_full_5": f"{row.precision_full_5:.4f}",
                "precision_full_10": f"{row.precision_full_10:.4f}",
                "recall_topical_10": f"{row.recall_topical_10:.4f}",
                "recall_full_10": f"{row.recall_full_10:.4f}",
                "map_topical": f"{row.map_topical:.4f}",
                "map_full": f"{row.map_full:.4f}",
                "mrr_topical": f"{row.mrr_topical:.4f}",
                "mrr_full": f"{row.mrr_full:.4f}",
            })


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dataset", type=Path, default=Path("data/eval/queries.jsonl"))
    parser.add_argument("--output", type=Path, default=Path("data/eval/report"))
    parser.add_argument("--api-base", default=DEFAULT_API)
    parser.add_argument(
        "--pool-size",
        type=int,
        default=DEFAULT_POOL_SIZE,
        help="how many top results to fetch and label (relevance pool depth)",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=DEFAULT_DELAY_SEC,
        help="seconds to sleep between API requests to avoid rate-limits",
    )
    parser.add_argument(
        "--presets",
        nargs="+",
        default=[p.value for p in WeightPreset],
        choices=[p.value for p in WeightPreset],
    )
    args = parser.parse_args(argv)

    specs = load_dataset(args.dataset)

    rows: List[QueryResult] = []
    user_cache: Dict[int, Mapping[str, Any]] = {}
    started = time.perf_counter()

    for preset_value in args.presets:
        preset = WeightPreset(preset_value)
        weights = WEIGHT_PRESETS[preset].model_dump()
        print(f"== preset: {preset.value} ==", file=sys.stderr)
        for spec in specs:
            try:
                row = evaluate_one(
                    spec,
                    preset.value,
                    weights,
                    args.api_base,
                    user_cache,
                    args.pool_size,
                )
            except requests.RequestException as exc:
                print(f"  [skip] {spec.id}: {exc}", file=sys.stderr)
                continue
            rows.append(row)
            print(
                f"  {spec.id:<35} ndcg_topical@10={row.ndcg_topical_10:.3f} "
                f"ndcg_full@10={row.ndcg_full_10:.3f}",
                file=sys.stderr,
            )
            if args.delay > 0:
                time.sleep(args.delay)

    elapsed = time.perf_counter() - started
    agg = aggregate(rows)
    md = render_markdown(agg)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    md_path = args.output.with_suffix(".md")
    csv_path = args.output.with_suffix(".csv")
    md_path.write_text(md + "\n", encoding="utf-8")
    write_csv(rows, csv_path)

    print()
    print(md)
    print()
    print(f"saved markdown -> {md_path}")
    print(f"saved csv      -> {csv_path}")
    print(f"elapsed: {elapsed:.1f}s, queries: {len(specs)}, presets: {len(args.presets)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
