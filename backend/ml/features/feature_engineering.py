import pandas as pd
import numpy as np
from typing import Dict, List, Any

class FeatureEngineer:
    """
    Extracts features for the Pace Delta model from telemetry sessions.
    """
    
    def extract_features(self, session_data: Any, driver_id: str) -> Dict[str, float]:
        """
        Extracts the 6 core features from a FastF1 session object.
        """
        # 1. Average Long Run Pace (ms)
        # Filter for stints > 5 laps
        laps = session_data.laps.pick_driver(driver_id)
        if laps.empty: return self._get_default_features()
        
        long_runs = laps[laps['Stint'].map(laps['Stint'].value_counts()) >= 5]
        avg_long_run_pace = long_runs['LapTime'].dt.total_seconds().mean() * 1000 if not long_runs.empty else 90000
        
        # 2. Tyre Degradation Rate (ms/lap)
        # Linear regression on lap times within stints
        deg_rates = []
        for stint_id in long_runs['Stint'].unique():
            stint_laps = long_runs[long_runs['Stint'] == stint_id]
            if len(stint_laps) > 3:
                x = np.arange(len(stint_laps))
                y = stint_laps['LapTime'].dt.total_seconds().values * 1000
                slope, _ = np.polyfit(x, y, 1)
                deg_rates.append(slope)
        tire_deg_rate = np.mean(deg_rates) if deg_rates else 0.05
        
        # 3. Sector Consistency (ms)
        # Std dev of sector times
        sector_std = laps[['Sector1Time', 'Sector2Time', 'Sector3Time']].apply(
            lambda x: x.dt.total_seconds() * 1000
        ).std().mean()
        
        # 4. Clean Air Delta (ms)
        # Difference between avg pace and pace with no traffic (TrackStatus=1, no cars ahead < 2s)
        # Simplified: using P10-P90 range for now as proxy
        clean_air_delta = -150.0 # Placeholder logic until traffic data available
        
        # 5. Recent Form (points last 3 races)
        recent_form = 15.0 # Placeholder - requires historical results DB
        
        # 6. Grid Position
        grid_position = float(laps['GridPosition'].iloc[0]) if 'GridPosition' in laps.columns and not pd.isna(laps['GridPosition'].iloc[0]) else 10.0
        
        return {
            "avg_long_run_pace_ms": float(avg_long_run_pace),
            "tire_deg_rate": float(max(0.01, tire_deg_rate)),
            "sector_consistency": float(sector_std) if not pd.isna(sector_std) else 200.0,
            "clean_air_delta": float(clean_air_delta),
            "recent_form": float(recent_form),
            "grid_position": float(grid_position)
        }

    def _get_default_features(self) -> Dict[str, float]:
        return {
            "avg_long_run_pace_ms": 90000.0,
            "tire_deg_rate": 0.05,
            "sector_consistency": 200.0,
            "clean_air_delta": 0.0,
            "recent_form": 10.0,
            "grid_position": 10.0
        }
