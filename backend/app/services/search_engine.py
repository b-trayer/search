import math
from typing import List, Dict, Optional, Any
from opensearchpy import OpenSearch
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.models import User
from backend.app.config import settings
import uuid

# ============================================
# Константы формулы ранжирования
# score(D,Q,U) = log(BM25(Q,D)) + w_U * f(U,D) + β * log(smoothed_CTR(D|Q))
# f(U,D) = a₁ * f_type(D,U) + a₂ * f_topic(D,U)
# ============================================

# Веса персонализации
W_USER = 1.5          # w_U - общий вес пользовательского фактора
A1_TYPE = 0.4         # a₁ - вес совпадения типа документа с ролью
A2_TOPIC = 0.6        # a₂ - вес совпадения темы со специализацией
BETA_CTR = 0.5        # β - коэффициент доверия к поведенческим данным

# Параметры Байесовского сглаживания CTR
# smoothed_CTR = (clicks + α) / (impressions + α + β_prior)
ALPHA_PRIOR = 1.0     # α - псевдо-клики (prior clicks)
BETA_PRIOR = 10.0     # β_prior - псевдо-показы (prior impressions)

# Маппинг ролей на предпочитаемые типы документов
ROLE_TYPE_PREFERENCES = {
    "student": ["учебн", "пособи", "практик"],
    "master": ["учебн", "пособи", "методич"],
    "phd": ["диссертац", "научн", "статьи", "монограф"],
    "professor": ["научн", "статьи", "монограф", "диссертац"]
}

