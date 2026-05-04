import pytest
from backend.app.services.search_query_builder import (
    build_search_query,
    build_aggregations_query,
    parse_aggregations_response,
    SEARCH_FIELDS,
    HIGHLIGHT_FIELDS,
    ELIB_DATABASE_KEY,
    FUZZY_PREFIX_LENGTH,
    EXACT_MATCH_BOOST,
)


def _multi_match_clauses(must_clause):
    assert "bool" in must_clause, must_clause
    should = must_clause["bool"]["should"]
    assert must_clause["bool"]["minimum_should_match"] == 1
    exact = next(c for c in should if "fuzziness" not in c["multi_match"])
    fuzzy = next(c for c in should if "fuzziness" in c["multi_match"])
    return exact["multi_match"], fuzzy["multi_match"]


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
        exact, fuzzy = _multi_match_clauses(must_clause)

        assert exact["query"] == "термодинамика"
        assert exact["fields"] == SEARCH_FIELDS
        assert exact["type"] == "best_fields"
        assert exact["minimum_should_match"] == "50%"
        assert exact["boost"] == EXACT_MATCH_BOOST

        assert fuzzy["query"] == "термодинамика"
        assert fuzzy["fields"] == SEARCH_FIELDS
        assert fuzzy["fuzziness"] == "AUTO"
        assert fuzzy["prefix_length"] == FUZZY_PREFIX_LENGTH

    def test_fuzzy_branch_uses_prefix_length(self):
        result = build_search_query("Демидович")

        must_clause = result["query"]["bool"]["must"][0]
        _, fuzzy = _multi_match_clauses(must_clause)

        assert fuzzy["prefix_length"] >= 1, (
            "fuzziness without prefix_length matches very different words"
            " like Немирович/Денисович through 2 edits"
        )

    def test_exact_branch_has_no_fuzziness(self):
        result = build_search_query("Демидович")
        must_clause = result["query"]["bool"]["must"][0]
        exact, _ = _multi_match_clauses(must_clause)
        assert "fuzziness" not in exact

    def test_exact_branch_outboosts_fuzzy(self):
        result = build_search_query("Демидович")
        must_clause = result["query"]["bool"]["must"][0]
        exact, fuzzy = _multi_match_clauses(must_clause)
        assert exact["boost"] > fuzzy.get("boost", 1.0)

    def test_aggregations_query_uses_same_dual_match(self):
        result = build_aggregations_query(query="Демидович")
        exact, fuzzy = _multi_match_clauses(result["query"])
        assert exact["query"] == "Демидович"
        assert fuzzy["prefix_length"] == FUZZY_PREFIX_LENGTH

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


class TestDatabaseFilter:

    def test_single_real_database(self):
        result = build_search_query("физика", filters={"databases": ["BOOKS"]})

        clauses = result["query"]["bool"]["filter"]
        assert len(clauses) == 1
        assert clauses[0] == {
            "bool": {
                "should": [{"terms": {"database.keyword": ["BOOKS"]}}],
                "minimum_should_match": 1,
            }
        }

    def test_multiple_real_databases(self):
        result = build_search_query("физика", filters={"databases": ["BOOKS", "SERIAL"]})

        clauses = result["query"]["bool"]["filter"]
        assert clauses[0]["bool"]["should"] == [
            {"terms": {"database.keyword": ["BOOKS", "SERIAL"]}}
        ]

    def test_only_elib(self):
        result = build_search_query("физика", filters={"databases": [ELIB_DATABASE_KEY]})

        clauses = result["query"]["bool"]["filter"]
        assert clauses[0] == {
            "bool": {
                "should": [
                    {"bool": {"must_not": {"exists": {"field": "database"}}}}
                ],
                "minimum_should_match": 1,
            }
        }

    def test_mixed_real_and_elib(self):
        result = build_search_query("физика", filters={"databases": ["BOOKS", ELIB_DATABASE_KEY]})

        clauses = result["query"]["bool"]["filter"]
        should = clauses[0]["bool"]["should"]
        assert {"terms": {"database.keyword": ["BOOKS"]}} in should
        assert {"bool": {"must_not": {"exists": {"field": "database"}}}} in should
        assert clauses[0]["bool"]["minimum_should_match"] == 1

    def test_string_database_is_normalised(self):
        result = build_search_query("физика", filters={"databases": "BOOKS"})

        clauses = result["query"]["bool"]["filter"]
        assert clauses[0]["bool"]["should"] == [{"terms": {"database.keyword": ["BOOKS"]}}]

    def test_legacy_database_singular_key(self):
        result = build_search_query("физика", filters={"database": "BOOKS"})

        clauses = result["query"]["bool"]["filter"]
        assert clauses[0]["bool"]["should"] == [{"terms": {"database.keyword": ["BOOKS"]}}]

    def test_empty_databases_list_skipped(self):
        result = build_search_query("физика", filters={"databases": []})

        assert result["query"]["bool"]["filter"] == []

    def test_databases_combined_with_year_range(self):
        result = build_search_query(
            "физика",
            filters={"databases": ["BOOKS"], "year_from": 2010, "year_to": 2020},
        )

        clauses = result["query"]["bool"]["filter"]
        assert any("bool" in c and "should" in c["bool"] for c in clauses)
        assert {"range": {"year": {"gte": 2010, "lte": 2020}}} in clauses


