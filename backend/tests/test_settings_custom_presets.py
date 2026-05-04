import pytest

from backend.app.services.settings import SettingsService
from backend.app.schemas.settings import RankingWeights, WeightPreset


class TestCustomPresets:

    def setup_method(self):
        SettingsService._instance = None

    def test_save_custom_preset_returns_copy(self):
        service = SettingsService()
        weights = RankingWeights(w_user=2.5)
        saved = service.save_custom_preset("my-custom", weights)
        assert saved.w_user == 2.5
        assert saved is not weights

    def test_list_custom_presets(self):
        service = SettingsService()
        service.save_custom_preset("first", RankingWeights(w_user=1.0))
        service.save_custom_preset("second", RankingWeights(w_user=2.0))
        listed = service.list_custom_presets()
        assert set(listed.keys()) == {"first", "second"}
        assert listed["first"].w_user == 1.0
        assert listed["second"].w_user == 2.0

    def test_apply_custom_preset(self):
        service = SettingsService()
        service.save_custom_preset("focused", RankingWeights(w_user=4.0))
        applied = service.apply_preset("focused")
        assert applied.w_user == 4.0
        assert service.get_preset() == "focused"

    def test_apply_builtin_via_string(self):
        service = SettingsService()
        applied = service.apply_preset("high_ctr")
        assert service.get_preset() == "high_ctr"
        assert applied.beta_ctr == 2.0

    def test_apply_unknown_preset_raises(self):
        service = SettingsService()
        with pytest.raises(KeyError):
            service.apply_preset("does-not-exist")

    def test_save_rejects_empty_name(self):
        service = SettingsService()
        with pytest.raises(ValueError):
            service.save_custom_preset("   ", RankingWeights())

    def test_save_rejects_reserved_name(self):
        service = SettingsService()
        with pytest.raises(ValueError):
            service.save_custom_preset("default", RankingWeights())

    def test_save_rejects_too_long_name(self):
        service = SettingsService()
        with pytest.raises(ValueError):
            service.save_custom_preset("x" * 51, RankingWeights())

    def test_delete_custom_preset(self):
        service = SettingsService()
        service.save_custom_preset("temp", RankingWeights())
        service.delete_custom_preset("temp")
        assert "temp" not in service.list_custom_presets()

    def test_delete_unknown_raises(self):
        service = SettingsService()
        with pytest.raises(KeyError):
            service.delete_custom_preset("nope")

    def test_delete_active_custom_preset_clears_pointer(self):
        service = SettingsService()
        service.save_custom_preset("active", RankingWeights())
        service.apply_preset("active")
        service.delete_custom_preset("active")
        assert service.get_preset() is None

    def test_save_custom_preset_overwrites(self):
        service = SettingsService()
        service.save_custom_preset("foo", RankingWeights(w_user=1.0))
        service.save_custom_preset("foo", RankingWeights(w_user=3.0))
        assert service.list_custom_presets()["foo"].w_user == 3.0
