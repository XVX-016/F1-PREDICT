import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from services.ml_residual_service import MLResidualService


def test_ml_residual_service_returns_empty_when_model_missing(monkeypatch):
    service = MLResidualService()
    monkeypatch.setattr(service, "_latest_model_base", lambda: None)

    assert service.model_version is None
    assert service.predict_residuals([{"driver_id": "VER", "avg_long_run_pace_ms": 90000.0}]) == {}


def test_ml_residual_service_uses_default_feature_version_without_model(monkeypatch):
    service = MLResidualService()
    monkeypatch.setattr(service, "_latest_model_base", lambda: None)

    assert service.feature_version == "telemetry_features_v1"
