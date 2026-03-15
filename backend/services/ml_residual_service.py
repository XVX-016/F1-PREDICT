import json
import logging
from pathlib import Path
from typing import Any, Dict, Iterable, Optional

import pandas as pd
try:
    import lightgbm as lgb
except Exception:  # pragma: no cover - optional runtime dependency guard
    lgb = None

logger = logging.getLogger(__name__)

ARTIFACT_DIR = Path(__file__).resolve().parent.parent / "ml" / "artifacts" / "models"
DEFAULT_FEATURES = [
    "avg_long_run_pace_ms",
    "tire_deg_rate",
    "sector_consistency",
    "clean_air_delta",
    "recent_form",
    "grid_position",
    "tyre_age_compound_factor",
    "track_temperature",
    "qualifying_pace_delta",
    "drs_activation_rate",
    "sector_variance",
    "track_evolution_coefficient",
    "weather_delta",
]


class MLResidualService:
    def __init__(self) -> None:
        self._booster: Optional[Any] = None
        self._metadata: Dict[str, Any] = {}

    def _latest_model_base(self) -> Optional[Path]:
        model_files = sorted(ARTIFACT_DIR.glob("lgbm_v*.txt"))
        return model_files[-1] if model_files else None

    def _load(self) -> bool:
        if self._booster is not None:
            return True

        model_path = self._latest_model_base()
        if not model_path or lgb is None:
            return False

        metadata_path = model_path.with_name(f"{model_path.stem}_metadata.json")
        try:
            self._booster = lgb.Booster(model_file=str(model_path))
            if metadata_path.exists():
                self._metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
            else:
                self._metadata = {"model_version": model_path.stem, "features": DEFAULT_FEATURES}
            return True
        except Exception as exc:
            logger.warning("Failed to load ML residual artifact %s: %s", model_path, exc)
            self._booster = None
            self._metadata = {}
            return False

    @property
    def model_version(self) -> Optional[str]:
        if not self._load():
            return None
        return str(self._metadata.get("model_version") or "unknown")

    @property
    def feature_version(self) -> str:
        if not self._load():
            return "telemetry_features_v1"
        return str(self._metadata.get("feature_version") or "telemetry_features_v1")

    def _build_frame(self, driver_rows: Iterable[Dict[str, Any]]) -> pd.DataFrame:
        rows = list(driver_rows)
        features = list(self._metadata.get("features") or DEFAULT_FEATURES)
        frame = pd.DataFrame(rows)
        for feature in features:
            if feature not in frame.columns:
                frame[feature] = 0.0
        return frame[features]

    def predict_residuals(self, driver_rows: Iterable[Dict[str, Any]]) -> Dict[str, float]:
        rows = list(driver_rows)
        if not rows or not self._load() or self._booster is None:
            return {}

        frame = self._build_frame(rows)
        try:
            predictions = self._booster.predict(frame)
        except Exception as exc:
            logger.warning("Residual prediction failed: %s", exc)
            return {}

        output: Dict[str, float] = {}
        for row, prediction in zip(rows, predictions):
            driver_id = str(row.get("driver_id") or row.get("id") or "").upper()
            if not driver_id:
                continue
            output[driver_id] = float(prediction)
        return output


ml_residual_service = MLResidualService()
