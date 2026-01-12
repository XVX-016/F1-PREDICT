from fastapi import APIRouter, HTTPException
from services.market_engine import market_engine

router = APIRouter(prefix="/api/markets", tags=["markets"])

@router.get("")
def list_markets():
    """List all open/locked markets."""
    return market_engine.get_open_markets()

@router.get("/{market_id}")
def get_market(market_id: str):
    """Get market details."""
    market = market_engine.get_market_by_id(market_id)
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")
    return market
