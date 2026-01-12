"""
Driver API endpoints - Phase 6
"""
from fastapi import APIRouter, HTTPException
from database.supabase_client import get_db

router = APIRouter(prefix="/api/drivers", tags=["drivers"])

@router.get("/")
async def get_drivers():
    """Get all active drivers with their team details"""
    try:
        db = get_db()
        # Fetch drivers with their constructor details using Supabase join syntax
        response = db.table("drivers").select("*, constructors(name, color)").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{driver_id}/telemetry-summary")
async def get_telemetry(driver_id: str):
    """Returns the most recent telemetry feature aggregation for a driver."""
    db = get_db()
    res = db.table("telemetry_features")\
        .select("*")\
        .eq("driver_id", driver_id)\
        .order("created_at", desc=True)\
        .limit(1)\
        .execute()
        
    if not res.data:
        raise HTTPException(status_code=404, detail="Telemetry not found for this driver")
    return res.data[0]
