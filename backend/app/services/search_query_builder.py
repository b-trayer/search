from typing import Dict, List, Any, Optional, Set


SEARCH_FIELDS = [
    "title^3",
    "authors^2",
    "subjects^2",
    "collection^1.5",
    "knowledge_area^1.5",
    "organization",
    "publication_info"
]

FUZZY_PREFIX_LENGTH = 2
EXACT_MATCH_BOOST = 3.0

FIELD_SPECIFIC_SEARCH: Dict[str, List[str]] = {
    "title": ["title^3"],
    "authors": ["authors^2"],
    "subjects": ["subjects^2"],
    "collection": ["collection^1.5"],
}

HIGHLIGHT_FIELDS = ["title", "authors", "subjects", "collection"]

ELIB_DATABASE_KEY = "ELIB"

FACET_EXCLUDED_KEYS: Dict[str, Set[str]] = {
    "collections": {"collection"},
    "knowledge_areas": {"knowledge_area"},
    "document_types": {"document_type"},
    "languages": {"language"},
    "sources": {"source"},
    "databases": {"databases", "database"},
    "year_stats": {"year_from", "year_to"},
    "has_pdf": {"has_pdf"},
}


SORT_BY_OS_CLAUSES: Dict[str, List[Dict[str, Any]]] = {
    "relevance": [],
    "year_desc": [{"year": {"order": "desc", "missing": "_last"}}, "_score"],
    "year_asc": [{"year": {"order": "asc", "missing": "_last"}}, "_score"],
    "title_asc": [{"title.keyword": {"order": "asc", "missing": "_last"}}],
    "popularity_desc": [],
}


def build_search_query(
    query: str,
    filters: Optional[Dict] = None,
    search_field: str = "all",
    sort_by: str = "relevance",
) -> Dict[str, Any]:
    must_clauses = [_build_multi_match_clause(query, search_field)]
    filter_clauses = _build_filter_clauses(filters) if filters else []

    body: Dict[str, Any] = {
        "track_total_hits": True,
        "query": {
            "bool": {
                "must": must_clauses,
                "filter": filter_clauses
            }
        },
        "highlight": {
            "fields": {field: {} for field in HIGHLIGHT_FIELDS},
            "pre_tags": ["<mark>"],
            "post_tags": ["</mark>"]
        }
    }

    sort_clauses = SORT_BY_OS_CLAUSES.get(sort_by, [])
    if sort_clauses:
        body["sort"] = sort_clauses

    return body


def _build_multi_match_clause(query: str, search_field: str = "all") -> Dict[str, Any]:
    fields = FIELD_SPECIFIC_SEARCH.get(search_field, SEARCH_FIELDS)
    return {
        "bool": {
            "should": [
                {
                    "multi_match": {
                        "query": query,
                        "fields": fields,
                        "type": "best_fields",
                        "operator": "or",
                        "minimum_should_match": "50%",
                        "boost": EXACT_MATCH_BOOST,
                    }
                },
                {
                    "multi_match": {
                        "query": query,
                        "fields": fields,
                        "fuzziness": "AUTO",
                        "prefix_length": FUZZY_PREFIX_LENGTH,
                        "type": "best_fields",
                        "operator": "or",
                        "minimum_should_match": "50%",
                    }
                },
            ],
            "minimum_should_match": 1,
        }
    }


def _build_filter_clauses(filters: Dict) -> List[Dict[str, Any]]:
    clauses = []

    if filters.get("collection"):
        clauses.append({"term": {"collection.keyword": filters["collection"]}})

    if filters.get("language"):
        clauses.append({"term": {"language": filters["language"]}})

    if filters.get("document_type"):
        doc_types = filters["document_type"]
        if isinstance(doc_types, list):
            clauses.append({"terms": {"document_type": doc_types}})
        else:
            clauses.append({"term": {"document_type": doc_types}})

    if filters.get("knowledge_area"):
        clauses.append({"term": {"knowledge_area.keyword": filters["knowledge_area"]}})

    if filters.get("source"):
        clauses.append({"term": {"source": filters["source"]}})

    databases = filters.get("databases") or filters.get("database")
    if databases:
        if isinstance(databases, str):
            databases = [databases]
        clauses.append(_build_database_clause(databases))

    year_clause = _build_year_clause(filters.get("year_from"), filters.get("year_to"))
    if year_clause:
        clauses.append(year_clause)

    if filters.get("has_pdf") is True:
        clauses.append({"exists": {"field": "pdf_url"}})
    elif filters.get("has_pdf") is False:
        clauses.append({"bool": {"must_not": {"exists": {"field": "pdf_url"}}}})

    return clauses