class TestYearFilter:

    def test_year_from_only(self):
        result = build_search_query("физика", filters={"year_from": 2010})

        clauses = result["query"]["bool"]["filter"]
        assert clauses == [{"range": {"year": {"gte": 2010}}}]

    def test_year_to_only(self):
        result = build_search_query("физика", filters={"year_to": 1990})

        clauses = result["query"]["bool"]["filter"]
        assert clauses == [{"range": {"year": {"lte": 1990}}}]

    def test_year_range_both(self):
        result = build_search_query("физика", filters={"year_from": 2000, "year_to": 2024})

        clauses = result["query"]["bool"]["filter"]
        assert clauses == [{"range": {"year": {"gte": 2000, "lte": 2024}}}]

    def test_year_none_skipped(self):
        result = build_search_query("физика", filters={"year_from": None, "year_to": None})

        assert result["query"]["bool"]["filter"] == []

    def test_year_string_coerced_to_int(self):
        result = build_search_query("физика", filters={"year_from": "2010", "year_to": "2020"})

        clauses = result["query"]["bool"]["filter"]
        assert clauses == [{"range": {"year": {"gte": 2010, "lte": 2020}}}]


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
        assert "databases" in aggs
        assert "year_stats" in aggs
        assert "has_pdf" in aggs

    def test_aggregation_sizes(self):
        result = build_aggregations_query()
        aggs = result["aggs"]

        assert aggs["collections"]["terms"]["size"] == 50
        assert aggs["knowledge_areas"]["terms"]["size"] == 50
        assert aggs["document_types"]["terms"]["size"] == 30
        assert aggs["languages"]["terms"]["size"] == 20
        assert aggs["sources"]["terms"]["size"] == 10
        assert aggs["databases"]["terms"]["size"] == 20

    def test_databases_uses_missing_for_elib(self):
        result = build_aggregations_query()

        databases_agg = result["aggs"]["databases"]
        assert databases_agg["terms"]["field"] == "database.keyword"
        assert databases_agg["terms"]["missing"] == ELIB_DATABASE_KEY

    def test_year_stats_aggregation(self):
        result = build_aggregations_query()

        year_agg = result["aggs"]["year_stats"]
        assert year_agg == {"stats": {"field": "year"}}

    def test_has_pdf_is_filter_aggregation(self):
        result = build_aggregations_query()

        has_pdf_agg = result["aggs"]["has_pdf"]
        assert "filter" in has_pdf_agg
        assert has_pdf_agg["filter"] == {"exists": {"field": "pdf_url"}}

    def test_default_query_is_match_all(self):
        result = build_aggregations_query()
        assert result["query"] == {"match_all": {}}

    def test_query_passed_into_aggregations(self):
        result = build_aggregations_query(query="квантовая")

        exact, _ = _multi_match_clauses(result["query"])
        assert exact["query"] == "квантовая"

    def test_empty_query_string_falls_back_to_match_all(self):
        result = build_aggregations_query(query="")
        assert result["query"] == {"match_all": {}}


