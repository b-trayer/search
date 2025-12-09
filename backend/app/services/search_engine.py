import math
from typing import List, Dict, Optional, Any
from opensearchpy import OpenSearch
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.models import User
from backend.app.config import settings
import uuid

class SearchEngine:
    def __init__(self, db: Session):
        self.db = db
        self.client = OpenSearch(
            hosts=[{'host': settings.opensearch_host, 'port': settings.opensearch_port}],
            http_compress=True,
            use_ssl=False,
            verify_certs=False
        )
        self.index_name = settings.opensearch_index
    
    def search(
        self,
        query: str,
        user_id: Optional[int] = None,
        top_k: int = 10,
        enable_personalization: bool = True,
        filters: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Основной метод поиска с персонализацией"""
        
        user_profile = None
        if user_id and enable_personalization:
            user_profile = self._get_user_profile(user_id)
        
        search_body = self._build_search_query(query, user_profile, filters)
        
        response = self.client.search(
            index=self.index_name,
            body=search_body,
            size=top_k
        )
        
        results = self._process_results(response, query, user_profile)
        
        return {
            "query": query,
            "total": response['hits']['total']['value'],
            "results": results,
            "personalized": enable_personalization and user_profile is not None,
            "user_profile": user_profile
        }
    
    def _get_user_profile(self, user_id: int) -> Optional[Dict]:
        user = self.db.query(User).filter(User.user_id == user_id).first()
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
    
    def _build_search_query(
        self,
        query: str,
        user_profile: Optional[Dict],
        filters: Optional[Dict]
    ) -> Dict:
        
        # Поиск по всем текстовым полям (русские названия полей)
        must_clauses = [{
            "multi_match": {
                "query": query,
                "fields": [
                    "title^3",
                    "авторы^2",
                    "другие_авторы^2",
                    "литература_по_отраслям_знания^1.5",
                    "коллекция",
                    "организация",
                    "выходные_сведения"
                ],
                "fuzziness": "AUTO",
                "type": "best_fields"
            }
        }]
        
        filter_clauses = []
        if filters:
            if filters.get("коллекция"):
                filter_clauses.append({"match": {"коллекция": filters["коллекция"]}})
            if filters.get("язык"):
                filter_clauses.append({"match": {"язык": filters["язык"]}})
        
        search_body = {
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
        
        if user_profile:
            search_body = self._add_personalization(search_body, user_profile)
        
        return search_body
    
    def _add_personalization(self, search_body: Dict, user_profile: Dict) -> Dict:
        """Добавить персонализацию через function_score"""
        
        functions = []
        
        # Буст по специализации пользователя
        specialization = user_profile.get("specialization", "")
        if specialization:
            # Ищем совпадение в литература_по_отраслям_знания
            functions.append({
                "filter": {"match": {"литература_по_отраслям_знания": specialization}},
                "weight": 2.0
            })
            # И в коллекции
            functions.append({
                "filter": {"match": {"коллекция": specialization}},
                "weight": 1.5
            })
        
        # Буст по интересам
        interests = user_profile.get("interests", [])
        for interest in interests[:3]:
            functions.append({
                "filter": {
                    "multi_match": {
                        "query": interest,
                        "fields": ["title", "литература_по_отраслям_знания", "коллекция"]
                    }
                },
                "weight": 1.3
            })
        
        # Буст по роли (студенты - учебники, аспиранты - научные работы)
        role = user_profile.get("role", "")
        if role in ["student", "master"]:
            functions.append({
                "filter": {"match": {"коллекция": "учебн"}},
                "weight": 1.5
            })
        elif role in ["phd", "professor"]:
            functions.append({
                "filter": {"match": {"коллекция": "научн"}},
                "weight": 1.5
            })
            functions.append({
                "filter": {"match": {"коллекция": "диссертаци"}},
                "weight": 1.8
            })
        
        if not functions:
            return search_body
        
        return {
            "query": {
                "function_score": {
                    "query": search_body["query"],
                    "functions": functions,
                    "score_mode": "sum",
                    "boost_mode": "multiply"
                }
            },
            "highlight": search_body.get("highlight", {})
        }
    
    def _process_results(
        self,
        response: Dict,
        query: str,
        user_profile: Optional[Dict]
    ) -> List[Dict]:
        
        results = []
        
        for i, hit in enumerate(response['hits']['hits']):
            doc = hit['_source']
            base_score = hit['_score']
            ctr_boost = self._get_ctr_boost(query, doc.get('document_id', ''))
            final_score = base_score * ctr_boost
            
            result = {
                "document_id": doc.get('document_id', ''),
                "title": doc.get('title', 'Без названия'),
                "authors": doc.get('авторы', doc.get('другие_авторы', '')),
                "url": doc.get('url', ''),
                "cover": doc.get('cover', ''),
                "collection": doc.get('коллекция', ''),
                "subject_area": doc.get('литература_по_отраслям_знания', ''),
                "organization": doc.get('организация', ''),
                "publication_info": doc.get('выходные_сведения', ''),
                "language": doc.get('язык', ''),
                "source": doc.get('source', ''),
                "base_score": round(base_score, 3),
                "ctr_boost": round(ctr_boost, 3),
                "final_score": round(final_score, 3),
                "position": i + 1,
                "highlights": hit.get('highlight', {})
            }
            
            results.append(result)
        
        results.sort(key=lambda x: x['final_score'], reverse=True)
        
        for i, result in enumerate(results):
            result['position'] = i + 1
        
        return results
    
    def _get_ctr_boost(self, query: str, document_id: str) -> float:
        if not document_id:
            return 1.0
        
        try:
            result = self.db.execute(
                text("SELECT ctr FROM ctr_stats WHERE query_text = :query AND document_id = :doc_id"),
                {"query": query, "doc_id": document_id}
            ).fetchone()
            
            if result and result[0] > 0:
                ctr = result[0]
                return 1 + math.log(1 + ctr * 2.0)
        except:
            pass
        
        return 1.0
    
    def register_click(
        self,
        query: str,
        user_id: int,
        document_id: str,
        position: int,
        session_id: Optional[str] = None,
        dwell_time: Optional[int] = None
    ):
        from backend.app.models import Click, SearchQuery
        
        if not session_id:
            session_id = str(uuid.uuid4())
        
        query_obj = self.db.query(SearchQuery).filter(
            SearchQuery.query_text == query,
            SearchQuery.session_id == session_id
        ).first()
        
        if not query_obj:
            query_obj = SearchQuery(
                user_id=user_id,
                query_text=query,
                session_id=session_id
            )
            self.db.add(query_obj)
            self.db.flush()
        
        click = Click(
            query_id=query_obj.query_id,
            user_id=user_id,
            document_id=document_id,
            query_text=query,
            position=position,
            session_id=session_id,
            dwell_time=dwell_time
        )
        
        self.db.add(click)
        self.db.commit()
        
        try:
            self.db.execute(text("REFRESH MATERIALIZED VIEW ctr_stats"))
            self.db.commit()
        except:
            pass
