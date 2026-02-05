from fastapi import APIRouter, HTTPException
import logging
from typing import List
from models.domain import LapFrame, SimulationRequest
from services.simulation_engine import simulation_engine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/baseline", tags=["Baseline"])

from services.baseline_service import baseline_service

# ...

@router.get("/{race_id}/summary")
async def get_baseline_summary(race_id: str, drivers: str):
    """
    Returns deterministic race order summary for the bar chart.
    'drivers' should be comma-separated IDs.
    """
    try:
        driver_ids = drivers.split(",")
        return baseline_service.compute_expected_race_order(race_id, driver_ids)
    except Exception as e:
        logger.error(f"Failed to fetch baseline summary for {race_id}: {e}")
        raise HTTPException(status_code=500, detail="Baseline summary unavailable")

@router.get("/{race_id}", response_model=List[LapFrame])
async def get_baseline_pace(race_id: str):
    """
    Returns physics-only expected pace data (lap-by-lap traces).
    This is the ground truth (deterministic baseline) for charts.
    """
    try:
        request = SimulationRequest(
            track_id=race_id,
            iterations=1, # Solo run for baseline
            use_ml=False, # Pure physics
            capture_trace=True
        )
        artifact = simulation_engine.run_simulation(request)
        if not artifact.trace:
            raise HTTPException(status_code=404, detail="Baseline trace could not be generated")
        return artifact.trace
    except Exception as e:
        logger.error(f"Failed to fetch baseline for {race_id}: {e}")
        raise HTTPException(status_code=500, detail="Baseline trace unavailable")
