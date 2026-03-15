from fastapi import APIRouter, HTTPException
import logging
from typing import Optional
from services.intelligence_service import intelligence_service
from services.simulation_engine import simulation_engine
from models.domain import IntelligenceAnalysis, SimulationRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/intelligence", tags=["Intelligence"])


def _normalize_percentile_contract(analysis_dict):
    pace_distributions = analysis_dict.get("pace_distributions", {}) if isinstance(analysis_dict, dict) else {}
    for driver_id, dist in pace_distributions.items():
        if not isinstance(dist, dict):
            continue
        if "p10" not in dist and "p05" in dist:
            dist["p10"] = dist["p05"]
        if "p90" not in dist and "p95" in dist:
            dist["p90"] = dist["p95"]
        dist.pop("p05", None)
        dist.pop("p95", None)
    return analysis_dict

@router.get("/{race_id}", response_model=IntelligenceAnalysis)
async def get_intelligence(race_id: str, drivers: Optional[str] = None):
    """
    Returns the latest high-level probabilistic analysis for a race.
    Enforces the 'Inference vs Execution' boundary.
    """
    from dependencies import get_redis_client
    from datetime import datetime
    import json
    
    try:
        r = get_redis_client()
        cache_key = f"intelligence:{race_id}:latest"
        
        source = "redis"
        is_fallback = False
        analysis = None
        
        if r:
            cached_data = r.get(cache_key)
            if cached_data:
                analysis_dict = _normalize_percentile_contract(json.loads(cached_data))
                analysis = IntelligenceAnalysis(**analysis_dict)
        
        if not analysis:
            logger.info(f"No cached intelligence for {race_id}. Generating analytical baseline.")
            
            if drivers:
                driver_ids = drivers.split(",")
                analysis = intelligence_service.generate_analysis(race_id, driver_ids)
                source = "on_the_fly_inference"
            else:
                # Passive simulation fallback
                request = SimulationRequest(
                    track_id=race_id,
                    iterations=1000, 
                    use_ml=True,
                    capture_trace=False
                )
                artifact = simulation_engine.run_simulation(request)
                analysis = intelligence_service.process_artifact(race_id, artifact)
                source = "on_the_fly_simulation"
                is_fallback = True # Marked as fallback if not pre-cached

            # Cache it
            if r:
                r.set(cache_key, analysis.json(), ex=3600)

        # Explicit Metadata Guarantee
        # We wrap it in a way that the model fields are populated correctly but we disclose provenance
        analysis.explanation = f"{analysis.explanation} [Source: {source}]"
        
        return analysis
    except Exception as e:
        logger.error(f"Failed to fetch intelligence analysis for {race_id}: {e}")
        raise HTTPException(status_code=500, detail="Intelligence analysis unavailable")
