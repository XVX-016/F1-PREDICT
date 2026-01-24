import fastf1
import json
import redis
import sys
import os

# Add backend directory to path to import redis_manager
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from engine.telemetry.redis_manager import RedisTelemetryStore

# Enable cache
fastf1.Cache.enable_cache('C:/Computing/F1-PREDICT/.fastf1_cache')

def ingest_race(year=2024, race="Bahrain", session_type="R"):
    print(f"Loading {year} {race} {session_type}...")
    session = fastf1.get_session(year, race, session_type)
    session.load(laps=True, telemetry=False, weather=False, messages=False)
    
    store = RedisTelemetryStore()
    
    if not store.r:
        print("Error: Redis is not available. Skipping ingestion.")
        return

    race_id = f"{race.lower()}_{year}"
    
    laps = session.laps
    max_lap = int(laps["LapNumber"].max())
    
    # Store Metadata
    meta = {
        "source": "FASTF1",
        "year": year,
        "race": race,
        "session": session_type,
        "max_lap": max_lap,
        "ingested_at": "2026-01-18" # conceptual
    }
    store.set_replay_meta(race_id, meta)
    print(f"Meta stored for {race_id}")
    
    # Ingest Laps
    print(f"Ingesting {max_lap} laps...")
    
    # Group by lap
    for lap_num in range(1, max_lap + 1):
        lap_data = laps[laps["LapNumber"] == lap_num]
        
        drivers = {}
        leader_time = None
        
        # Simple leader finding for gap calc (approximate for demo)
        # FastF1 has 'GapToLeader' but let's just take the first one or logic
        sorted_lap = lap_data.sort_values(by="Position")
        
        for _, row in sorted_lap.iterrows():
            driver = row["Driver"]
            # Construct LapState-like object
            
            # Simulated decision for demo purposes if not present
            # In real ingestion we might not have 'decisions' unless we infer them
            
            drivers[driver] = {
                "position": int(row["Position"]) if not pd.isna(row["Position"]) else None,
                "gap_to_leader_ms": 0, # Placeholder, naturally would calculate
                "car_state": {
                    "tyre_compound": row["Compound"],
                    "tyre_age_laps": int(row["TyreLife"]) if not pd.isna(row["TyreLife"]) else 0,
                    "fuel_kg": 0 # Not in public telemetry usually
                },
                "pace_model": {
                   "predicted_lap_ms": row["LapTime"].total_seconds() * 1000 if not pd.isna(row["LapTime"]) else 0,
                    "uncertainty": {
                        "p05_ms": 0,
                        "p95_ms": 0
                    }
                }
            }
            
        # Store as "LapState" - flattening for the single-user view simulation
        # In a real replay we want ALL drivers.
        # But our ReplayPanel expects a single trace for the *primary* driver usually?
        # Actually the ReplayPanel took `trace: LapState[]`.
        # So we probably want to store the WHOLE race state, 
        # and the frontend filters for the driver being analyzed.
        
        # Usage in redis_manager was: set_replay_lap(race_id, lap, payload)
        # Payload here will be the FULL GRID state.
        
        payload = {
            "lap": lap_num,
            "drivers": drivers
        }
        
        store.set_replay_lap(race_id, lap_num, payload)
        
    print("Ingestion complete.")

import pandas as pd # Needed for isna check above

if __name__ == "__main__":
    ingest_race()
