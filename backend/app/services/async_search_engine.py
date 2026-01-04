
from typing import List, Dict, Optional, Any

from opensearchpy._async.client import AsyncOpenSearch
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models import User
from backend.app.config import settings
from backend.app.services.ranking import apply_ranking_formula
from backend.app.services.async_ctr import (
    get_batch_ctr_data,
    get_aggregated_ctr_data,
    register_click as ctr_register_click,
    register_impressions as ctr_register_impressions,
)


_opensearch_client: Optional[AsyncOpenSearch] = None


def get_opensearch_client() -> AsyncOpenSearch:
    global _opensearch_client
    if _opensearch_client is None:
        _opensearch_client = AsyncOpenSearch(
            hosts=[{'host': settings.opensearch_host, 'port': settings.opensearch_port}],
            http_compress=True,
            use_ssl=False,
            verify_certs=False,
            timeout=30,
        )
    return _opensearch_client


async def close_opensearch_client() -> None:
    global _opensearch_client
    if _opensearch_client is not None:
        await _opensearch_client.close()
        _opensearch_client = None


class AsyncSearchEngine:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.client = get_opensearch_client()
        self.index_name = settings.opensearch_index

    async def search(
        self,
        query: str,
        user_id: Optional[int] = None,
        page: int = 1,
        per_page: int = 20,
        enable_personalization: bool = True,
        filters: Optional[Dict] = None
    ) -> Dict[str, Any]:
        user_profile = None
        if user_id and enable_personalization:
            user_profile = await self._get_user_profile(user_id)

        search_body = self._build_search_query(query, filters)

        fetch_size = (page + 1) * per_page

        response = await self.client.search(
            index=self.index_name,
            body=search_body,
            size=fetch_size,
            request_timeout=30,
        )

        ctr_data = await get_batch_ctr_data(self.db, query)

        all_results = apply_ranking_formula(
            response['hits']['hits'],
            ctr_data,
            user_profile,
            enable_personalization
        )

        total = response['hits']['total']['value']
        total_pages = (total + per_page - 1) // per_page

        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        page_results = all_results[start_idx:end_idx]

        document_ids = [r['document_id'] for r in page_results]
        aggregated_ctr = await get_aggregated_ctr_data(self.db, document_ids)

        for result in page_results:
            doc_id = result['document_id']
            if doc_id in aggregated_ctr:
                clicks, impressions = aggregated_ctr[doc_id]
                result['impressions'] = impressions
                result['clicks'] = clicks
                if impressions > 0:
                    result['display_ctr'] = clicks / impressions

        return {
            "query": query,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
            "results": page_results,
            "personalized": enable_personalization and user_profile is not None,
            "user_profile": user_profile
        }

    async def _get_user_profile(self, user_id: int) -> Optional[Dict]:
        stmt = select(User).where(User.user_id == user_id)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            return None

        return {
            "user_id": user.user_id,
            "username": user.username,
            "role": user.role,
            "specialization": user.specialization,
            "faculty": getattr(user, 'faculty', None),
            "course": user.course,
            "interests": user.interests or []
        }

    def _build_search_query(self, query: str, filters: Optional[Dict]) -> Dict:
        must_clauses = [{
            "multi_match": {
                "query": query,
                "fields": [
                    "title^3",
                    "authors^2",
                    "subjects^2",
                    "collection^1.5",
                    "knowledge_area^1.5",
                    "organization",
                    "publication_info"
                ],
                "fuzziness": "AUTO",
                "type": "best_fields",
                "operator": "or",
                "minimum_should_match": "50%"
            }
        }]

        filter_clauses = []
        if filters:
            if filters.get("collection"):
                filter_clauses.append({"term": {"collection.keyword": filters["collection"]}})
            if filters.get("language"):
                filter_clauses.append({"term": {"language": filters["language"]}})
            if filters.get("document_type"):
                doc_types = filters["document_type"]
                if isinstance(doc_types, list):
                    filter_clauses.append({"terms": {"document_type": doc_types}})
                else:
                    filter_clauses.append({"term": {"document_type": doc_types}})
            if filters.get("knowledge_area"):
                filter_clauses.append({"term": {"knowledge_area.keyword": filters["knowledge_area"]}})
            if filters.get("source"):
                filter_clauses.append({"term": {"source": filters["source"]}})
            if filters.get("has_pdf") is True:
                filter_clauses.append({"exists": {"field": "pdf_url"}})
            elif filters.get("has_pdf") is False:
                filter_clauses.append({"bool": {"must_not": {"exists": {"field": "pdf_url"}}}})

        return {
            "track_total_hits": True,
            "query": {
                "bool": {
                    "must": must_clauses,
                    "filter": filter_clauses
                }
            },
            "highlight": {
                "fields": {
                    "title": {},
                    "authors": {},
                    "subjects": {},
                    "collection": {}
                },
                "pre_tags": ["<mark>"],
                "post_tags": ["</mark>"]
            }
        }

    async def register_click(
        self,
        query: str,
        user_id: Optional[int],
        document_id: str,
        position: int,
        session_id: Optional[str] = None,
        dwell_time: Optional[int] = None
    ) -> None:
        await ctr_register_click(
            self.db, query, document_id, user_id, position, session_id, dwell_time
        )

    async def register_impressions(
        self,
        query: str,
        user_id: int,
        document_ids: List[str],
        session_id: Optional[str] = None
    ) -> None:
        await ctr_register_impressions(self.db, query, user_id, document_ids, session_id)

    async def get_filter_options(self) -> Dict[str, Any]:
        agg_body = {
            "size": 0,
            "aggs": {
                "collections": {
                    "terms": {"field": "collection.keyword", "size": 50}
                },
                "knowledge_areas": {
                    "terms": {"field": "knowledge_area.keyword", "size": 50}
                },
                "document_types": {
                    "terms": {"field": "document_type", "size": 30}
                },
                "languages": {
                    "terms": {"field": "language", "size": 20}
                },
                "sources": {
                    "terms": {"field": "source", "size": 10}
                },
                "has_pdf": {
                    "filter": {"exists": {"field": "pdf_url"}}
                }
            }
        }

        response = await self.client.search(
            index=self.index_name,
            body=agg_body,
            request_timeout=10,
        )

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
