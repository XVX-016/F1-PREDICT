from typing import Dict, Any, Optional
import numpy as np
import pandas as pd

def build_features(driver_id: str, session: Any) -> Optional[Dict[str, float]]:
    """
    Deterministic feature builder for ML pace model.
    Uses only pre-race data (FP2/FP3).
    """
    try:
        # 1. Filter laps for driver
        laps = session.laps.pick_driver(driver_id)
        if laps.empty:
            return None

        # 2. Identify long runs (stints >= 5 laps on same compound)
        stints = laps.groupby("Stint").filter(lambda x: len(x) >= 5)
        if stints.empty:
            return None

        lap_times = stints["LapTime"].dt.total_seconds() * 1000

        # Feature: Average long run pace (ms)
        avg_long_run_pace_ms = lap_times.mean()

        # Feature: Tyre degradation rate (linear slope of ms/lap)
        # We use polyfit on stint-relative lap indices
        lap_idx = np.arange(len(lap_times))
        slope, intercept = np.polyfit(lap_idx, lap_times.values, 1)
        tyre_deg_rate = slope

        # Feature: Sector consistency (mean std dev of sector times in ms)
        sector_ms = laps[["Sector1Time", "Sector2Time", "Sector3Time"]].apply(
            lambda col: col.dt.total_seconds() * 1000
        )
        sector_consistency = sector_ms.std().mean()

        # Feature: Clean air delta (pace diff when no traffic vs all)
        clean_laps = laps[laps["TrackStatus"] == "1"] # Green flag, simplified
        clean_air_avg = clean_laps["LapTime"].dt.total_seconds().mean() * 1000 if not clean_laps.empty else avg_long_run_pace_ms
        clean_air_delta = clean_air_avg - avg_long_run_pace_ms

        # Feature: Grid position (proxy for qualifying strength)
        grid_pos = float(laps["GridPosition"].iloc[0]) if "GridPosition" in laps.columns else 10.0

        return {
            "avg_long_run_pace_ms": float(avg_long_run_pace_ms),
            "tyre_deg_rate": float(tyre_deg_rate),
            "sector_consistency": float(sector_consistency),
            "clean_air_delta": float(clean_air_delta),
            "grid_position": grid_pos
        }
    except Exception as e:
        print(f"Error building features for {driver_id}: {e}")
        return None
