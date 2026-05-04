
from threading import Lock
from typing import Dict, List, Optional, Union
from backend.app.schemas.settings import RankingWeights, WeightPreset, WEIGHT_PRESETS


PresetIdentifier = Union[WeightPreset, str]


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
                    cls._instance._custom_presets: Dict[str, RankingWeights] = {}
                    cls._instance._state_lock = Lock()
        return cls._instance

    def get_weights(self) -> RankingWeights:
        with self._state_lock:
            return self._weights.model_copy()

    def set_weights(self, weights: RankingWeights) -> None:
        with self._state_lock:
            self._weights = weights
            self._preset = None

    def get_preset(self) -> Optional[str]:
        with self._state_lock:
            preset = self._preset
            if preset is None:
                return None
            return preset.value if isinstance(preset, WeightPreset) else preset

    def apply_preset(self, preset: PresetIdentifier) -> RankingWeights:
        with self._state_lock:
            if isinstance(preset, WeightPreset):
                self._weights = WEIGHT_PRESETS[preset].model_copy()
                self._preset = preset
                return self._weights.model_copy()

            try:
                builtin = WeightPreset(preset)
                self._weights = WEIGHT_PRESETS[builtin].model_copy()
                self._preset = builtin
                return self._weights.model_copy()
            except ValueError:
                pass

            if preset in self._custom_presets:
                self._weights = self._custom_presets[preset].model_copy()
                self._preset = preset
                return self._weights.model_copy()

            raise KeyError(preset)

    def reset(self) -> RankingWeights:
        return self.apply_preset(WeightPreset.DEFAULT)

    def list_custom_presets(self) -> Dict[str, RankingWeights]:
        with self._state_lock:
            return {name: w.model_copy() for name, w in self._custom_presets.items()}

    def save_custom_preset(self, name: str, weights: RankingWeights) -> RankingWeights:
        clean = name.strip()
        if not clean:
            raise ValueError("Empty preset name")
        if len(clean) > 50:
            raise ValueError("Preset name too long")
        try:
            WeightPreset(clean)
            raise ValueError("Reserved preset name")
        except ValueError as exc:
            if str(exc) == "Reserved preset name":
                raise
        with self._state_lock:
            self._custom_presets[clean] = weights.model_copy()
            return self._custom_presets[clean].model_copy()

    def delete_custom_preset(self, name: str) -> None:
        with self._state_lock:
            if name not in self._custom_presets:
                raise KeyError(name)
            del self._custom_presets[name]
            if isinstance(self._preset, str) and self._preset == name:
                self._preset = None


settings_service = SettingsService()
