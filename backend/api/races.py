"""
Race API endpoints - Phase 6 (Enhanced)
Exposes simulation-first probabilities, fantasy markets, and feature attribution.
"""
from fastapi import APIRouter, HTTPException
import logging
from services.probability_engine import probability_engine
from database.supabase_client import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/races", tags=["races"])

@router.get("/")
async def get_races(season: int = 2025):
    """Get race calendar for a specific season (default 2025)"""
    try:
        db = get_db()
        # Fetch all columns including new session times and circuit images
        # We perform a client-side filter for now or rely on 'season' column if consistent
        response = db.table("races").select("*").order("round").execute()
        
        # Simple Python filter if needed, or rely on query param if the column exists and is reliable
        races = response.data
        if season:
             races = [r for r in races if r.get('season') == season]
             
        return races
    except Exception as e:
        logger.error(f"Error fetching races: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch races")

@router.get("/{race_id}/pace-deltas")
async def get_pace_deltas(race_id: str):
    """Returns raw ML pace deltas (debug endpoint)."""
    db = get_db()
    res = db.table("pace_deltas").select("*").eq("race_id", race_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Pace deltas not found")
    return res.data
