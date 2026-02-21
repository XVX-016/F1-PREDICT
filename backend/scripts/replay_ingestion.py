import fastf1
import redis
import json
import logging
import argparse
import sys
import os
import pickle
import numpy as np
import pandas as pd
from datetime import timedelta
from multiprocessing import Pool, cpu_count
from typing import Dict, Any, List

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from models.domain import LapFrame, RaceTimeline, TelemetryFrame

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

FPS = 25
DT = 1 / FPS

def get_redis_client():
    """Helper to get a redis client."""
    REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
    return redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

def _process_single_driver(args):
    """Process telemetry data for a single driver (Must be global for multiprocessing)"""
    driver_no, session, driver_code = args
    
    try:
        laps_driver = session.laps.pick_drivers(driver_no)
        if laps_driver.empty:
            return None

        driver_max_lap = laps_driver.LapNumber.max() if not laps_driver.empty else 0

        # Arrays to collect
        t_all, x_all, y_all, race_dist_all, rel_dist_all = [], [], [], [], []
        lap_numbers, tyre_life_all = [], []
        speed_all, gear_all, drs_all, throttle_all, brake_all = [], [], [], [], []
        
        total_dist_so_far = 0.0

        for _, lap in laps_driver.iterlaps():
            lap_tel = lap.get_telemetry()
            if lap_tel.empty:
                continue
                
            lap_number = lap.LapNumber
            tyre_life = lap.TyreLife if pd.notna(lap.TyreLife) else 0
            
            # Extract arrays
            t_lap = lap_tel["SessionTime"].dt.total_seconds().to_numpy()
            x_lap = lap_tel["X"].to_numpy()
            y_lap = lap_tel["Y"].to_numpy()
            d_lap = lap_tel["Distance"].to_numpy()
            rd_lap = lap_tel["RelativeDistance"].to_numpy()
            
            # Telemetry fields
            speed_lap = lap_tel["Speed"].to_numpy()
            gear_lap = lap_tel["nGear"].to_numpy()
            drs_lap = lap_tel["DRS"].to_numpy()
            throttle_lap = lap_tel["Throttle"].to_numpy()
            brake_lap = lap_tel["Brake"].to_numpy().astype(float)
            
            # Global distance
            race_d_lap = total_dist_so_far + d_lap
            
            t_all.append(t_lap)
            x_all.append(x_lap)
            y_all.append(y_lap)
            race_dist_all.append(race_d_lap)
            rel_dist_all.append(rd_lap)
            
            # Fill constant props for this lap segment
            lap_numbers.append(np.full_like(t_lap, lap_number))
            tyre_life_all.append(np.full_like(t_lap, tyre_life))
            
            speed_all.append(speed_lap)
            gear_all.append(gear_lap)
            drs_all.append(drs_lap)
            throttle_all.append(throttle_lap)
            brake_all.append(brake_lap)
            
            # Update accumulators
            # Use max relative distance of this lap to add to total
            total_dist_so_far += d_lap[-1] if len(d_lap) > 0 else 0

        if not t_all:
            return None

        # Concatenate
        t_all = np.concatenate(t_all)
        x_all = np.concatenate(x_all)
        y_all = np.concatenate(y_all)
        dist_all = np.concatenate(race_dist_all)
        rel_dist_all = np.concatenate(rel_dist_all)
        lap_all = np.concatenate(lap_numbers)
        tyre_life_all = np.concatenate(tyre_life_all)
        speed_all = np.concatenate(speed_all)
        gear_all = np.concatenate(gear_all)
        drs_all = np.concatenate(drs_all)
        throttle_all = np.concatenate(throttle_all)
        brake_all = np.concatenate(brake_all)
        
        # Sort by time
        order = np.argsort(t_all)
        
        return {
            "code": driver_code,
            "data": {
                "t": t_all[order],
                "x": x_all[order],
                "y": y_all[order],
                "dist": dist_all[order],
                "rel_dist": rel_dist_all[order],
                "lap": lap_all[order],
                "tyre_life": tyre_life_all[order],
                "speed": speed_all[order],
                "gear": gear_all[order],
                "drs": drs_all[order],
                "throttle": throttle_all[order],
                "brake": brake_all[order]
            },
            "t_min": t_all.min(),
            "t_max": t_all.max(),
            "max_lap": driver_max_lap
        }
    except Exception as e:
        logger.error(f"Error processing driver {driver_code}: {e}")
        return None

