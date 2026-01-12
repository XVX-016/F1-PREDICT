from fastapi import APIRouter, HTTPException
from database.supabase_client import get_db
import logging

router = APIRouter(prefix="/api/constructors", tags=["constructors"])
logger = logging.getLogger(__name__)

@router.get("/")
async def get_constructors():
    """Get all constructors"""
    try:
        db = get_db()
        response = db.table("constructors").select("*").execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching constructors: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch constructors")
