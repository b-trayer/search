
from threading import Lock
from typing import Optional
from backend.app.schemas.settings import RankingWeights, WeightPreset, WEIGHT_PRESETS


class SettingsService:
    _instance: Optional['SettingsService'] = None
    _lock: Lock = Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._weights = RankingWeights()
                    cls._instance._preset = WeightPreset.DEFAULT
                    cls._instance._state_lock = Lock()
        return cls._instance

    def get_weights(self) -> RankingWeights:
        with self._state_lock:
            return self._weights.model_copy()

    def set_weights(self, weights: RankingWeights) -> None:
        with self._state_lock:
            self._weights = weights
            self._preset = None

    def get_preset(self) -> Optional[WeightPreset]:
        with self._state_lock:
            return self._preset

    def apply_preset(self, preset: WeightPreset) -> RankingWeights:
        with self._state_lock:
            self._weights = WEIGHT_PRESETS[preset].model_copy()
            self._preset = preset
            return self._weights.model_copy()

    def reset(self) -> RankingWeights:
        return self.apply_preset(WeightPreset.DEFAULT)


settings_service = SettingsService()
