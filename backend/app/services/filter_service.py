
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models import Document


class FilterService:

    def __init__(self, db: Session):
        self.db = db

    def get_filter_options(self) -> Dict[str, Any]:
        return {
            "document_types": self._get_document_types(),
            "subjects": self._get_subjects(),
            "languages": self._get_languages(),
            "year_range": self._get_year_range(),
        }

    def _get_document_types(self) -> List[str]:
        results = (
            self.db.query(Document.document_type)
            .distinct()
            .filter(Document.document_type.isnot(None))
            .all()
        )
        return [r[0] for r in results if r[0]]

    def _get_subjects(self) -> List[str]:
        results = (
            self.db.query(Document.subject)
            .distinct()
            .filter(Document.subject.isnot(None))
            .all()
        )
        return sorted([r[0] for r in results if r[0]])

    def _get_languages(self) -> List[str]:
        results = (
            self.db.query(Document.language)
            .distinct()
            .filter(Document.language.isnot(None))
            .all()
        )
        return [r[0] for r in results if r[0]]

    def _get_year_range(self) -> Dict[str, Optional[int]]:
        results = (
            self.db.query(Document.year)
            .distinct()
            .filter(Document.year.isnot(None))
            .order_by(Document.year)
            .all()
        )
        years = [r[0] for r in results if r[0]]

        return {
            "min": min(years) if years else None,
            "max": max(years) if years else None,
        }