def ingest_high_fidelity_replay(year: int, race_id: str, session_type: str = 'R'):
    """
    Ingest 25Hz telemetry for replay engine.
    """
    r = get_redis_client()
    logger.info(f"Starting High-Fidelity Ingestion for {year} {race_id}")
    
    # 1. Load Sync
    try:
        session = fastf1.get_session(year, race_id, session_type)
        session.load(telemetry=True, weather=False) # Skip weather for now to speed up
    except Exception as e:
        logger.error(f"Failed to load FastF1: {e}")
        return

    drivers = session.drivers
    driver_codes = {num: session.get_driver(num)["Abbreviation"] for num in drivers}
    
    # 2. Parallel Processing
    driver_args = [(d, session, driver_codes[d]) for d in drivers]
    
    # Limit processes
    num_processes = min(cpu_count(), 4)
    
    logger.info(f"Processing telemetry for {len(drivers)} drivers with {num_processes} workers...")
    
    with Pool(processes=num_processes) as pool:
        results = pool.map(_process_single_driver, driver_args)
        
    # 3. Aggregation & Resampling
    logger.info("Aggregating and resampling timeline...")
    
    valid_results = [res for res in results if res is not None]
    if not valid_results:
        logger.error("No valid telemetry data extracted.")
        return

    global_t_min = min(res["t_min"] for res in valid_results)
    global_t_max = max(res["t_max"] for res in valid_results)
    
    # Unified timeline relative to start
    timeline = np.arange(global_t_min, global_t_max, DT)
    rel_timeline = timeline - global_t_min
    
    # Resample all drivers to this timeline
    unified_telemetry = []
    
    for res in valid_results:
        code = res["code"]
        data = res["data"]
        
        # Interpolation
        # Note: interp needs sorted x, which t is.
        
        frame_t = rel_timeline
        frame_x = np.interp(timeline, data["t"], data["x"])
        frame_y = np.interp(timeline, data["t"], data["y"])
        frame_speed = np.interp(timeline, data["t"], data["speed"])
        frame_gear = np.interp(timeline, data["t"], data["gear"]).astype(int) # Step? Nearest?
        frame_drs = np.interp(timeline, data["t"], data["drs"]).astype(int)
        frame_throttle = np.interp(timeline, data["t"], data["throttle"])
        frame_brake = np.interp(timeline, data["t"], data["brake"])
        frame_dist = np.interp(timeline, data["t"], data["dist"])
        frame_rel = np.interp(timeline, data["t"], data["rel_dist"])
        frame_lap = np.interp(timeline, data["t"], data["lap"]).astype(int) # This might flicker at cross line
        
        # Convert to TelemetryFrame objects (or dicts for Redis)
        # We group by TIME for easy retrieval?
        # NO, Redis Hash: race:{id}:timeline -> field: timestamp, value: list of drivers?
        # Or just store the big lists per driver?
        
        # Strategy:
        # We need to serve this via API. The frontend wants the whole timeline or chunks.
        # Storing as one massive JSON per driver in Redis is simplest for prototype.
        # Actually API logic in `races.py` loops keys. 
        # Ideally we stick to the `LapFrame` structure for compat, but update `get_race_timeline`.
        
        # Let's verify `races.py`: it looks for `race:{race_id}:replay:lap:{lap}`
        # This HF data is SUB-LAP.
        
        # NEW APPROACH:
        # Store metadata: race:{race_id}:hi_res_telemetry -> List[TelemetryFrame]
        # BUT this is huge. 
        # Splitting by lap is better.
        
        # Build a flat, shared-timeline frame list per driver.
        # This is the "time-first, driver-second" contract and prevents desyncs.
        driver_frames_flat = []
        for i in range(len(timeline)):
            driver_frames_flat.append({
                "t": float(frame_t[i]),           # seconds since race start
                "driver_id": code,
                "x": float(frame_x[i]),
                "y": float(frame_y[i]),
                "dist": float(frame_dist[i]),
                "rel_dist": float(frame_rel[i]),
                "speed": float(frame_speed[i]),
                "gear": int(frame_gear[i]),
                "drs": int(frame_drs[i]),
                "throttle": float(frame_throttle[i]),
                "brake": float(frame_brake[i]),
                "lap": int(frame_lap[i])
            })
            
        # Store to Local Cache (Always)
        try:
            cache_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'replay_cache')
            os.makedirs(cache_dir, exist_ok=True)
            cache_file = os.path.join(cache_dir, f"{race_id}_{code}.json")
            
            # Save flat list (preferred for replay engine)
            with open(cache_file, 'w') as f:
                json.dump(driver_frames_flat, f)
            
            logger.info(f"Saved local cache to {cache_file} ({ len(timeline) } frames)")
                
        except Exception as e:
            logger.error(f"Failed to save local cache for {code}: {e}")

    logger.info("High-Fidelity Ingestion Complete.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, required=True)
    parser.add_argument("--race", type=str, required=True)
    args = parser.parse_args()
    
    ingest_high_fidelity_replay(args.year, args.race)
