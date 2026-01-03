
from typing import List, Dict, Optional, Any

from opensearchpy._async.client import AsyncOpenSearch
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models import User
from backend.app.config import settings
from backend.app.services.ranking import apply_ranking_formula
from backend.app.services.async_ctr import (
    get_batch_ctr_data,
    register_click as ctr_register_click,
    register_impressions as ctr_register_impressions,
)


class AsyncSearchEngine:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.client = AsyncOpenSearch(
            hosts=[{'host': settings.opensearch_host, 'port': settings.opensearch_port}],
            http_compress=True,
            use_ssl=False,
            verify_certs=False
        )
        self.index_name = settings.opensearch_index

    async def search(
        self,
        query: str,
        user_id: Optional[int] = None,
        top_k: int = 10,
        enable_personalization: bool = True,
        filters: Optional[Dict] = None
    ) -> Dict[str, Any]:
        user_profile = None
        if user_id and enable_personalization:
            user_profile = await self._get_user_profile(user_id)

        search_body = self._build_search_query(query, filters)

        response = await self.client.search(
            index=self.index_name,
            body=search_body,
            size=top_k * 3
        )

        ctr_data = await get_batch_ctr_data(self.db, query)

        results = apply_ranking_formula(
            response['hits']['hits'],
            ctr_data,
            user_profile,
            enable_personalization
        )

        return {
            "query": query,
            "total": response['hits']['total']['value'],
            "results": results[:top_k],
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
                    "авторы^2",
                    "другие_авторы^1.5",
                    "литература_по_отраслям_знания^2",
                    "коллекция^1.5",
                    "организация",
                    "выходные_сведения"
                ],
                "fuzziness": "AUTO",
                "type": "best_fields",
                "operator": "or",
                "minimum_should_match": "50%"
            }
        }]

        filter_clauses = []
        if filters:
            if filters.get("коллекция"):
                filter_clauses.append({"match": {"коллекция": filters["коллекция"]}})
            if filters.get("язык"):
                filter_clauses.append({"match": {"язык": filters["язык"]}})

        return {
            "query": {
                "bool": {
                    "must": must_clauses,
                    "filter": filter_clauses
                }
            },
            "highlight": {
                "fields": {
                    "title": {},
                    "авторы": {},
                    "литература_по_отраслям_знания": {},
                    "коллекция": {}
                },
                "pre_tags": ["<mark>"],
                "post_tags": ["</mark>"]
            }
        }

    async def register_click(
        self,
        query: str,
        user_id: int,
        document_id: str,
        position: int,
        session_id: Optional[str] = None,
        dwell_time: Optional[int] = None
    ) -> None:
        await ctr_register_click(
            self.db, query, user_id, document_id, position, session_id, dwell_time
        )

    async def register_impressions(
        self,
        query: str,
        user_id: int,
        document_ids: List[str],
        session_id: Optional[str] = None
    ) -> None:
        await ctr_register_impressions(self.db, query, user_id, document_ids, session_id)

    async def close(self) -> None:
        await self.client.close()
