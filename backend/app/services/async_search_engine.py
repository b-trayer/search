import logging
from typing import List, Dict, Optional, Any

from opensearchpy import AsyncOpenSearch
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models import User
from backend.app.config import settings
from backend.app.services.ranking import apply_ranking_formula
from backend.app.services.search_query_builder import build_search_query, build_aggregations_query, parse_aggregations_response
from backend.app.services.ctr import get_batch_ctr_data, get_aggregated_ctr_data, register_click as ctr_register_click, register_impressions as ctr_register_impressions, CTRServiceError

logger = logging.getLogger(__name__)


class AsyncSearchEngine:

    def __init__(self, db: AsyncSession, client: AsyncOpenSearch):
        self.db = db
        self.client = client
        self.index_name = settings.opensearch_index

    async def search(self, query: str, user_id: Optional[int] = None, page: int = 1, per_page: int = 20,
                     enable_personalization: bool = True, filters: Optional[Dict] = None, search_field: str = "all") -> Dict[str, Any]:
        user_profile = await self._get_user_profile(user_id) if user_id and enable_personalization else None
        search_body = build_search_query(query, filters, search_field)
        response = await self.client.search(index=self.index_name, body=search_body, size=page * per_page, request_timeout=30)

        try:
            ctr_data = await get_batch_ctr_data(self.db, query)
        except CTRServiceError as e:
            logger.warning(f"CTR data unavailable: {e}")
            ctr_data = {}

        all_results = apply_ranking_formula(response['hits']['hits'], ctr_data, user_profile, enable_personalization)
        total = response['hits']['total']['value']
        start_idx, end_idx = (page - 1) * per_page, page * per_page
        page_results = all_results[start_idx:end_idx]
        await self._enrich_with_aggregated_ctr(page_results)

        return {"query": query, "total": total, "page": page, "per_page": per_page,
                "total_pages": (total + per_page - 1) // per_page, "results": page_results,
                "personalized": enable_personalization and user_profile is not None, "user_profile": user_profile}

    async def _enrich_with_aggregated_ctr(self, results: List[Dict]) -> None:
        document_ids = [r['document_id'] for r in results]
        try:
            aggregated_ctr = await get_aggregated_ctr_data(self.db, document_ids)
        except CTRServiceError as e:
            logger.warning(f"Aggregated CTR data unavailable: {e}")
            return
        for result in results:
            if result['document_id'] in aggregated_ctr:
                clicks, impressions = aggregated_ctr[result['document_id']]
                result['impressions'], result['clicks'] = impressions, clicks
                if impressions > 0:
                    result['display_ctr'] = clicks / impressions

    async def _get_user_profile(self, user_id: int) -> Optional[Dict]:
        result = await self.db.execute(select(User).where(User.user_id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return None
        return {"user_id": user.user_id, "username": user.username, "role": user.role,
                "specialization": user.specialization, "faculty": getattr(user, 'faculty', None),
                "course": user.course, "interests": user.interests or []}

    async def register_click(self, query: str, user_id: Optional[int], document_id: str, position: int,
                             session_id: Optional[str] = None, dwell_time: Optional[int] = None) -> None:
        await ctr_register_click(self.db, query, document_id, user_id, position, session_id, dwell_time)

    async def register_impressions(self, query: str, user_id: int, document_ids: List[str], session_id: Optional[str] = None) -> None:
        await ctr_register_impressions(self.db, query, user_id, document_ids, session_id)

    async def get_filter_options(self) -> Dict[str, Any]:
        response = await self.client.search(index=self.index_name, body=build_aggregations_query(), request_timeout=10)
        return parse_aggregations_response(response)
