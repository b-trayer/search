import pytest
from backend.app.services.search_query_builder import (
    build_search_query,
    build_aggregations_query,
    parse_aggregations_response,
    SEARCH_FIELDS,
    HIGHLIGHT_FIELDS,
)


class TestBuildSearchQuery:

    def test_basic_query_structure(self):
        result = build_search_query("квантовая физика")

        assert "query" in result
        assert "bool" in result["query"]
        assert "must" in result["query"]["bool"]
        assert "filter" in result["query"]["bool"]
        assert result["track_total_hits"] is True

    def test_multi_match_query(self):
        result = build_search_query("термодинамика")

        must_clause = result["query"]["bool"]["must"][0]
        assert "multi_match" in must_clause

        multi_match = must_clause["multi_match"]
        assert multi_match["query"] == "термодинамика"
        assert multi_match["fields"] == SEARCH_FIELDS
        assert multi_match["fuzziness"] == "AUTO"
        assert multi_match["type"] == "best_fields"
        assert multi_match["minimum_should_match"] == "50%"

    def test_highlight_configuration(self):
        result = build_search_query("алгебра")

        assert "highlight" in result
        highlight = result["highlight"]
        assert highlight["pre_tags"] == ["<mark>"]
        assert highlight["post_tags"] == ["</mark>"]

        for field in HIGHLIGHT_FIELDS:
            assert field in highlight["fields"]

    def test_no_filters_returns_empty_filter_list(self):
        result = build_search_query("математика", filters=None)
        assert result["query"]["bool"]["filter"] == []

    def test_empty_filters_dict(self):
        result = build_search_query("математика", filters={})
        assert result["query"]["bool"]["filter"] == []


class TestFilterClauses:

    def test_collection_filter(self):
        result = build_search_query("физика", filters={"collection": "Учебные издания"})

        filters = result["query"]["bool"]["filter"]
        assert len(filters) == 1
        assert filters[0] == {"term": {"collection.keyword": "Учебные издания"}}

    def test_language_filter(self):
        result = build_search_query("химия", filters={"language": "ru"})

        filters = result["query"]["bool"]["filter"]
        assert {"term": {"language": "ru"}} in filters

    def test_document_type_single(self):
        result = build_search_query("биология", filters={"document_type": "учебник"})

        filters = result["query"]["bool"]["filter"]
        assert {"term": {"document_type": "учебник"}} in filters

    def test_document_type_list(self):
        result = build_search_query("история", filters={"document_type": ["учебник", "монография"]})

        filters = result["query"]["bool"]["filter"]
        assert {"terms": {"document_type": ["учебник", "монография"]}} in filters

    def test_knowledge_area_filter(self):
        result = build_search_query("экономика", filters={"knowledge_area": "Экономические науки"})

        filters = result["query"]["bool"]["filter"]
        assert {"term": {"knowledge_area.keyword": "Экономические науки"}} in filters

    def test_source_filter(self):
        result = build_search_query("право", filters={"source": "nsu"})

        filters = result["query"]["bool"]["filter"]
        assert {"term": {"source": "nsu"}} in filters

    def test_has_pdf_true(self):
        result = build_search_query("философия", filters={"has_pdf": True})

        filters = result["query"]["bool"]["filter"]
        assert {"exists": {"field": "pdf_url"}} in filters

    def test_has_pdf_false(self):
        result = build_search_query("социология", filters={"has_pdf": False})

        filters = result["query"]["bool"]["filter"]
        assert {"bool": {"must_not": {"exists": {"field": "pdf_url"}}}} in filters

    def test_has_pdf_none_not_added(self):
        result = build_search_query("психология", filters={"has_pdf": None})

        filters = result["query"]["bool"]["filter"]
        assert len(filters) == 0

    def test_multiple_filters_combined(self):
        result = build_search_query("информатика", filters={
            "collection": "Научные издания",
            "language": "en",
            "source": "nsu",
            "has_pdf": True,
        })

        filters = result["query"]["bool"]["filter"]
        assert len(filters) == 4
        assert {"term": {"collection.keyword": "Научные издания"}} in filters
        assert {"term": {"language": "en"}} in filters
        assert {"term": {"source": "nsu"}} in filters
        assert {"exists": {"field": "pdf_url"}} in filters