class TestContextualFacets:

    def test_aggregations_without_filters_remain_flat(self):
        result = build_aggregations_query(query="физика")
        databases = result["aggs"]["databases"]
        assert "terms" in databases
        assert "filter" not in databases

    def test_facet_excludes_its_own_filter(self):
        result = build_aggregations_query(filters={"databases": ["BOOKS"]})

        databases = result["aggs"]["databases"]
        assert "filter" not in databases
        assert "terms" in databases
        assert databases["terms"]["field"] == "database.keyword"

    def test_other_facets_apply_database_filter(self):
        result = build_aggregations_query(filters={"databases": ["BOOKS"]})

        document_types = result["aggs"]["document_types"]
        assert "filter" in document_types
        assert "aggs" in document_types
        assert "value" in document_types["aggs"]
        assert document_types["aggs"]["value"]["terms"]["field"] == "document_type"

        clauses = document_types["filter"]["bool"]["filter"]
        db_clause = next(c for c in clauses if "bool" in c)
        assert db_clause["bool"]["should"][0]["terms"]["database.keyword"] == ["BOOKS"]

    def test_year_facet_excludes_year_filters(self):
        result = build_aggregations_query(filters={"year_from": 2020, "year_to": 2024})

        year_stats = result["aggs"]["year_stats"]
        assert "filter" not in year_stats
        assert year_stats == {"stats": {"field": "year"}}

    def test_year_facet_filter_excluded_completely(self):
        result = build_aggregations_query(filters={"year_from": 2020})

        databases = result["aggs"]["databases"]
        assert "filter" in databases
        clauses = databases["filter"]["bool"]["filter"]
        assert clauses == [{"range": {"year": {"gte": 2020}}}]

    def test_has_pdf_facet_excludes_has_pdf_filter(self):
        result = build_aggregations_query(filters={"has_pdf": True})

        has_pdf = result["aggs"]["has_pdf"]
        assert has_pdf == {"filter": {"exists": {"field": "pdf_url"}}}

    def test_other_facets_apply_has_pdf(self):
        result = build_aggregations_query(filters={"has_pdf": True})

        databases = result["aggs"]["databases"]
        assert "filter" in databases
        assert databases["filter"]["bool"]["filter"] == [
            {"exists": {"field": "pdf_url"}}
        ]

    def test_combined_query_and_filters(self):
        result = build_aggregations_query(
            query="физика",
            filters={"databases": ["BOOKS"], "year_from": 2020},
        )

        exact, _ = _multi_match_clauses(result["query"])
        assert exact["query"] == "физика"

        document_types = result["aggs"]["document_types"]
        assert "filter" in document_types
        clauses = document_types["filter"]["bool"]["filter"]
        assert any(c.get("range", {}).get("year") for c in clauses)
        assert any("bool" in c for c in clauses)

    def test_legacy_database_singular_excluded_by_databases_facet(self):
        result = build_aggregations_query(filters={"database": "BOOKS"})

        databases = result["aggs"]["databases"]
        assert "filter" not in databases

    def test_document_type_facet_excludes_only_document_type(self):
        result = build_aggregations_query(
            filters={"document_type": "book", "language": "ru"}
        )

        document_types = result["aggs"]["document_types"]
        assert "filter" in document_types
        clauses = document_types["filter"]["bool"]["filter"]
        assert clauses == [{"term": {"language": "ru"}}]


class TestSortBy:

    def test_relevance_does_not_add_sort_clause(self):
        result = build_search_query("физика", sort_by="relevance")
        assert "sort" not in result

    def test_year_desc_sorts_by_year_descending(self):
        result = build_search_query("физика", sort_by="year_desc")
        assert "sort" in result
        first = result["sort"][0]
        assert first == {"year": {"order": "desc", "missing": "_last"}}
        assert "_score" in result["sort"]

    def test_year_asc_sorts_by_year_ascending(self):
        result = build_search_query("физика", sort_by="year_asc")
        assert result["sort"][0] == {"year": {"order": "asc", "missing": "_last"}}

    def test_title_asc_sorts_by_title_keyword(self):
        result = build_search_query("физика", sort_by="title_asc")
        assert result["sort"] == [
            {"title.keyword": {"order": "asc", "missing": "_last"}}
        ]

    def test_unknown_sort_falls_back_to_relevance(self):
        result = build_search_query("физика", sort_by="bogus")
        assert "sort" not in result

    def test_popularity_desc_does_not_add_sort_clause(self):
        result = build_search_query("физика", sort_by="popularity_desc")
        assert "sort" not in result


