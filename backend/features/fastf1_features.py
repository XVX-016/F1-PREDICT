"""
FastF1 Feature Extractor - Production Rehaul
Extracts aggregated, driver-agnostic features from FP2/FP3 sessions.
Stores results in Supabase telemetry_features table.
"""
import pandas as pd
import numpy as np
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from database.supabase_client import get_db
from data.fastf1_client import fastf1_client

logger = logging.getLogger(__name__)

class FastF1FeatureExtractor:
    def __init__(self):
        self.db = get_db()

    def extract_features(self, season: int, round_num: int) -> pd.DataFrame:
        """
        Main entry point for Phase 1: Extract features and store in Supabase.
        """
        logger.info(f"🚀 Starting feature extraction for {season} Round {round_num}")
        
        # 1. Load Session (FP2 preferred, FP3 fallback)
        session = fastf1_client.get_session_laps(season, round_num, "FP2")
        if session is None:
            logger.error(f"❌ No session data found for {season} R{round_num}")
            return pd.DataFrame()

        # 2. Get Race ID and Driver Mappings
        race_id = self._get_race_id(season, round_num)
        if not race_id:
            logger.error(f"❌ Race {season} R{round_num} not found in database")
            return pd.DataFrame()
            
        driver_map = self._get_driver_map() # code -> id

        features_list = []
        
        # 3. Process each driver
        for driver_code in session.drivers:
            try:
                driver_id = driver_map.get(driver_code)
                if not driver_id:
                    logger.warning(f"⚠️ Driver {driver_code} not in database, skipping")
                    continue
                    
                laps = session.laps.pick_driver(driver_code)
                if len(laps) < 5:
                    continue

                # Filter clean laps
                clean_laps = laps[
                    (laps["IsAccurate"] == True) & 
                    (laps["PitOutTime"].isna()) & 
                    (laps["PitInTime"].isna())
                ]
                
                if len(clean_laps) < 3:
                    continue

                lap_times_ms = clean_laps["LapTime"].dt.total_seconds() * 1000
                
                # Feature: avg_clean_lap_ms
                avg_clean_lap_ms = float(lap_times_ms.mean())
                
                # Feature: tire_deg_rate (linear slope)
                lap_numbers = np.arange(len(lap_times_ms))
                tire_deg_rate = 0.0
                if len(lap_numbers) > 3:
                    tire_deg_rate = float(np.polyfit(lap_numbers, lap_times_ms.values, 1)[0])
                
                # Feature: sector_consistency (std dev)
                # Using total lap time std as proxy if sectors are messy, but sector std is better
                sector_consistency = float(lap_times_ms.std())
                
                # Feature: clean_air_delta (vs dirty air)
                # Simplified: diff between top 25% pace and mean pace
                clean_air_delta = float(avg_clean_lap_ms - lap_times_ms.quantile(0.25))
                
                # Recent Form EWMA (placeholder for now, will implement fetch logic)
                recent_form_ewma = self._calculate_recent_form(driver_id, season, round_num)

                feat = {
                    "race_id": race_id,
                    "driver_id": driver_id,
                    "avg_long_run_pace_ms": avg_clean_lap_ms,
                    "tire_deg_rate": tire_deg_rate,
                    "sector_consistency": sector_consistency,
                    "clean_air_delta": clean_air_delta,
                    "recent_form_ewma": recent_form_ewma
                }
                
                features_list.append(feat)
                
            except Exception as e:
                logger.error(f"Error processing driver {driver_code}: {e}")

        if not features_list:
            return pd.DataFrame()

        df = pd.DataFrame(features_list)
        
        # 4. Store in Supabase
        self._store_features(features_list)
        
        logger.info(f"✅ Extracted features for {len(df)} drivers")
        return df

    def _get_race_id(self, season: int, round_num: int) -> Optional[str]:
        res = self.db.table("races").select("id").match({"season": season, "round": round_num}).execute()
        return res.data[0]["id"] if res.data else None

    def _get_driver_map(self) -> Dict[str, str]:
        res = self.db.table("drivers").select("id, driver_code").execute()
        return {d["driver_code"]: d["id"] for d in res.data}

    def _calculate_recent_form(self, driver_id: str, season: int, round_num: int) -> float:
        """
        EWMA of pace deltas from last 5 races.
        Returns average pace if no history.
        """
        try:
            # Query last 5 races for this driver
            res = self.db.table("telemetry_features")\
                .select("avg_long_run_pace_ms")\
                .match({"driver_id": driver_id})\
                .order("created_at", desc=True)\
                .limit(5)\
                .execute()
            
            if not res.data:
                return 0.0 # Baseline
                
            paces = [d["avg_long_run_pace_ms"] for d in res.data]
            return float(pd.Series(paces).ewm(span=len(paces)).mean().iloc[-1])
        except Exception:
            return 0.0

    def _store_features(self, features: List[Dict]):
        """Upsert features to telemetry_features table"""
        for feat in features:
            try:
                # Remove extra keys not in schema
                db_feat = {k: v for k, v in feat.items() if k != "recent_form_ewma"}
                self.db.table("telemetry_features").upsert(db_feat).execute()
            except Exception as e:
                logger.error(f"Failed to store features for driver {feat['driver_id']}: {e}")

# Global wrapper as requested by Prompt
def extract_features(season: int, round_num: int) -> pd.DataFrame:
    extractor = FastF1FeatureExtractor()
    return extractor.extract_features(season, round_num)
