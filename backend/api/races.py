"""
Race API endpoints
Returns probabilities only - no winner/position predictions
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import logging
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from services.probability_engine import probability_engine
from services.market_engine import market_engine
from database.supabase_client import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/races", tags=["races"])

@router.get("/{race_id}/probabilities")
async def get_race_probabilities(race_id: str):
    """
    Get outcome probabilities for a race
    
    Returns:
        Dict mapping driver_id to probabilities (win, podium, top10)
    """
    try:
        probabilities = probability_engine.get_probabilities(race_id)
        
        if probabilities is None:
            raise HTTPException(
                status_code=404,
                detail=f"No probabilities found for race {race_id}"
            )
        
        return {
            "race_id": race_id,
            "probabilities": probabilities
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get probabilities: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{race_id}/markets")
async def get_race_markets(race_id: str):
    """
    Get fantasy markets for a race
    
    Returns:
        List of market entries with odds
    """
    try:
        # Get probabilities
        probabilities = probability_engine.get_probabilities(race_id)
        if probabilities is None:
            raise HTTPException(
                status_code=404,
                detail=f"No probabilities found for race {race_id}"
            )
        
        # Get driver names
        db = get_db()
        driver_ids = list(probabilities.keys())
        drivers_result = db.table("drivers").select("id,name").in_(
            "id", driver_ids
        ).execute()
        
        driver_names = {row["id"]: row["name"] for row in drivers_result.data}
        
        # Create markets
        markets = market_engine.create_markets(
            race_id,
            probabilities,
            driver_names
        )
        
        return {
            "race_id": race_id,
            "markets": markets
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get markets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{race_id}/pace-deltas")
async def get_race_pace_deltas(race_id: str):
    """
    Get ML pace deltas for a race (for debugging)
    
    Returns:
        Dict mapping driver_id to pace_delta_ms
    """
    try:
        db = get_db()
        result = db.table("pace_deltas").select("*").eq(
            "race_id", race_id
        ).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=404,
                detail=f"No pace deltas found for race {race_id}"
            )
        
        pace_deltas = {
            row["driver_id"]: row["pace_delta_ms"]
            for row in result.data
        }
        
        return {
            "race_id": race_id,
            "pace_deltas": pace_deltas
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get pace deltas: {e}")
        raise HTTPException(status_code=500, detail=str(e))

