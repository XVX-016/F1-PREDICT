"""
F1 Prediction Platform - Refactored Main
Simulation-first, ML-assisted architecture
"""
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
from api.races import router as races_router
from api.drivers import router as drivers_router
from api.live import router as live_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="F1 Prediction API",
    description="Simulation-first F1 prediction platform",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(races_router)
app.include_router(drivers_router)
app.include_router(live_router)

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





