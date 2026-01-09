"""
Driver API endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import Optional
import logging
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from database.supabase_client import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/drivers", tags=["drivers"])

@router.get("/{driver_id}/telemetry-summary")
async def get_driver_telemetry_summary(driver_id: str, race_id: Optional[str] = None):
    """
    Get aggregated telemetry summary for a driver
    
    Returns:
        Aggregated telemetry features (no raw telemetry)
    """
    try:
        db = get_db()
        
        query = db.table("telemetry_features").select("*").eq("driver_id", driver_id)
        
        if race_id:
            query = query.eq("race_id", race_id)
        
        result = query.execute()
        
        if not result.data:
            raise HTTPException(
                status_code=404,
                detail=f"No telemetry data found for driver {driver_id}"
            )
        
        return {
            "driver_id": driver_id,
            "telemetry": result.data
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get telemetry summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

