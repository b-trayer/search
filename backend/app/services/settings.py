
from typing import Optional
from backend.app.schemas.settings import RankingWeights, WeightPreset, WEIGHT_PRESETS


class SettingsService:

    _instance: Optional['SettingsService'] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._weights = RankingWeights()
            cls._instance._preset = WeightPreset.DEFAULT
        return cls._instance

    def get_weights(self) -> RankingWeights:
        return self._weights

    def set_weights(self, weights: RankingWeights) -> None:
        self._weights = weights
        self._preset = None

    def get_preset(self) -> Optional[WeightPreset]:
        return self._preset

    def apply_preset(self, preset: WeightPreset) -> RankingWeights:
        self._weights = WEIGHT_PRESETS[preset].model_copy()
        self._preset = preset
        return self._weights

    def reset(self) -> RankingWeights:
        return self.apply_preset(WeightPreset.DEFAULT)


settings_service = SettingsService()
