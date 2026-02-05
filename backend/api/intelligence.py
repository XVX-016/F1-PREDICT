from fastapi import APIRouter, HTTPException
import logging
from typing import Optional
from services.intelligence_service import intelligence_service
from services.simulation_engine import simulation_engine
from models.domain import IntelligenceAnalysis, SimulationRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/intelligence", tags=["Intelligence"])

@router.get("/{race_id}", response_model=IntelligenceAnalysis)
async def get_intelligence(race_id: str, drivers: Optional[str] = None):
    """
    Returns the latest high-level probabilistic analysis for a race.
    If drivers are provided, it generates an analytical baseline immediately (Zero-Sim).
    """
    try:
        if drivers:
            driver_ids = drivers.split(",")
            return intelligence_service.generate_analysis(race_id, driver_ids)
            
        # Fallback to simulation-based analysis if no driver list (for existing sandbox compatibility)
        request = SimulationRequest(
            track_id=race_id,
            iterations=1000, 
            use_ml=True,
            capture_trace=False
        )
        artifact = simulation_engine.run_simulation(request)
        analysis = intelligence_service.process_artifact(race_id, artifact)
        return analysis
    except Exception as e:
        logger.error(f"Failed to fetch intelligence analysis for {race_id}: {e}")
        raise HTTPException(status_code=500, detail="Intelligence analysis unavailable")
