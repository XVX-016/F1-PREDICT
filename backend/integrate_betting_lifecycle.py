"""
Integration Example for F1 Betting Lifecycle System
Shows how to integrate the betting lifecycle into your existing FastAPI backend
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any
import logging

# Import the betting lifecycle services
from services.BettingScheduler import (
    start_betting_scheduler, 
    stop_betting_scheduler, 
    get_scheduler_status,
    trigger_manual_lifecycle
)
from services.BettingLifecycleService import betting_lifecycle_service
from services.MarketService import market_service
from services.BetService import bet_service
from services.UserService import user_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="F1 Betting Platform", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event - start the betting scheduler
@app.on_event("startup")
async def startup_event():
    """Start the betting lifecycle scheduler on app startup"""
    try:
        logger.info("🚀 Starting F1 Betting Lifecycle System...")
        if start_betting_scheduler():
            logger.info("✅ Betting lifecycle scheduler started successfully")
        else:
            logger.error("❌ Failed to start betting lifecycle scheduler")
    except Exception as e:
        logger.error(f"❌ Error starting betting lifecycle system: {e}")

# Shutdown event - stop the betting scheduler
@app.on_event("shutdown")
async def shutdown_event():
    """Stop the betting lifecycle scheduler on app shutdown"""
    try:
        logger.info("🛑 Stopping F1 Betting Lifecycle System...")
        if stop_betting_scheduler():
            logger.info("✅ Betting lifecycle scheduler stopped successfully")
        else:
            logger.error("❌ Failed to stop betting lifecycle scheduler")
    except Exception as e:
        logger.error(f"❌ Error stopping betting lifecycle system: {e}")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "F1 Betting Platform",
        "betting_lifecycle": "active"
    }

# Betting lifecycle endpoints
@app.get("/api/betting/lifecycle/status")
async def get_lifecycle_status():
    """Get current betting lifecycle status"""
    try:
        status = betting_lifecycle_service.get_lifecycle_status()
        return status
    except Exception as e:
        logger.error(f"❌ Error getting lifecycle status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/betting/lifecycle/run")
async def run_lifecycle_manual():
    """Manually trigger betting lifecycle check"""
    try:
        result = trigger_manual_lifecycle()
        return result
    except Exception as e:
        logger.error(f"❌ Error running manual lifecycle: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/betting/scheduler/status")
async def get_scheduler_status_endpoint():
    """Get scheduler status"""
    try:
        status = get_scheduler_status()
        return status
    except Exception as e:
        logger.error(f"❌ Error getting scheduler status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Market endpoints
@app.get("/api/betting/markets/status")
async def get_markets_status():
    """Get markets status"""
    try:
        status = market_service.get_markets_status()
        return {"status": "success", "data": status}
    except Exception as e:
        logger.error(f"❌ Error getting markets status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/betting/markets/race/{race_id}")
async def get_race_markets(race_id: str):
    """Get markets for a specific race"""
    try:
        markets = market_service.get_race_markets(race_id)
        if markets:
            return {"status": "success", "data": markets}
        else:
            return {"status": "not_found", "message": f"No markets found for race {race_id}"}
    except Exception as e:
        logger.error(f"❌ Error getting race markets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/betting/markets/active")
async def get_active_markets():
    """Get all active markets"""
    try:
        markets = market_service.get_all_active_markets()
        return {"status": "success", "data": markets}
    except Exception as e:
        logger.error(f"❌ Error getting active markets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Bet endpoints
@app.post("/api/betting/bets/place")
async def place_bet(bet_data: Dict[str, Any]):
    """Place a new bet"""
    try:
        required_fields = ["user_id", "race_id", "market_id", "selection", "stake", "odds"]
        for field in required_fields:
            if field not in bet_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        result = bet_service.place_bet(
            user_id=bet_data["user_id"],
            race_id=bet_data["race_id"],
            market_id=bet_data["market_id"],
            selection=bet_data["selection"],
            stake=float(bet_data["stake"]),
            odds=float(bet_data["odds"])
        )
        
        return result
    except Exception as e:
        logger.error(f"❌ Error placing bet: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/betting/bets/user/{user_id}")
async def get_user_bets(user_id: str):
    """Get all bets for a specific user"""
    try:
        bets = bet_service.get_user_bets(user_id)
        return bets
    except Exception as e:
        logger.error(f"❌ Error getting user bets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/betting/bets/race/{race_id}")
async def get_race_bets(race_id: str):
    """Get all bets for a specific race"""
    try:
        bets = bet_service.get_race_bets(race_id)
        return bets
    except Exception as e:
        logger.error(f"❌ Error getting race bets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/betting/bets/status")
async def get_bets_status():
    """Get bets status"""
    try:
        status = bet_service.get_bets_status()
        return {"status": "success", "data": status}
    except Exception as e:
        logger.error(f"❌ Error getting bets status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# User endpoints
@app.post("/api/betting/users/create")
async def create_user(user_data: Dict[str, Any]):
    """Create a new user"""
    try:
        required_fields = ["user_id", "username"]
        for field in required_fields:
            if field not in user_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        result = user_service.create_user(
            user_id=user_data["user_id"],
            username=user_data["username"],
            email=user_data.get("email")
        )
        
        return result
    except Exception as e:
        logger.error(f"❌ Error creating user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/betting/users/{user_id}")
async def get_user(user_id: str):
    """Get user information"""
    try:
        user = user_service.get_user(user_id)
        if user:
            return {"status": "success", "data": user}
        else:
            return {"status": "not_found", "message": f"User {user_id} not found"}
    except Exception as e:
        logger.error(f"❌ Error getting user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/betting/users/{user_id}/statistics")
async def get_user_statistics(user_id: str):
    """Get user betting statistics"""
    try:
        stats = user_service.get_user_statistics(user_id)
        return stats
    except Exception as e:
        logger.error(f"❌ Error getting user statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/betting/patterns")
async def get_betting_patterns():
    """Get aggregated betting patterns"""
    try:
        patterns = user_service.get_player_betting_patterns()
        return {"status": "success", "data": patterns}
    except Exception as e:
        logger.error(f"❌ Error getting betting patterns: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Admin endpoints
@app.post("/api/betting/admin/close-markets/{race_id}")
async def close_markets_admin(race_id: str):
    """Admin endpoint to manually close markets"""
    try:
        result = betting_lifecycle_service.close_current_markets(race_id)
        return result
    except Exception as e:
        logger.error(f"❌ Error closing markets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/betting/admin/settle-race/{race_id}")
async def settle_race_admin(race_id: str, results: Dict[str, Any]):
    """Admin endpoint to manually settle race bets"""
    try:
        # Store results first
        from services.ResultService import result_service
        result_service.store_results(race_id, results)
        
        # Then settle bets
        result = betting_lifecycle_service.settle_race(race_id)
        return result
    except Exception as e:
        logger.error(f"❌ Error settling race: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/betting/admin/generate-markets")
async def generate_markets_admin():
    """Admin endpoint to manually generate new markets"""
    try:
        result = betting_lifecycle_service.generate_next_markets()
        return result
    except Exception as e:
        logger.error(f"❌ Error generating markets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)







