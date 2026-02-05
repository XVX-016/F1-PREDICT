"""
Race API endpoints
Exposes track-first simulation and real strategy optimization.
"""
from fastapi import APIRouter, HTTPException
import logging
from typing import Dict, Any, Optional
from services.simulation_engine import simulation_engine
from database.supabase_client import get_db
from models.domain import SimulationRequest, SimulationResponse, RaceTimeline

logger = logging.getLogger(__name__)

router = APIRouter(tags=["races"])

@router.get("/")
async def get_races(season: int = 2026):
    """Get race calendar."""
    try:
        db = get_db()
        response = db.table("races").select("*").order("round").execute()
        races = response.data
        if season:
             races = [r for r in races if r.get('season') == season]
        return races
    except Exception as e:
        logger.error(f"Error fetching races: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch races")

@router.post("/{race_id}/simulate", response_model=SimulationResponse)
async def simulate_race(race_id: str, request: SimulationRequest):
    """
    Executes a high-fidelity Monte Carlo simulation (default 10k iterations).
    """
    try:
        request.track_id = race_id
        logger.info(f"Triggering track-first simulation for {race_id}")
        results = simulation_engine.run_simulation(request)
        return results
    except Exception as e:
        logger.error(f"Simulation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

@router.get("/{race_id}/timeline", response_model=RaceTimeline)
async def get_race_timeline(race_id: str, source: str = "REPLAY"):
    """
    Fetches the full race timeline from Redis or Simulation cache.
    """
    try:
        # For now, we fetch from Redis (REPLAY source)
        # In a real app, this would query the race:{race_id}:replay:lap:* keys
        from scripts.fastf1_to_redis import get_redis_client
        import json
        r = get_redis_client()
        
        # Get metadata
        meta_json = r.get(f"race:{race_id}:meta")
        if not meta_json:
            raise HTTPException(status_code=404, detail="Race metadata not found")
        meta = json.loads(meta_json)
        
        # Get all laps
        laps = []
        # Pattern: race:{race_id}:replay:lap:{lap}
        try:
            lap_keys = r.keys(f"race:{race_id}:replay:lap:*")
            for k in sorted(lap_keys, key=lambda x: int(x.split(":")[-1])):
                lap_data = r.hgetall(k)
                for driver, frame_json in lap_data.items():
                    laps.append(json.loads(frame_json))
        except Exception as e:
            logger.warning(f"Redis lap fetch failed: {e}")

        # Fallback: Check local JSON cache if we have no data (Redis failed or empty)
        # Note: In the new ingestion, we don't save 'laps' separate from telemetry in local cache
        # We just have the big telemetry files.
        # But the frontend expects `telemetry` array in the response to populate `state.drivers`.
        # `laps` is less critical for the Replay engine (it calculates position on fly or uses telemetry).
        
        telemetry = []
        import glob
        import os
        
        # Try fetching telemetry from Redis first
        # Key: race:{race_id}:replay:telemetry:{lap}:{driver}... complex.
        # Actually our ingestion now puts everything in JSON or Redis. 
        # If Redis keys `race:{race_id}:replay:telemetry:*` exist...
        
        # SIMPLIFICATION for robustness:
        # Always check local cache if telemetry is empty.
        
        if not telemetry:
            cache_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'replay_cache')
            # File pattern: {race_id}_{driver_code}.json
            # Use 'Japan' if race_id is 'Japan'
            files = glob.glob(os.path.join(cache_dir, f"{race_id}_*.json"))
            
            if files:
                logger.info(f"Found {len(files)} local cache files for {race_id}")
                for fpath in files:
                    try:
                        with open(fpath, 'r') as f:
                            data = json.load(f) # dict: lap_num (str) -> list[frames]
                            # We need to flatten this into a single list of TelemetryFrame
                            for frames in data.values():
                                telemetry.extend(frames)
                    except Exception as e:
                        logger.error(f"Failed to load cache file {fpath}: {e}")
            else:
                 logger.warning(f"No local cache files found in {cache_dir} for {race_id}")

        return RaceTimeline(
            meta=meta,
            laps=laps,
            telemetry=telemetry, # Ensure this field is added to model return
            summary={"total_time_ms": 0}
        )
    except Exception as e:
        logger.error(f"Failed to fetch timeline: {e}")
        raise HTTPException(status_code=500, detail=f"Timeline fetch failed: {str(e)}")

@router.get("/{race_id}/markets")
async def get_race_markets(race_id: str):
    """Returns fantasy markets derived from the simulation node."""
    # This could eventually call simulation_engine for live odds
    return {
        "race_id": race_id,
        "markets": [
            {"driver_id": "VER", "market_type": "WINNER", "probability": 0.45, "odds": 2.2},
            {"driver_id": "NOR", "market_type": "WINNER", "probability": 0.25, "odds": 4.0}
        ]
    }