class TestParseAggregationsResponse:

    def test_parse_empty_response(self):
        response = {"hits": {"total": {"value": 0}}, "aggregations": {}}

        result = parse_aggregations_response(response)

        assert result["collections"] == []
        assert result["knowledge_areas"] == []
        assert result["document_types"] == []
        assert result["languages"] == []
        assert result["sources"] == []
        assert result["databases"] == []
        assert result["year_range"] == {"min": None, "max": None}
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
                "databases": {
                    "buckets": [
                        {"key": "BOOKS", "doc_count": 700},
                        {"key": ELIB_DATABASE_KEY, "doc_count": 300},
                    ]
                },
                "year_stats": {"min": 1900.0, "max": 2024.0},
                "has_pdf": {"doc_count": 300},
            }
        }

        result = parse_aggregations_response(response)

        assert result["collections"] == [{"name": "Учебники", "count": 500}]
        assert result["knowledge_areas"] == [{"name": "Физика", "count": 200}]
        assert result["document_types"] == [{"name": "учебник", "count": 400}]
        assert result["languages"] == [{"name": "ru", "count": 800}]
        assert result["sources"] == [{"name": "nsu", "count": 600}]
        assert result["databases"] == [
            {"name": "BOOKS", "count": 700},
            {"name": ELIB_DATABASE_KEY, "count": 300},
        ]
        assert result["year_range"] == {"min": 1900, "max": 2024}
        assert result["has_pdf"] == {"with_pdf": 300, "without_pdf": 700}

    def test_parse_year_range_floats_to_ints(self):
        response = {
            "hits": {"total": {"value": 10}},
            "aggregations": {"year_stats": {"min": 1972.5, "max": 2025.7}},
        }

        result = parse_aggregations_response(response)

        assert result["year_range"] == {"min": 1972, "max": 2025}

    def test_parse_year_range_missing_values(self):
        response = {
            "hits": {"total": {"value": 0}},
            "aggregations": {"year_stats": {"min": None, "max": None}},
        }

        result = parse_aggregations_response(response)

        assert result["year_range"] == {"min": None, "max": None}

    def test_parse_databases_buckets(self):
        response = {
            "hits": {"total": {"value": 100}},
            "aggregations": {
                "databases": {
                    "buckets": [
                        {"key": "BOOKS", "doc_count": 60},
                        {"key": "SERIAL", "doc_count": 40},
                    ]
                }
            },
        }

        result = parse_aggregations_response(response)

        assert result["databases"] == [
            {"name": "BOOKS", "count": 60},
            {"name": "SERIAL", "count": 40},
        ]

    def test_parse_missing_aggregations_key(self):
        response = {"hits": {"total": {"value": 50}}}

        result = parse_aggregations_response(response)

        assert result["collections"] == []
        assert result["databases"] == []

    def test_parse_filtered_buckets_via_value_wrapper(self):
        response = {
            "hits": {"total": {"value": 1000}},
            "aggregations": {
                "document_types": {
                    "doc_count": 700,
                    "value": {
                        "buckets": [
                            {"key": "book", "doc_count": 500},
                            {"key": "article", "doc_count": 200},
                        ]
                    },
                },
            },
        }

        result = parse_aggregations_response(response)

        assert result["document_types"] == [
            {"name": "book", "count": 500},
            {"name": "article", "count": 200},
        ]

    def test_parse_year_stats_via_value_wrapper(self):
        response = {
            "hits": {"total": {"value": 500}},
            "aggregations": {
                "year_stats": {
                    "doc_count": 300,
                    "value": {"min": 1990.0, "max": 2024.0},
                },
            },
        }

        result = parse_aggregations_response(response)

        assert result["year_range"] == {"min": 1990, "max": 2024}

    def test_parse_has_pdf_via_value_wrapper(self):
        response = {
            "hits": {"total": {"value": 1000}},
            "aggregations": {
                "has_pdf": {
                    "doc_count": 400,
                    "value": {"doc_count": 100},
                },
            },
        }

        result = parse_aggregations_response(response)

        assert result["has_pdf"] == {"with_pdf": 100, "without_pdf": 300}