class TestBuildAggregationsQuery:

    def test_aggregations_structure(self):
        result = build_aggregations_query()

        assert result["size"] == 0
        assert "aggs" in result

    def test_all_aggregations_present(self):
        result = build_aggregations_query()
        aggs = result["aggs"]

        assert "collections" in aggs
        assert "knowledge_areas" in aggs
        assert "document_types" in aggs
        assert "languages" in aggs
        assert "sources" in aggs
        assert "has_pdf" in aggs

    def test_aggregation_sizes(self):
        result = build_aggregations_query()
        aggs = result["aggs"]

        assert aggs["collections"]["terms"]["size"] == 50
        assert aggs["knowledge_areas"]["terms"]["size"] == 50
        assert aggs["document_types"]["terms"]["size"] == 30
        assert aggs["languages"]["terms"]["size"] == 20
        assert aggs["sources"]["terms"]["size"] == 10

    def test_has_pdf_is_filter_aggregation(self):
        result = build_aggregations_query()

        has_pdf_agg = result["aggs"]["has_pdf"]
        assert "filter" in has_pdf_agg
        assert has_pdf_agg["filter"] == {"exists": {"field": "pdf_url"}}


class TestParseAggregationsResponse:

    def test_parse_empty_response(self):
        response = {"hits": {"total": {"value": 0}}, "aggregations": {}}

        result = parse_aggregations_response(response)

        assert result["collections"] == []
        assert result["knowledge_areas"] == []
        assert result["document_types"] == []
        assert result["languages"] == []
        assert result["sources"] == []
        assert result["has_pdf"] == {"with_pdf": 0, "without_pdf": 0}

    def test_parse_collections(self):
        response = {
            "hits": {"total": {"value": 100}},
            "aggregations": {
                "collections": {
                    "buckets": [
                        {"key": "Учебные издания", "doc_count": 50},
                        {"key": "Научные издания", "doc_count": 30},
                    ]
                }
            }
        }

        result = parse_aggregations_response(response)

        assert len(result["collections"]) == 2
        assert result["collections"][0] == {"name": "Учебные издания", "count": 50}
        assert result["collections"][1] == {"name": "Научные издания", "count": 30}

    def test_parse_has_pdf_counts(self):
        response = {
            "hits": {"total": {"value": 100}},
            "aggregations": {
                "has_pdf": {"doc_count": 75}
            }
        }

        result = parse_aggregations_response(response)

        assert result["has_pdf"]["with_pdf"] == 75
        assert result["has_pdf"]["without_pdf"] == 25

    def test_parse_full_response(self):
        response = {
            "hits": {"total": {"value": 1000}},
            "aggregations": {
                "collections": {"buckets": [{"key": "Учебники", "doc_count": 500}]},
                "knowledge_areas": {"buckets": [{"key": "Физика", "doc_count": 200}]},
                "document_types": {"buckets": [{"key": "учебник", "doc_count": 400}]},
                "languages": {"buckets": [{"key": "ru", "doc_count": 800}]},
                "sources": {"buckets": [{"key": "nsu", "doc_count": 600}]},
                "has_pdf": {"doc_count": 300}
            }
        }

        result = parse_aggregations_response(response)

        assert result["collections"] == [{"name": "Учебники", "count": 500}]
        assert result["knowledge_areas"] == [{"name": "Физика", "count": 200}]
        assert result["document_types"] == [{"name": "учебник", "count": 400}]
        assert result["languages"] == [{"name": "ru", "count": 800}]
        assert result["sources"] == [{"name": "nsu", "count": 600}]
        assert result["has_pdf"] == {"with_pdf": 300, "without_pdf": 700}

    def test_parse_missing_aggregations_key(self):
        response = {"hits": {"total": {"value": 50}}}

        result = parse_aggregations_response(response)

        assert result["collections"] == []
        assert result["has_pdf"]["with_pdf"] == 0
        assert result["has_pdf"]["without_pdf"] == 50
