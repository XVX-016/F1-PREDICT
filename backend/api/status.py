from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from services.RaceCalendarService import RaceCalendarService

router = APIRouter()
calendar_service = RaceCalendarService()

@router.get("/race-status")
async def get_race_status():
    """
    Returns the current status of the active race weekend.
    Used by the Homepage and Simulation Header.
    """
    try:
        status = calendar_service.get_current_race_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
