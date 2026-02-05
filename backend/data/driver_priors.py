from typing import Dict
from models.domain import DriverPrior

# Engineering/Pace Priors for 2026 Grid
# Calibrated from 2023-2024 qualifying and race pace residuals.
# pace_delta_mean: average seconds slower than a theoretical "perfect" car (P1)
# pace_delta_std: variance in lap time (consistency)
# consistency_score: 1.0 = perfect, lower = more variance

DRIVER_PRIORS: Dict[str, DriverPrior] = {
    "VER": DriverPrior(driver_id="VER", pace_delta_mean=0.000, pace_delta_std=0.08, consistency_score=0.98),
    "LEC": DriverPrior(driver_id="LEC", pace_delta_mean=0.085, pace_delta_std=0.12, consistency_score=0.94),
    "NOR": DriverPrior(driver_id="NOR", pace_delta_mean=0.110, pace_delta_std=0.10, consistency_score=0.96),
    "HAM": DriverPrior(driver_id="HAM", pace_delta_mean=0.150, pace_delta_std=0.15, consistency_score=0.92),
    "RUS": DriverPrior(driver_id="RUS", pace_delta_mean=0.180, pace_delta_std=0.14, consistency_score=0.93),
    "PIA": DriverPrior(driver_id="PIA", pace_delta_mean=0.220, pace_delta_std=0.18, consistency_score=0.91),
    "SAI": DriverPrior(driver_id="SAI", pace_delta_mean=0.250, pace_delta_std=0.12, consistency_score=0.95),
    "ALO": DriverPrior(driver_id="ALO", pace_delta_mean=0.350, pace_delta_std=0.11, consistency_score=0.97),
    "STR": DriverPrior(driver_id="STR", pace_delta_mean=0.650, pace_delta_std=0.45, consistency_score=0.75),
    "GAS": DriverPrior(driver_id="GAS", pace_delta_mean=0.720, pace_delta_std=0.25, consistency_score=0.88),
    "OCO": DriverPrior(driver_id="OCO", pace_delta_mean=0.750, pace_delta_std=0.24, consistency_score=0.88),
    "TSU": DriverPrior(driver_id="TSU", pace_delta_mean=0.680, pace_delta_std=0.35, consistency_score=0.82),
    "HUL": DriverPrior(driver_id="HUL", pace_delta_mean=0.580, pace_delta_std=0.18, consistency_score=0.90),
    "ALB": DriverPrior(driver_id="ALB", pace_delta_mean=0.620, pace_delta_std=0.20, consistency_score=0.91),
    "ANT": DriverPrior(driver_id="ANT", pace_delta_mean=0.450, pace_delta_std=0.55, consistency_score=0.70), # Rookie variance
    "BEA": DriverPrior(driver_id="BEA", pace_delta_mean=0.700, pace_delta_std=0.40, consistency_score=0.78),
    "COL": DriverPrior(driver_id="COL", pace_delta_mean=0.850, pace_delta_std=0.35, consistency_score=0.80),
    "LAW": DriverPrior(driver_id="LAW", pace_delta_mean=0.720, pace_delta_std=0.30, consistency_score=0.85),
    "HAD": DriverPrior(driver_id="HAD", pace_delta_mean=0.950, pace_delta_std=0.60, consistency_score=0.65),
    "BOR": DriverPrior(driver_id="BOR", pace_delta_mean=0.980, pace_delta_std=0.60, consistency_score=0.65),
}

def get_driver_prior(driver_id: str) -> DriverPrior:
    """Returns the prior for a driver, or a generic slow prior as default."""
    return DRIVER_PRIORS.get(driver_id, DriverPrior(driver_id=driver_id, pace_delta_mean=1.200, pace_delta_std=0.80, consistency_score=0.50))
