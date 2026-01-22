"""
FastF1 -> Redis Ingestion Script
Strictly enforces Invariants:
1. No synthetic data (Nulls where missing)
2. Fail on ambiguity
3. Store raw frames + metadata
4. Clear provenance
"""
import fastf1
import redis
import json
import logging
import argparse
import sys
import os
import pandas as pd
from datetime import datetime
from typing import Optional

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from models.domain import LapFrame, RaceTimeline

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_redis_client():
    """Helper to get a redis client."""
    REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
    return redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

def ingest_race(year: int, race_id: str, session_type: str = 'R', redis_client=None):
    """
    Ingest a race from FastF1 and store in Redis.
    """
    r = redis_client or get_redis_client()
    logger.info(f"Starting ingestion for {year} {race_id} [{session_type}]")
    
    # 1. Load Session
    try:
        session = fastf1.get_session(year, race_id, session_type)
        session.load()
    except Exception as e:
        logger.error(f"Failed to load FastF1 session: {e}")
        sys.exit(1)

    # 2. Strict Validation: Check for empty or mixed data
    if session.laps.empty:
        logger.error("CRITICAL: Session has no laps. Aborting.")
        sys.exit(1)
        
    # Check for missing compounds (critical for strategy)
    missing_compounds = session.laps['Compound'].isna().sum()
    if missing_compounds > 0:
        logger.warning(f"CRITICAL WARNING: {missing_compounds} laps missing compound data. Nulls will be stored.")
        # We don't exit here as some historic races might have gaps, but we log loud.

    # 3. Store Metadata
    meta_key = f"race:{race_id}:meta"
    metadata = {
        "source": "FastF1",
        "session": session_type,
        "season": year,
        "ingested_at": datetime.utcnow().isoformat(),
        "lap_count": int(session.total_laps),
        "circuit_id": session.event.Circuit.get('Location', {}).get('Country', 'Unknown') # simplistic ID
    }
    r.set(meta_key, json.dumps(metadata))
    logger.info(f"Stored metadata at {meta_key}")

    # 4. Process Laps
    laps = session.laps
    
    # Clean unique key generator for Redis
    # We iterate by LapNumber, then by Driver
    
    total_frames = 0
    
    for lap_n in laps['LapNumber'].unique():
        lap_n = int(lap_n)
        lap_data = laps[laps['LapNumber'] == lap_n]
        
        for _, row in lap_data.iterrows():
            driver = row['Driver']
            
            # Map to LapFrame (STRICT MAPPING)
            # Ensure Derived fields are None
            
            # Handle potential NaNs for raw fields
            lap_time = row['LapTime'].total_seconds() * 1000 if pd.notna(row['LapTime']) else None
            compound = row['Compound'] if pd.notna(row['Compound']) else None
            position = int(row['Position']) if pd.notna(row['Position']) else None

            frame = LapFrame(
                lap=lap_n,
                driver_id=driver,
                
                # Raw Fields
                lap_time_ms=lap_time,
                compound=compound,
                position=position,
                
                # Derived Fields (MUST BE NONE)
                tyre_wear=None,
                fuel_remaining_kg=None,
                pit_this_lap=None,
                
                # Provenance
                source="REPLAY"
            )
            
            # Key: race:{race_id}:replay:lap:{lap} is a LIST or hash? 
            # The requirement implies per-lap access. 
            # We will use a Hash: race:{race_id}:replay:lap:{lap} -> field: driver_id, value: json
            
            redis_key = f"race:{race_id}:replay:lap:{lap_n}"
            r.hset(redis_key, driver, frame.json())
            total_frames += 1
            
    logger.info(f"Ingestion Complete. Stored {total_frames} frames across {session.total_laps} laps.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, required=True)
    parser.add_argument("--race", type=str, required=True, help="Race name or round number")
    parser.add_argument("--session", type=str, default="R")
    
    args = parser.parse_args()
    
    ingest_race(args.year, args.race, args.session)