def _build_database_clause(databases: List[str]) -> Dict[str, Any]:
    real_dbs = [d for d in databases if d and d != ELIB_DATABASE_KEY]
    include_elib = ELIB_DATABASE_KEY in databases

    should: List[Dict[str, Any]] = []
    if real_dbs:
        should.append({"terms": {"database.keyword": real_dbs}})
    if include_elib:
        should.append({"bool": {"must_not": {"exists": {"field": "database"}}}})

    return {"bool": {"should": should, "minimum_should_match": 1}}


def _build_year_clause(year_from: Optional[int], year_to: Optional[int]) -> Optional[Dict[str, Any]]:
    if year_from is None and year_to is None:
        return None
    range_body: Dict[str, int] = {}
    if year_from is not None:
        range_body["gte"] = int(year_from)
    if year_to is not None:
        range_body["lte"] = int(year_to)
    return {"range": {"year": range_body}}


def _filters_without(filters: Optional[Dict], excluded_keys: Set[str]) -> Dict[str, Any]:
    if not filters:
        return {}
    return {k: v for k, v in filters.items() if k not in excluded_keys}


_FACET_BODIES: Dict[str, Dict[str, Any]] = {
    "collections": {"terms": {"field": "collection.keyword", "size": 50}},
    "knowledge_areas": {"terms": {"field": "knowledge_area.keyword", "size": 50}},
    "document_types": {"terms": {"field": "document_type", "size": 30}},
    "languages": {"terms": {"field": "language", "size": 20}},
    "sources": {"terms": {"field": "source", "size": 10}},
    "databases": {"terms": {"field": "database.keyword", "size": 20, "missing": ELIB_DATABASE_KEY}},
    "year_stats": {"stats": {"field": "year"}},
    "has_pdf": {"filter": {"exists": {"field": "pdf_url"}}},
}


def _build_facet_aggregation(facet_name: str, filters: Optional[Dict]) -> Dict[str, Any]:
    excluded = FACET_EXCLUDED_KEYS.get(facet_name, set())
    other_filters = _filters_without(filters, excluded)
    other_clauses = _build_filter_clauses(other_filters)

    inner_body = _FACET_BODIES[facet_name]

    if not other_clauses:
        return inner_body

    return {
        "filter": {"bool": {"filter": other_clauses}},
        "aggs": {"value": inner_body},
    }


def build_aggregations_query(
    query: Optional[str] = None,
    filters: Optional[Dict] = None,
    search_field: str = "all",
) -> Dict[str, Any]:
    base_query: Dict[str, Any] = (
        {"match_all": {}}
        if not query
        else _build_multi_match_clause(query, search_field)
    )

    aggs = {name: _build_facet_aggregation(name, filters) for name in _FACET_BODIES}

    return {
        "size": 0,
        "track_total_hits": True,
        "query": base_query,
        "aggs": aggs,
    }


def _extract_buckets(agg: Dict[str, Any]) -> List[Dict[str, Any]]:
    payload = agg.get("value", agg) if isinstance(agg, dict) else {}
    buckets = payload.get("buckets", []) if isinstance(payload, dict) else []
    return [{"name": b["key"], "count": b["doc_count"]} for b in buckets]


def _extract_year_stats(agg: Dict[str, Any]) -> Dict[str, Optional[int]]:
    payload = agg.get("value", agg) if isinstance(agg, dict) else {}
    stats = payload if isinstance(payload, dict) else {}
    year_min = stats.get("min")
    year_max = stats.get("max")
    return {
        "min": int(year_min) if year_min is not None else None,
        "max": int(year_max) if year_max is not None else None,
    }


def _extract_has_pdf(agg: Dict[str, Any], total: int) -> Dict[str, int]:
    if not isinstance(agg, dict):
        return {"with_pdf": 0, "without_pdf": total}

    if "value" in agg and isinstance(agg["value"], dict):
        with_pdf = agg["value"].get("doc_count", 0)
        scope_total = agg.get("doc_count", total)
    else:
        with_pdf = agg.get("doc_count", 0)
        scope_total = total

    return {"with_pdf": with_pdf, "without_pdf": max(scope_total - with_pdf, 0)}


def parse_aggregations_response(response: Dict[str, Any]) -> Dict[str, Any]:
    aggs = response.get("aggregations", {})
    total = response.get("hits", {}).get("total", {}).get("value", 0)

    return {
        "collections": _extract_buckets(aggs.get("collections", {})),
        "knowledge_areas": _extract_buckets(aggs.get("knowledge_areas", {})),
        "document_types": _extract_buckets(aggs.get("document_types", {})),
        "languages": _extract_buckets(aggs.get("languages", {})),
        "sources": _extract_buckets(aggs.get("sources", {})),
        "databases": _extract_buckets(aggs.get("databases", {})),
        "year_range": _extract_year_stats(aggs.get("year_stats", {})),
        "has_pdf": _extract_has_pdf(aggs.get("has_pdf", {}), total),
    }
