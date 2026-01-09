from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import sys
import os
from pathlib import Path

# Add the project root to the path
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

from src.services.EnhancedMLPredictionService import EnhancedMLPredictionService
from src.services.EnhancedAutoCalibrator import EnhancedAutoCalibrator
from src.services.PredictionLogger import PredictionLogger

# Initialize FastAPI app
app = FastAPI(
    title="Enhanced F1 Prediction API",
    description="Circuit and condition-aware F1 prediction service with auto-calibration",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ml_service = EnhancedMLPredictionService(
    enable_logging=True,
    use_enhanced_calibration=True,
    model_version="v2.0"
)
enhanced_calibrator = EnhancedAutoCalibrator()
logger = PredictionLogger()

# Pydantic models for request/response validation
class RaceFeatures(BaseModel):
    """Race features including circuit and conditions."""
    circuit: str
    weather: str = "dry"
    tires: str = "medium"
    safety_car_prob: float = 0.0
    temperature: float = 20.0
    track_type: str = "permanent"
    additional_features: Optional[Dict[str, Any]] = None

class RaceResult(BaseModel):
    """Actual race results."""
    race_name: str
    actual_results: List[str]  # List of driver names in finishing order
    race_date: Optional[str] = None
    additional_metadata: Optional[Dict[str, Any]] = None

class CalibrationUpdateRequest(BaseModel):
    """Request for calibration update."""
    n_trials: int = 100
    force_update: bool = False

class CalibrationInsightsRequest(BaseModel):
    """Request for calibration insights."""
    race_features: RaceFeatures

# API Endpoints
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Enhanced F1 Prediction API",
        "version": "2.0.0",
        "features": [
            "Circuit-aware calibration",
            "Condition-aware calibration",
            "Auto-calibration with Optuna",
            "Enhanced prediction logging",
            "Calibration insights"
        ],
        "endpoints": {
            "predict": "/predict",
            "predict_with_metadata": "/predict/with-metadata",
            "log_results": "/results/log",
            "calibration_status": "/calibration/status",
            "calibration_update": "/calibration/update",
            "calibration_insights": "/calibration/insights",
            "prediction_history": "/predictions/history"
        }
    }

@app.post("/predict")
async def predict_race(race_features: RaceFeatures, race_name: str = "Unknown Race"):
    """
    Generate predictions for a race with enhanced calibration.
    
    Args:
        race_features: Race features including circuit and conditions
        race_name: Name of the race
        
    Returns:
        List of calibrated driver predictions
    """
    try:
        # Convert Pydantic model to dict
        features_dict = race_features.dict()
        
        # Generate predictions
        predictions = ml_service.predict(features_dict, race_name)
        
        return {
            "race_name": race_name,
            "predictions": predictions,
            "circuit": race_features.circuit,
            "conditions": {
                "weather": race_features.weather,
                "tires": race_features.tires,
                "safety_car_prob": race_features.safety_car_prob,
                "temperature": race_features.temperature
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/predict/with-metadata")
async def predict_with_enhanced_metadata(race_features: RaceFeatures, race_name: str = "Unknown Race"):
    """
    Generate predictions with enhanced metadata including calibration factors.
    
    Args:
        race_features: Race features including circuit and conditions
        race_name: Name of the race
        
    Returns:
        Dictionary with predictions and enhanced metadata
    """
    try:
        # Convert Pydantic model to dict
        features_dict = race_features.dict()
        
        # Generate predictions with metadata
        result = ml_service.predict_with_enhanced_metadata(features_dict, race_name)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/results/log")
async def log_race_result(race_result: RaceResult):
    """
    Log actual race results for calibration training.
    
    Args:
        race_result: Actual race results
        
    Returns:
        Confirmation message
    """
    try:
        ml_service.log_race_result(
            race_name=race_result.race_name,
            actual_results=race_result.actual_results,
            race_date=race_result.race_date,
            additional_metadata=race_result.additional_metadata
        )
        
        return {
            "message": f"Race results logged successfully for {race_result.race_name}",
            "results_count": len(race_result.actual_results),
            "timestamp": ml_service._get_current_timestamp()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Logging error: {str(e)}")

@app.get("/calibration/status")
async def get_calibration_status():
    """
    Get enhanced calibration status including all layers.
    
    Returns:
        Enhanced calibration status
    """
    try:
        status = ml_service.get_enhanced_calibration_status()
        return status
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status error: {str(e)}")

@app.post("/calibration/update")
async def update_calibration(request: CalibrationUpdateRequest, background_tasks: BackgroundTasks):
    """
    Update enhanced calibration parameters in the background.
    
    Args:
        request: Calibration update request
        background_tasks: FastAPI background tasks
        
    Returns:
        Confirmation message
    """
    try:
        # Add calibration update to background tasks
        background_tasks.add_task(
            ml_service.update_enhanced_calibration,
            n_trials=request.n_trials,
            force_update=request.force_update
        )
        
        return {
            "message": "Enhanced calibration update started in background",
            "n_trials": request.n_trials,
            "force_update": request.force_update,
            "timestamp": ml_service._get_current_timestamp()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calibration update error: {str(e)}")

@app.post("/calibration/insights")
async def get_calibration_insights(request: CalibrationInsightsRequest):
    """
    Get insights about how calibration factors affect predictions.
    
    Args:
        request: Race features to analyze
        
    Returns:
        Calibration insights
    """
    try:
        # Convert Pydantic model to dict
        features_dict = request.race_features.dict()
        
        # Get calibration insights
        insights = ml_service.get_calibration_insights(features_dict)
        
        return insights
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Insights error: {str(e)}")

@app.get("/predictions/history")
async def get_prediction_history(race_name: Optional[str] = None):
    """
    Get prediction history for a specific race or all races.
    
    Args:
        race_name: Optional race name to filter by
        
    Returns:
        Prediction history
    """
    try:
        history = ml_service.get_prediction_history(race_name)
        
        return {
            "race_name": race_name,
            "history": history,
            "count": len(history)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"History error: {str(e)}")

@app.post("/calibration/reload")
async def reload_calibration():
    """
    Reload calibration parameters from config file.
    
    Returns:
        Reload status
    """
    try:
        success = ml_service.reload_calibration()
        
        if success:
            return {
                "message": "Enhanced calibration config reloaded successfully",
                "timestamp": ml_service._get_current_timestamp()
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to reload calibration config")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reload error: {str(e)}")

@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    
    Returns:
        Health status
    """
    try:
        # Check if services are initialized
        ml_status = "OK" if ml_service else "ERROR"
        calibrator_status = "OK" if enhanced_calibrator else "ERROR"
        logger_status = "OK" if logger else "ERROR"
        
        return {
            "status": "healthy",
            "services": {
                "ml_service": ml_status,
                "enhanced_calibrator": calibrator_status,
                "logger": logger_status
            },
            "timestamp": ml_service._get_current_timestamp() if ml_service else None
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": None
        }

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {
        "error": "Endpoint not found",
        "message": "The requested endpoint does not exist",
        "available_endpoints": [
            "/",
            "/predict",
            "/predict/with-metadata",
            "/results/log",
            "/calibration/status",
            "/calibration/update",
            "/calibration/insights",
            "/predictions/history",
            "/calibration/reload",
            "/health"
        ]
    }

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return {
        "error": "Internal server error",
        "message": "An unexpected error occurred",
        "timestamp": ml_service._get_current_timestamp() if ml_service else None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)





