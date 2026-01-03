
from typing import Dict, List, Any, Optional

from sqlalchemy import select, distinct, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models import Document


class AsyncFilterService:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_filter_options(self) -> Dict[str, Any]:
        return {
            "document_types": await self._get_document_types(),
            "subjects": await self._get_subjects(),
            "languages": await self._get_languages(),
            "year_range": await self._get_year_range(),
        }

    async def _get_document_types(self) -> List[str]:
        stmt = (
            select(distinct(Document.document_type))
            .where(Document.document_type.isnot(None))
        )
        result = await self.db.execute(stmt)
        return [r[0] for r in result.fetchall() if r[0]]

    async def _get_subjects(self) -> List[str]:
        stmt = (
            select(distinct(Document.subject))
            .where(Document.subject.isnot(None))
        )
        result = await self.db.execute(stmt)
        return sorted([r[0] for r in result.fetchall() if r[0]])

    async def _get_languages(self) -> List[str]:
        stmt = (
            select(distinct(Document.language))
            .where(Document.language.isnot(None))
        )
        result = await self.db.execute(stmt)
        return [r[0] for r in result.fetchall() if r[0]]

    async def _get_year_range(self) -> Dict[str, Optional[int]]:
        stmt = select(
            func.min(Document.year).label("min_year"),
            func.max(Document.year).label("max_year")
        ).where(Document.year.isnot(None))

        result = await self.db.execute(stmt)
        row = result.fetchone()

        if row:
            return {"min": row.min_year, "max": row.max_year}
        return {"min": None, "max": None}
