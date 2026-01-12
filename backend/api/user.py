from fastapi import APIRouter, HTTPException, Depends
from services.user_service import user_service
from dependencies import get_current_user

router = APIRouter(prefix="/api/user", tags=["user"])

@router.get("/me")
def get_my_profile(user = Depends(get_current_user)):
    """Get authenticated user profile."""
    profile = user_service.get_profile(user.id)
    return profile

@router.get("/points")
def get_my_points(user = Depends(get_current_user)):
    """Get authenticated user points balance."""
    points = user_service.get_points(user.id)
    return points

@router.get("/transactions")
def get_my_transactions(user = Depends(get_current_user)):
    """Get authenticated user transactions."""
    from database.supabase_client import get_db
    try:
        db = get_db()
        res = db.table("transactions").select("*").eq("user_id", user.id).order("created_at", desc=True).limit(50).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
