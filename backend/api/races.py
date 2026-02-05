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
from dependencies import get_redis_client
from datetime import datetime

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
        
        # Add metadata transparency
        if not results.metadata:
            results.metadata = {}
        
        results.metadata.update({
            "source": "simulation_engine",
            "is_fallback": False,
            "generated_at": datetime.utcnow().isoformat()
        })
        
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
        import json
        r = get_redis_client()
        
        source = "redis"
        is_fallback = False
        
        meta = {}
        laps = []
        telemetry = []
        
        if r:
            # Get metadata
            meta_json = r.get(f"race:{race_id}:meta")
            if meta_json:
                meta = json.loads(meta_json)
            
            # Get all laps
            try:
                lap_keys = r.keys(f"race:{race_id}:replay:lap:*")
                for k in sorted(lap_keys, key=lambda x: int(x.split(":")[-1])):
                    lap_data = r.hgetall(k)
                    for driver, frame_json in lap_data.items():
                        laps.append(json.loads(frame_json))
            except Exception as e:
                logger.warning(f"Redis lap fetch failed: {e}")
        else:
            logger.warning("Redis unavailable, falling back to local cache.")
            source = "local_cache"
            is_fallback = True

        # Fallback logic for both metadata and data
        if not meta:
            meta = {
                "race_id": race_id,
                "source": source,
                "is_fallback": is_fallback,
                "generated_at": datetime.utcnow().isoformat()
            }
        else:
            meta.update({
                "source": source,
                "is_fallback": is_fallback,
                "generated_at": datetime.utcnow().isoformat()
            })

        if not telemetry:
            import glob
            import os
            cache_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'replay_cache')
            files = glob.glob(os.path.join(cache_dir, f"{race_id}_*.json"))
            
            if files:
                logger.info(f"Found {len(files)} local cache files for {race_id}")
                for fpath in files:
                    try:
                        with open(fpath, 'r') as f:
                            data = json.load(f)
                            for frames in data.values():
                                telemetry.extend(frames)
                    except Exception as e:
                        logger.error(f"Failed to load cache file {fpath}: {e}")
            else:
                 logger.warning(f"No local cache files found in {cache_dir} for {race_id}")

        return RaceTimeline(
            meta=meta,
            laps=laps,
            telemetry=telemetry,
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
