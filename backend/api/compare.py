from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from models.domain import SimulationRequest, StrategyResult, StrategyStint, SimulationResponse
from services.simulation_engine import simulation_engine
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/races", tags=["analysis"])

class ComparisonRequest(SimulationRequest):
    strategies: List[StrategyResult] # The two strategies to compare

@router.post("/{race_id}/compare")
async def compare_strategies(race_id: str, request: ComparisonRequest):
    """
    Head-to-head comparison of specific strategies under identical Monte Carlo conditions.
    """
    if len(request.strategies) != 2:
        raise HTTPException(status_code=400, detail="Comparison requires exactly two strategies.")

    try:
        # Run comparison via engine
        comparison_results = simulation_engine.run_comparison(
            request=request, 
            strategies=request.strategies
        )
        
        return {
            "race_id": race_id,
            "baseline": comparison_results[0],
            "challenger": comparison_results[1]
        }
    except Exception as e:
        logger.error(f"Comparison Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
