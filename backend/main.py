"""
F1 Prediction Platform - Refactored Main
Simulation-first, ML-assisted architecture
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
import api.races as races
import api.drivers as drivers
import api.constructors as constructors
import api.status as status
import api.user as user

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="F1 Race Intelligence API",
    description="Deterministic physics + Monte Carlo strategy simulation for Formula 1",
    version="2.0.0"
)

# CORS middleware
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

# Add production frontend URL from env
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(drivers.router, prefix="/api/drivers", tags=["drivers"])
app.include_router(constructors.router, prefix="/api/constructors", tags=["constructors"])
app.include_router(races.router, prefix="/api/races", tags=["races"])
app.include_router(status.router, prefix="/api", tags=["status"])
app.include_router(user.router, prefix="/api/users", tags=["users"])

import api.live_telemetry as telemetry
import api.ws_race as ws_race
import api.compare as compare
import api.sc_hazard as sc_hazard
app.include_router(telemetry.router)
app.include_router(ws_race.router)
app.include_router(compare.router)
app.include_router(sc_hazard.router, prefix="/api")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "architecture": "simulation-first"
    }

@app.on_event("startup")
async def startup_event():
    """Application startup"""
    logger.info("F1 Prediction API starting up...")
    logger.info("Architecture: Simulation-first, ML-assisted")

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown"""
    logger.info("F1 Prediction API shutting down...")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)





