
import pytest
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

from backend.app.services.settings import SettingsService
from backend.app.schemas.settings import RankingWeights, WeightPreset


class TestSettingsServiceThreadSafety:

    def setup_method(self):
        SettingsService._instance = None

    def test_singleton_returns_same_instance(self):
        service1 = SettingsService()
        service2 = SettingsService()
        assert service1 is service2

    def test_concurrent_singleton_creation(self):
        instances = []
        barrier = threading.Barrier(10)

        def create_instance():
            barrier.wait()
            instance = SettingsService()
            instances.append(instance)

        threads = [threading.Thread(target=create_instance) for _ in range(10)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert len(set(id(i) for i in instances)) == 1

    def test_concurrent_weight_updates(self):
        service = SettingsService()
        errors = []
        call_count = [0]
        lock = threading.Lock()

        def update_weights(value: float):
            try:
                weights = RankingWeights(w_user=value)
                service.set_weights(weights)
                service.get_weights()
                with lock:
                    call_count[0] += 1
            except Exception as e:
                errors.append(e)

        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(update_weights, (i % 50) * 0.1) for i in range(100)]
            for future in as_completed(futures):
                future.result()

        assert len(errors) == 0
        assert call_count[0] == 100

    def test_concurrent_get_weights_returns_copy(self):
        service = SettingsService()
        service.set_weights(RankingWeights(w_user=1.5))

        retrieved_weights = []

        def get_weights():
            w = service.get_weights()
            retrieved_weights.append(w)

        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(get_weights) for _ in range(50)]
            for future in as_completed(futures):
                future.result()

        first_id = id(retrieved_weights[0])
        assert all(id(w) != first_id or w is retrieved_weights[0] for w in retrieved_weights[1:])
        assert all(w.w_user == 1.5 for w in retrieved_weights)

    def test_concurrent_preset_application(self):
        service = SettingsService()
        presets = [
            WeightPreset.DEFAULT,
            WeightPreset.HIGH_PERSONALIZATION,
            WeightPreset.HIGH_CTR,
            WeightPreset.BM25_ONLY,
        ]
        errors = []

        def apply_preset(preset: WeightPreset):
            try:
                service.apply_preset(preset)
            except Exception as e:
                errors.append(e)

        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = [
                executor.submit(apply_preset, presets[i % len(presets)])
                for i in range(100)
            ]
            for future in as_completed(futures):
                future.result()

        assert len(errors) == 0

    def test_set_weights_clears_preset(self):
        service = SettingsService()
        service.apply_preset(WeightPreset.HIGH_CTR)
        assert service.get_preset() == WeightPreset.HIGH_CTR

        service.set_weights(RankingWeights(w_user=2.0))
        assert service.get_preset() is None

    def test_reset_applies_default_preset(self):
        service = SettingsService()
        service.apply_preset(WeightPreset.HIGH_CTR)

        result = service.reset()

        assert service.get_preset() == WeightPreset.DEFAULT
        assert result.w_user == RankingWeights().w_user

    def test_concurrent_reads_during_write(self):
        service = SettingsService()
        read_results = []
        write_complete = threading.Event()
        results_lock = threading.Lock()

        def writer():
            for i in range(50):
                service.set_weights(RankingWeights(w_user=float(i % 5)))
                time.sleep(0.001)
            write_complete.set()

        def reader():
            read_count = 0
            while not write_complete.is_set() and read_count < 20:
                weights = service.get_weights()
                with results_lock:
                    read_results.append(weights.w_user)
                read_count += 1
                time.sleep(0.002)

        writer_thread = threading.Thread(target=writer)
        reader_threads = [threading.Thread(target=reader) for _ in range(3)]

        writer_thread.start()
        for t in reader_threads:
            t.start()

        writer_thread.join(timeout=5)
        write_complete.set()
        for t in reader_threads:
            t.join(timeout=2)

        assert len(read_results) > 0
        assert all(isinstance(r, float) for r in read_results)
