"""
Race API endpoints
Exposes track-first simulation and real strategy optimization.
"""
from fastapi import APIRouter, HTTPException
import logging
from typing import Dict, Any, Optional
from services.simulation_engine import simulation_engine
from database.supabase_client import get_db
from models.domain import SimulationRequest, SimulationResponse

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
        # Force the track_id from path if needed, or assume request matches
        request.track_id = race_id # Simplification for Phase 1
        logger.info(f"Triggering track-first simulation for {race_id}")
        results = simulation_engine.run_simulation(request)
        return results
    except Exception as e:
        logger.error(f"Simulation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

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
