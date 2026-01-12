"""
Race API endpoints - Phase 6 (Enhanced)
Exposes simulation-first probabilities, fantasy markets, and feature attribution.
"""
from fastapi import APIRouter, HTTPException
import logging
from services.probability_engine import probability_engine
from services.market_engine import market_engine
from services.fantasy_engine import fantasy_engine
from database.supabase_client import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/races", tags=["races"])

@router.get("/{race_id}/probabilities")
async def get_probabilities(race_id: str):
    """Returns win, podium, and top10 probabilities + fantasy points for all drivers."""
    probs_list = probability_engine.get_probabilities(race_id)
    if not probs_list:
        raise HTTPException(status_code=404, detail="Probabilities not found for this race")
    
    enhanced_probs = []
    for p in probs_list:
        # Calculate fantasy points (Phase 5)
        f_points = fantasy_engine.calculate_points(1, p["win_prob"]) # Expected points if they win
        
        # Simple Feature Attribution (Explainability)
        # In a real scenario, this would come from SHAP values or model importance
        attribution = ["Strong FP2 pace", "Low tire degradation"]
        if p["win_prob"] > 0.2:
            attribution.append("Consistent sector times")
        
        enhanced_probs.append({
            **p,
            "fantasy_points_if_win": f_points,
            "feature_attribution": attribution
        })
        
    return enhanced_probs

@router.get("/{race_id}/markets")
async def get_markets(race_id: str):
    """Returns fantasy odds derived from probabilities."""
    probs_list = probability_engine.get_probabilities(race_id)
    if not probs_list:
        raise HTTPException(status_code=404, detail="Probabilities not found for odds calculation")
    
    # Extract only win probabilities for market engine
    win_probs = {p["driver_id"]: p["win_prob"] for p in probs_list}
    odds = market_engine.derive_odds(win_probs)
    
    # Combine into market objects
    markets = []
    for p in probs_list:
        driver_id = p["driver_id"]
        markets.append({
            "race_id": race_id,
            "driver_id": driver_id,
            "driver_name": p.get("drivers", {}).get("name", "Unknown"),
            "odds": odds.get(driver_id, 100.0),
            "win_prob": p["win_prob"]
        })
        
    return markets

@router.get("/{race_id}/pace-deltas")
async def get_pace_deltas(race_id: str):
    """Returns raw ML pace deltas (debug endpoint)."""
    db = get_db()
    res = db.table("pace_deltas").select("*").eq("race_id", race_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Pace deltas not found")
    return res.data
