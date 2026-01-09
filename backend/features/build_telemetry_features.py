"""
Build aggregated telemetry features from FastF1 data
Extracts only aggregated metrics - no raw lap arrays passed forward
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional
import logging
from data.fastf1_client import fastf1_client

logger = logging.getLogger(__name__)

def extract_telemetry_features(
    season: int,
    round_num: int,
    driver_code: str
) -> Optional[Dict[str, float]]:
    """
    Extract aggregated telemetry features for a driver
    
    Returns:
        Dictionary with:
        - avg_long_run_pace_ms: Mean of clean laps (ms)
        - tire_degradation_rate: Linear fit slope (ms per lap)
        - sector_consistency: Std dev of sector times
        - clean_air_delta: Difference vs dirty air laps (ms)
    """
    try:
        # Get FP2 session (race-representative)
        session = fastf1_client.get_session_laps(season, round_num, "FP2")
        if session is None:
            return None
        
        # Get driver laps
        driver_laps = fastf1_client.get_driver_laps(session, driver_code)
        if driver_laps is None or len(driver_laps) < 5:
            logger.warning(f"Insufficient laps for {driver_code}")
            return None
        
        # Filter to clean laps only (no pit, no invalid)
        clean_laps = driver_laps[
            (driver_laps["IsAccurate"] == True) &
            (driver_laps["PitOutTime"].isna()) &
            (driver_laps["PitInTime"].isna())
        ]
        
        if len(clean_laps) < 5:
            logger.warning(f"Insufficient clean laps for {driver_code}")
            return None
        
        # Convert lap times to milliseconds
        lap_times_ms = clean_laps["LapTime"].dt.total_seconds() * 1000
        
        # 1. Average long run pace
        avg_long_run_pace_ms = float(lap_times_ms.mean())
        
        # 2. Tire degradation rate (linear fit slope)
        lap_numbers = np.arange(len(lap_times_ms))
        if len(lap_numbers) > 1:
            tire_deg_rate = float(np.polyfit(lap_numbers, lap_times_ms.values, 1)[0])
        else:
            tire_deg_rate = 0.0
        
        # 3. Sector consistency (std dev of sector times)
        sector_times = []
        for idx in clean_laps.index:
            try:
                s1 = clean_laps.loc[idx, "Sector1Time"]
                s2 = clean_laps.loc[idx, "Sector2Time"]
                s3 = clean_laps.loc[idx, "Sector3Time"]
                
                if pd.notna(s1) and pd.notna(s2) and pd.notna(s3):
                    total = s1.total_seconds() + s2.total_seconds() + s3.total_seconds()
                    sector_times.append(total * 1000)  # Convert to ms
            except:
                continue
        
        if len(sector_times) > 1:
            sector_consistency = float(np.std(sector_times))
        else:
            sector_consistency = 0.0
        
        # 4. Clean air delta (difference vs dirty air laps)
        # For now, use overall consistency as proxy
        # In future, could analyze position data
        clean_air_delta = float(lap_times_ms.std())
        
        features = {
            "avg_long_run_pace_ms": avg_long_run_pace_ms,
            "tire_deg_rate": tire_deg_rate,
            "sector_consistency": sector_consistency,
            "clean_air_delta": clean_air_delta
        }
        
        logger.info(f"Extracted telemetry features for {driver_code}")
        return features
        
    except Exception as e:
        logger.error(f"Failed to extract telemetry features: {e}")
        return None

def extract_all_drivers_features(
    season: int,
    round_num: int,
    driver_codes: List[str]
) -> Dict[str, Dict[str, float]]:
    """Extract features for all drivers"""
    all_features = {}
    
    for driver_code in driver_codes:
        features = extract_telemetry_features(season, round_num, driver_code)
        if features:
            all_features[driver_code] = features
    
    return all_features





