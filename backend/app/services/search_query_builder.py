from typing import Dict, List, Any, Optional, Literal


SEARCH_FIELDS = [
    "title^3",
    "authors^2",
    "subjects^2",
    "collection^1.5",
    "knowledge_area^1.5",
    "organization",
    "publication_info"
]

FIELD_SPECIFIC_SEARCH: Dict[str, List[str]] = {
    "title": ["title^3"],
    "authors": ["authors^2"],
    "subjects": ["subjects^2"],
    "collection": ["collection^1.5"],
}

HIGHLIGHT_FIELDS = ["title", "authors", "subjects", "collection"]


def build_search_query(
    query: str,
    filters: Optional[Dict] = None,
    search_field: str = "all"
) -> Dict[str, Any]:
    must_clauses = [_build_multi_match_clause(query, search_field)]
    filter_clauses = _build_filter_clauses(filters) if filters else []

    return {
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


def _build_multi_match_clause(query: str, search_field: str = "all") -> Dict[str, Any]:
    fields = FIELD_SPECIFIC_SEARCH.get(search_field, SEARCH_FIELDS)
    return {
        "multi_match": {
            "query": query,
            "fields": fields,
            "fuzziness": "AUTO",
            "type": "best_fields",
            "operator": "or",
            "minimum_should_match": "50%"
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

    if filters.get("has_pdf") is True:
        clauses.append({"exists": {"field": "pdf_url"}})
    elif filters.get("has_pdf") is False:
        clauses.append({"bool": {"must_not": {"exists": {"field": "pdf_url"}}}})

    return clauses


def build_aggregations_query() -> Dict[str, Any]:
    return {
        "size": 0,
        "aggs": {
            "collections": {"terms": {"field": "collection.keyword", "size": 50}},
            "knowledge_areas": {"terms": {"field": "knowledge_area.keyword", "size": 50}},
            "document_types": {"terms": {"field": "document_type", "size": 30}},
            "languages": {"terms": {"field": "language", "size": 20}},
            "sources": {"terms": {"field": "source", "size": 10}},
            "has_pdf": {"filter": {"exists": {"field": "pdf_url"}}}
        }
    }


def parse_aggregations_response(response: Dict[str, Any]) -> Dict[str, Any]:
    aggs = response.get("aggregations", {})
    total = response.get("hits", {}).get("total", {}).get("value", 0)

    def extract_buckets(agg_name: str) -> List[Dict[str, Any]]:
        buckets = aggs.get(agg_name, {}).get("buckets", [])
        return [{"name": b["key"], "count": b["doc_count"]} for b in buckets]

    has_pdf_count = aggs.get("has_pdf", {}).get("doc_count", 0)

    return {
        "collections": extract_buckets("collections"),
        "knowledge_areas": extract_buckets("knowledge_areas"),
        "document_types": extract_buckets("document_types"),
        "languages": extract_buckets("languages"),
        "sources": extract_buckets("sources"),
        "has_pdf": {"with_pdf": has_pdf_count, "without_pdf": total - has_pdf_count},
    }
