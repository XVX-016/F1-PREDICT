"""
Populate Telemetry Features - Extract REAL data from FastF1 and push to Supabase
Run: python backend/scripts/populate_telemetry_features.py

This script extracts telemetry from completed 2024 races and stores in Supabase
for ML model training.
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

import logging
from datetime import datetime
from typing import Dict, List, Optional
import pandas as pd
import numpy as np

from database.supabase_client import get_db
from data.fastf1_client import fastf1_client

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 2024 F1 Calendar (completed races only)
RACES_2024 = [
    (2024, 1, "Bahrain"),
    (2024, 2, "Saudi Arabia"),
    (2024, 3, "Australia"),
    (2024, 4, "Japan"),
    (2024, 5, "China"),
    (2024, 6, "Miami"),
    (2024, 7, "Emilia Romagna"),
    (2024, 8, "Monaco"),
    (2024, 9, "Canada"),
    (2024, 10, "Spain"),
    (2024, 11, "Austria"),
    (2024, 12, "Great Britain"),
    (2024, 13, "Hungary"),
    (2024, 14, "Belgium"),
    (2024, 15, "Netherlands"),
    (2024, 16, "Italy"),
    (2024, 17, "Azerbaijan"),
    (2024, 18, "Singapore"),
    (2024, 19, "United States"),
    (2024, 20, "Mexico"),
    (2024, 21, "Brazil"),
    (2024, 22, "Las Vegas"),
    (2024, 23, "Qatar"),
    (2024, 24, "Abu Dhabi"),
]


def extract_driver_features(session, driver_code: str) -> Optional[Dict]:
    """Extract telemetry features for a single driver from FP2 session"""
    try:
        driver_laps = session.laps.pick_driver(driver_code)
        
        if len(driver_laps) < 5:
            logger.warning(f"  {driver_code}: Insufficient laps ({len(driver_laps)})")
            return None
        
        # Filter to clean laps only
        clean_laps = driver_laps[
            (driver_laps["IsAccurate"] == True) &
            (driver_laps["PitOutTime"].isna()) &
            (driver_laps["PitInTime"].isna()) &
            (driver_laps["LapTime"].notna())
        ]
        
        if len(clean_laps) < 3:
            logger.warning(f"  {driver_code}: Insufficient clean laps ({len(clean_laps)})")
            return None
        
        # Convert lap times to ms
        lap_times_ms = clean_laps["LapTime"].dt.total_seconds() * 1000
        
        # 1. Average long run pace
        avg_long_run_pace_ms = float(lap_times_ms.mean())
        
        # 2. Tire degradation rate (linear fit)
        lap_numbers = np.arange(len(lap_times_ms))
        if len(lap_numbers) > 2:
            tire_deg_rate = float(np.polyfit(lap_numbers, lap_times_ms.values, 1)[0])
        else:
            tire_deg_rate = 0.0
        
        # 3. Sector consistency (std dev)
        sector_consistency = float(lap_times_ms.std())
        
        # 4. Clean air delta (difference between mean and best 25%)
        clean_air_delta = float(avg_long_run_pace_ms - lap_times_ms.quantile(0.25))
        
        return {
            "driver_code": driver_code,
            "avg_long_run_pace_ms": avg_long_run_pace_ms,
            "tire_deg_rate": abs(tire_deg_rate),  # Ensure positive
            "sector_consistency": sector_consistency,
            "clean_air_delta": clean_air_delta,
            "lap_count": len(clean_laps)
        }
        
    except Exception as e:
        logger.error(f"  {driver_code}: Error - {e}")
        return None


def get_or_create_race_id(db, season: int, round_num: int, race_name: str) -> Optional[str]:
    """Get race_id from database or create if not exists"""
    try:
        # Try to find existing race
        result = db.table("races").select("id").match({
            "season": season, 
            "round": round_num
        }).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]["id"]
        
        # Create new race entry
        new_race = db.table("races").insert({
            "season": season,
            "round": round_num,
            "name": f"{race_name} Grand Prix",
            "circuit": race_name,
            "race_date": f"{season}-01-01",  # Placeholder
        }).execute()
        
        if new_race.data:
            return new_race.data[0]["id"]
        
        return None
        
    except Exception as e:
        logger.error(f"Error getting/creating race: {e}")
        return None


def populate_features_for_race(db, season: int, round_num: int, race_name: str) -> int:
    """Extract and store features for all drivers in a race"""
    logger.info(f"\n{'='*60}")
    logger.info(f"Processing: {season} Round {round_num} - {race_name}")
    logger.info(f"{'='*60}")
    
    # Try FP2 first, then FP3 (for sprint weekends)
    logger.info("Loading FP2 session...")
    session = fastf1_client.get_session_laps(season, round_num, "FP2")
    
    if session is None:
        logger.warning(f"FP2 not available, trying FP3...")
        session = fastf1_client.get_session_laps(season, round_num, "FP3")
    
    if session is None:
        logger.error(f"No practice session available for {race_name}")
        return 0
    
    logger.info(f"Session loaded: {len(session.laps)} laps, {len(session.drivers)} drivers")
    
    # Extract features for each driver
    features_list = []
    for driver_code in session.drivers:
        features = extract_driver_features(session, driver_code)
        if features:
            features["season"] = season
            features["round"] = round_num
            features["race_name"] = race_name
            features_list.append(features)
            logger.info(f"  ✓ {driver_code}: pace={features['avg_long_run_pace_ms']:.0f}ms, deg={features['tire_deg_rate']:.2f}")
    
    if not features_list:
        logger.warning(f"No features extracted for {race_name}")
        return 0
    
    # Insert into Supabase (without foreign key, using driver_code as ID)
    records_inserted = 0
    for feat in features_list:
        try:
            # Create a unique race identifier
            race_key = f"{season}_{round_num}"
            
            db_record = {
                "race_id": None,  # No FK constraint now
                "driver_id": str(feat["driver_code"]),  # Driver code as text
                "avg_long_run_pace_ms": feat["avg_long_run_pace_ms"],
                "tire_deg_rate": feat["tire_deg_rate"],
                "sector_consistency": feat["sector_consistency"],
                "clean_air_delta": feat["clean_air_delta"],
                "recent_form": 10.0,  # Placeholder
                "grid_position": 10,  # Placeholder
                "data_source": f"FastF1_{season}_R{round_num}",
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Simple insert (no upsert to avoid constraint issues)
            db.table("telemetry_features").insert(db_record).execute()
            records_inserted += 1
            
        except Exception as e:
            # Skip duplicates
            if "duplicate" in str(e).lower():
                logger.info(f"  {feat['driver_code']}: Already exists, skipping")
            else:
                logger.error(f"Failed to insert {feat['driver_code']}: {e}")
    
    logger.info(f"Inserted {records_inserted} records for {race_name}")
    return records_inserted


def main():
    print("\n" + "="*70)
    print("  F1-PREDICT TELEMETRY FEATURE EXTRACTION")
    print("  Populating Supabase with real FastF1 data")
    print("="*70 + "\n")
    
    db = get_db()
    
    total_records = 0
    successful_races = 0
    
    # Process each race
    for season, round_num, race_name in RACES_2024:
        try:
            count = populate_features_for_race(db, season, round_num, race_name)
            total_records += count
            if count > 0:
                successful_races += 1
        except Exception as e:
            logger.error(f"Failed to process {race_name}: {e}")
            continue
    
    print("\n" + "="*70)
    print("  EXTRACTION COMPLETE")
    print("="*70)
    print(f"  Races processed: {successful_races}/{len(RACES_2024)}")
    print(f"  Total records: {total_records}")
    print(f"\n  You can now run: python backend/ml/training/train_lgbm.py")
    print("="*70 + "\n")


if __name__ == "__main__":
    main()
