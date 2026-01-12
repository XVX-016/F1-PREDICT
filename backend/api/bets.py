from fastapi import APIRouter, HTTPException, Depends, Body
from services.bet_service import bet_service
from dependencies import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/bets", tags=["bets"])

class BetRequest(BaseModel):
    market_id: str
    option_id: str
    stake: int

@router.post("")
def place_bet(payload: BetRequest, user = Depends(get_current_user)):
    """Place a bet for the authenticated user."""
    result = bet_service.place_bet(user.id, payload.dict())
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result

@router.get("/my-bets")
def get_my_bets(user = Depends(get_current_user)):
    """Get bets for the authenticated user."""
    return bet_service.get_user_bets(user.id)
