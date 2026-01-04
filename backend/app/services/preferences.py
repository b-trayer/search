
from threading import Lock
from typing import Dict, List, Optional
from copy import deepcopy

DEFAULT_ROLE_TYPE_MATRIX: Dict[str, Dict[str, float]] = {
    "student": {
        "textbook": 0.50,
        "tutorial": 0.25,
        "monograph": 0.10,
        "dissertation": 0.05,
        "article": 0.10,
    },
    "master": {
        "textbook": 0.30,
        "tutorial": 0.20,
        "monograph": 0.20,
        "dissertation": 0.15,
        "article": 0.15,
    },
    "phd": {
        "textbook": 0.10,
        "tutorial": 0.05,
        "monograph": 0.25,
        "dissertation": 0.35,
        "article": 0.25,
    },
    "professor": {
        "textbook": 0.10,
        "tutorial": 0.05,
        "monograph": 0.30,
        "dissertation": 0.25,
        "article": 0.30,
    },
}

DEFAULT_TOPIC_SCORES: Dict[str, float] = {
    "direct_match": 1.0,
    "keyword_match": 0.8,
    "interest_match": 0.6,
}


class PreferencesService:
    _instance: Optional['PreferencesService'] = None
    _lock: Lock = Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._role_type_matrix = deepcopy(DEFAULT_ROLE_TYPE_MATRIX)
                    cls._instance._topic_scores = deepcopy(DEFAULT_TOPIC_SCORES)
                    cls._instance._state_lock = Lock()
        return cls._instance

    def get_role_type_matrix(self) -> Dict[str, Dict[str, float]]:
        with self._state_lock:
            return deepcopy(self._role_type_matrix)

    def set_role_type_matrix(self, matrix: Dict[str, Dict[str, float]]) -> None:
        with self._state_lock:
            self._role_type_matrix = deepcopy(matrix)

    def get_topic_scores(self) -> Dict[str, float]:
        with self._state_lock:
            return deepcopy(self._topic_scores)

    def set_topic_scores(self, scores: Dict[str, float]) -> None:
        with self._state_lock:
            self._topic_scores = deepcopy(scores)

    def reset(self) -> None:
        with self._state_lock:
            self._role_type_matrix = deepcopy(DEFAULT_ROLE_TYPE_MATRIX)
            self._topic_scores = deepcopy(DEFAULT_TOPIC_SCORES)

    def get_f_type(self, doc_type: str, user_role: str) -> float:
        with self._state_lock:
            return self._role_type_matrix.get(user_role, {}).get(doc_type, 0.0)

    def get_topic_score(self, match_type: str) -> float:
        with self._state_lock:
            return self._topic_scores.get(match_type, 0.0)


preferences_service = PreferencesService()
