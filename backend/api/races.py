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
<<<<<<< HEAD

class SimulationRequest(BaseModel):
    tyre_deg_multiplier: float = 1.0
    sc_probability: float = 0.15
    strategy_aggression: str = "Balanced"
    weather_scenario: str = "Dry"
    grid_source: str = "Qualifying"
    seed: Optional[int] = None
=======
>>>>>>> feature/redis-telemetry-replay

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

<<<<<<< HEAD
@router.post("/{race_id}/simulate/compare")
async def compare_strategies(
    race_id: str,
    request: Dict[str, Any]
):
    """Compares two specific race strategies."""
    try:
        results = simulation_engine.compare_strategies(
            race_id=race_id,
            driver_id=request.get("driver_id", "VER"),
            strategy_a=request["strategy_a"],
            strategy_b=request["strategy_b"],
            params=request.get("params", {})
        )
        return results
    except Exception as e:
        logger.error(f"Error comparing strategies: {e}")
        raise HTTPException(status_code=500, detail="Failed to compare strategies")

@router.post("/{race_id}/simulate")
=======
@router.post("/{race_id}/simulate", response_model=SimulationResponse)
>>>>>>> feature/redis-telemetry-replay
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
        # We can use keys or a smarter way, but for now scan/keys is fine for small f1 data
        keys = r.keys(f"race:{race_id}:replay:lap:*")
        for k in sorted(keys, key=lambda x: int(x.split(":")[-1])):
            lap_data = r.hgetall(k)
            for driver, frame_json in lap_data.items():
                laps.append(json.loads(frame_json))
        
        return RaceTimeline(
            meta=meta,
            laps=laps,
            summary={"total_time_ms": 0} # Placeholder
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