# Маппинг специализаций на ключевые слова
SPECIALIZATION_KEYWORDS = {
    "Математика": ["математик", "алгебр", "анализ", "геометр", "топологи"],
    "Физика": ["физик", "механик", "оптик", "квант", "термодинам"],
    "Информатика": ["информатик", "программир", "алгоритм", "данных", "компьютер"],
    "История": ["истори", "археолог", "древн", "средневеков", "источник"],
    "Химия": ["хими", "органич", "неорганич", "аналитич", "биохим"],
    "Биология": ["биолог", "генетик", "экологи", "эволюц", "молекуляр"],
    "Экономика": ["экономик", "финанс", "бухгалтер", "менеджмент", "маркетинг"],
    "Философия": ["философ", "этик", "логик", "метафизик", "эпистемолог"],
    "Право": ["право", "юридич", "законодат", "судебн", "граждан"],
    "Филология": ["филолог", "лингвист", "литератур", "языкозн", "фонетик"],
    "Геология": ["геолог", "минерал", "петрограф", "тектоник", "палеонтолог"],
    "Востоковедение и африканистика": ["восток", "азия", "африк", "арабск", "китайск", "японск"],
}


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
        """
        Основной метод поиска с персонализацией.
        
        Формула: score(D,Q,U) = log(BM25(Q,D)) + w_U * f(U,D) + β * log(smoothed_CTR(D|Q))
        """
        
        user_profile = None
        if user_id and enable_personalization:
            user_profile = self._get_user_profile(user_id)
        
        # Базовый BM25 поиск
        search_body = self._build_search_query(query, filters)
        
        response = self.client.search(
            index=self.index_name,
            body=search_body,
            size=top_k * 3  # Берём больше для ре-ранжирования
        )
        
        # Применяем полную формулу ранжирования
        results = self._apply_ranking_formula(response, query, user_profile, enable_personalization)
        
        # Обрезаем до top_k
        results = results[:top_k]
        
        return {
            "query": query,
            "total": response['hits']['total']['value'],
            "results": results,
            "personalized": enable_personalization and user_profile is not None,
            "user_profile": user_profile
        }
    
    def _get_user_profile(self, user_id: int) -> Optional[Dict]:
        """Получить профиль пользователя из БД"""
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
    
    def _build_search_query(self, query: str, filters: Optional[Dict]) -> Dict:
        """Построить базовый BM25 запрос (без персонализации)"""
        
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
    
    def _apply_ranking_formula(
        self,
        response: Dict,
        query: str,
        user_profile: Optional[Dict],
        enable_personalization: bool
    ) -> List[Dict]:
        """
        Применить формулу ранжирования:
        score(D,Q,U) = log(BM25(Q,D)) + w_U * f(U,D) + β * log(smoothed_CTR(D|Q))
        
        Где f(U,D) = a₁ * f_type(D,U) + a₂ * f_topic(D,U)
        """
        
        results = []
        
        # Получаем CTR данные для всех документов в запросе
        ctr_data = self._get_batch_ctr_data(query)
        
        for i, hit in enumerate(response['hits']['hits']):
            doc = hit['_source']
            document_id = doc.get('document_id', '')
            
            # 1. Базовый BM25 скор (логарифм для нормализации)
            bm25_score = hit['_score']
            log_bm25 = math.log(1 + bm25_score)
            
            # 2. Пользовательский фактор f(U,D)
            f_user = 0.0
            f_type_score = 0.0
            f_topic_score = 0.0
            
            if enable_personalization and user_profile:
                f_type_score = self._calculate_f_type(doc, user_profile)
                f_topic_score = self._calculate_f_topic(doc, user_profile)
                f_user = A1_TYPE * f_type_score + A2_TOPIC * f_topic_score
            
            # 3. CTR фактор с Байесовским сглаживанием
            ctr_factor = 0.0
            smoothed_ctr = 0.0
            
            if document_id in ctr_data:
                clicks, impressions = ctr_data[document_id]
                smoothed_ctr = self._bayesian_smoothed_ctr(clicks, impressions)
                if smoothed_ctr > 0:
                    ctr_factor = math.log(1 + smoothed_ctr * 10)  # масштабируем для значимости
            
            # 4. Итоговый скор по формуле
            final_score = log_bm25 + W_USER * f_user + BETA_CTR * ctr_factor
            
            result = {
                "document_id": document_id,
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
                
                # Скоры для отладки и отображения
                "base_score": round(bm25_score, 3),
                "log_bm25": round(log_bm25, 3),
                "f_type": round(f_type_score, 3),
                "f_topic": round(f_topic_score, 3),
                "f_user": round(f_user, 3),
                "smoothed_ctr": round(smoothed_ctr, 4),
                "ctr_factor": round(ctr_factor, 3),
                "ctr_boost": round(1 + ctr_factor, 3),  # для совместимости с фронтом
                "final_score": round(final_score, 3),
                "position": i + 1,
                "highlights": hit.get('highlight', {})
            }
            
            results.append(result)
        
        # Сортируем по final_score
        results.sort(key=lambda x: x['final_score'], reverse=True)
        
        # Обновляем позиции
        for i, result in enumerate(results):
            result['position'] = i + 1
        
        return results
    
    def _calculate_f_type(self, doc: Dict, user_profile: Dict) -> float:
        """
        Рассчитать f_type(D,U) - совпадение типа документа с ролью пользователя.
        Возвращает значение от 0 до 1.
        """
        role = user_profile.get("role", "")
        if not role or role not in ROLE_TYPE_PREFERENCES:
            return 0.0
        
        preferred_types = ROLE_TYPE_PREFERENCES[role]
        collection = (doc.get('коллекция', '') or '').lower()
        
        # Проверяем совпадение с предпочитаемыми типами
        for i, ptype in enumerate(preferred_types):
            if ptype in collection:
                # Первый в списке = максимальный буст, далее убывает
                return 1.0 - (i * 0.2)
        
        return 0.0
    
    def _calculate_f_topic(self, doc: Dict, user_profile: Dict) -> float:
        """
        Рассчитать f_topic(D,U) - совпадение темы документа со специализацией.
        Возвращает значение от 0 до 1.
        """
        specialization = user_profile.get("specialization", "")
        interests = user_profile.get("interests", [])
        
        if not specialization and not interests:
            return 0.0
        
        # Поля документа для проверки
        subject_area = (doc.get('литература_по_отраслям_знания', '') or '').lower()
        collection = (doc.get('коллекция', '') or '').lower()
        title = (doc.get('title', '') or '').lower()
        
        doc_text = f"{subject_area} {collection} {title}"
        
        score = 0.0
        
        # Проверяем специализацию
        if specialization:
            spec_lower = specialization.lower()
            
            # Прямое совпадение
            if spec_lower in doc_text:
                score = max(score, 1.0)
            
            # Проверяем ключевые слова специализации
            keywords = SPECIALIZATION_KEYWORDS.get(specialization, [])
            for keyword in keywords:
                if keyword in doc_text:
                    score = max(score, 0.8)
                    break
        
        # Проверяем интересы
        for interest in interests:
            if interest.lower() in doc_text:
                score = max(score, 0.6)
                break
        
        return score
    
    def _bayesian_smoothed_ctr(self, clicks: int, impressions: int) -> float:
        """
        Байесовское сглаживание CTR.
        smoothed_CTR = (clicks + α) / (impressions + α + β)
        
        Это решает проблему cold start для новых документов:
        - Документ с 0 кликов из 0 показов получает prior CTR ≈ α/(α+β) ≈ 0.09
        - Документ с 1 кликом из 1 показа получает (1+1)/(1+1+10) ≈ 0.17, а не 100%
        """
        return (clicks + ALPHA_PRIOR) / (impressions + ALPHA_PRIOR + BETA_PRIOR)
    
    def _get_batch_ctr_data(self, query: str) -> Dict[str, tuple]:
        """Получить CTR данные для запроса (batch для эффективности)"""
        ctr_data = {}
        
        try:
            # Пытаемся получить агрегированные данные
            result = self.db.execute(
                text("""
                    SELECT document_id, 
                           COALESCE(SUM(clicks), 0) as clicks,
                           COALESCE(SUM(impressions), 0) as impressions
                    FROM ctr_stats 
                    WHERE query_text = :query
                    GROUP BY document_id
                """),
                {"query": query}
            ).fetchall()
            
            for row in result:
                ctr_data[row[0]] = (int(row[1]), int(row[2]))
        except Exception as e:
            # Если таблицы нет или ошибка - возвращаем пустой dict
            pass
        
        return ctr_data
    
    def _get_global_ctr_prior(self) -> tuple:
        """
        Получить глобальный prior CTR (средний по всем документам).
        Используется для новых запросов.
        """
        try:
            result = self.db.execute(
                text("""
                    SELECT 
                        COALESCE(AVG(clicks::float / NULLIF(impressions, 0)), 0.1) as avg_ctr,
                        COALESCE(AVG(impressions), 10) as avg_impressions
                    FROM ctr_stats
                """)
            ).fetchone()
            
            if result:
                return (result[0], result[1])
        except:
            pass
        
        return (0.1, 10)  # default prior
    
    def register_click(
        self,
        query: str,
        user_id: int,
        document_id: str,
        position: int,
        session_id: Optional[str] = None,
        dwell_time: Optional[int] = None
    ):
        """Зарегистрировать клик пользователя"""
        from backend.app.models import Click, SearchQuery, Impression
        
        if not session_id:
            session_id = str(uuid.uuid4())
        
        # Найти или создать поисковый запрос
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
        
        # Записать клик
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
        
        # Записать impression (если ещё нет)
        try:
            existing_impression = self.db.execute(
                text("""
                    SELECT 1 FROM impressions 
                    WHERE query_text = :query AND document_id = :doc_id AND session_id = :session
                """),
                {"query": query, "doc_id": document_id, "session": session_id}
            ).fetchone()
            
            if not existing_impression:
                self.db.execute(
                    text("""
                        INSERT INTO impressions (query_text, document_id, user_id, position, session_id)
                        VALUES (:query, :doc_id, :user_id, :position, :session)
                    """),
                    {
                        "query": query, 
                        "doc_id": document_id, 
                        "user_id": user_id,
                        "position": position,
                        "session": session_id
                    }
                )
        except:
            pass
        
        self.db.commit()
        
        # Обновить материализованное представление CTR
        try:
            self.db.execute(text("REFRESH MATERIALIZED VIEW ctr_stats"))
            self.db.commit()
        except:
            pass
    
    def register_impressions(
        self,
        query: str,
        user_id: int,
        document_ids: List[str],
        session_id: Optional[str] = None
    ):
        """
        Зарегистрировать показы (impressions) для расчёта CTR.
        Вызывается при каждом поисковом запросе.
        """
        if not session_id:
            session_id = str(uuid.uuid4())
        
        try:
            for position, doc_id in enumerate(document_ids, 1):
                self.db.execute(
                    text("""
                        INSERT INTO impressions (query_text, document_id, user_id, position, session_id)
                        VALUES (:query, :doc_id, :user_id, :position, :session)
                        ON CONFLICT DO NOTHING
                    """),
                    {
                        "query": query,
                        "doc_id": doc_id,
                        "user_id": user_id,
                        "position": position,
                        "session": session_id
                    }
                )
            self.db.commit()
        except:
            pass
