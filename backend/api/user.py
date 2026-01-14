from fastapi import APIRouter, HTTPException, Depends
from services.user_service import user_service
from dependencies import get_current_user

router = APIRouter(prefix="/api/user", tags=["user"])

@router.get("/me")
def get_my_profile(user = Depends(get_current_user)):
    """Get authenticated user profile."""
    profile = user_service.get_profile(user.id)
    return profile


