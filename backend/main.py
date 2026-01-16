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
from api.races import router as races_router
from api.drivers import router as drivers_router
from api.constructors import router as constructors_router
from api.live import router as live_router
from api.live_telemetry import router as telemetry_router
from api.user import router as user_router

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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(drivers.router, prefix="/api/drivers", tags=["drivers"])
app.include_router(constructors.router, prefix="/api/constructors", tags=["constructors"])
app.include_router(races.router, prefix="/api/races", tags=["races"])
app.include_router(status.router, prefix="/api", tags=["status"])
app.include_router(user_router)

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





