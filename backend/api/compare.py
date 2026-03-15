from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from models.domain import SimulationRequest, StrategyResult, StrategyStint, SimulationResponse
from services.simulation_engine import simulation_engine
from services.simulation_cache import build_simulation_cache_key, normalize_simulation_request, read_cache, write_cache
from services.simulation_history_service import simulation_history_service
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
        request_payload = request.model_dump()
        cache_key = build_simulation_cache_key(race_id, request_payload, suffix="comparison")
        cached = read_cache(cache_key)
        if cached:
            return cached

        # Run comparison via engine
        comparison_results = simulation_engine.run_comparison(
            request=request, 
            strategies=request.strategies
        )

        baseline = comparison_results[0].model_dump()
        challenger = comparison_results[1].model_dump()
        focus_driver = request.params.get("focus_driver", "VER") if isinstance(request.params, dict) else "VER"
        baseline_p50 = float(baseline.get("pace_distributions", {}).get(focus_driver, {}).get("p50", 0.0))
        challenger_p50 = float(challenger.get("pace_distributions", {}).get(focus_driver, {}).get("p50", 0.0))

        payload = {
            "race_id": race_id,
            "baseline": baseline,
            "challenger": challenger,
            "delta": {
                "focus_driver": focus_driver,
                "win_probability": float(challenger.get("win_probability", {}).get(focus_driver, 0.0)) - float(baseline.get("win_probability", {}).get(focus_driver, 0.0)),
                "median_race_time_ms": challenger_p50 - baseline_p50,
                "risk_spread": float(challenger.get("robustness_score", {}).get(focus_driver, 0.0)) - float(baseline.get("robustness_score", {}).get(focus_driver, 0.0)),
            }
        }
        write_cache(cache_key, payload)
        simulation_history_service.record_run(
            race_id=race_id,
            request_payload=normalize_simulation_request(request_payload),
            response_payload=baseline,
            user_id=(request.params or {}).get("user_id"),
            comparison_payload=payload,
        )
        return payload
    except Exception as e:
        logger.error(f"Comparison Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
