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

from src.services.MLPredictionService import MLPredictionService
from src.services.AutoCalibrator import AutoCalibrator
from src.services.PredictionLogger import PredictionLogger

# Initialize FastAPI app
app = FastAPI(
    title="F1 Prediction API",
    description="F1 race prediction API with automatic calibration",
    version="1.0.0"
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
ml_service = MLPredictionService(enable_logging=True)
auto_calibrator = AutoCalibrator()
logger = PredictionLogger()

# Pydantic models for API requests/responses
class RaceFeatures(BaseModel):
    race_name: str
    features: Dict[str, Any]

class RaceResult(BaseModel):
    race_name: str
    actual_results: List[str]
    race_date: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class CalibrationUpdateRequest(BaseModel):
    n_trials: int = 100
    force_update: bool = False

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "F1 Prediction API with Auto-Calibration",
        "version": "1.0.0",
        "endpoints": {
            "predict": "/predict",
            "predict_with_metadata": "/predict/with-metadata",
            "calibration_status": "/calibration/status",
            "update_calibration": "/calibration/update",
            "log_race_result": "/results/log",
            "prediction_history": "/predictions/history"
        }
    }

@app.post("/predict")
async def predict_race(race_features: RaceFeatures):
    """
    Generate predictions for a race with automatic calibration.
    """
    try:
        predictions = ml_service.predict(
            race_features=race_features.features,
            race_name=race_features.race_name
        )
        
        return {
            "race_name": race_features.race_name,
            "predictions": predictions,
            "calibration_applied": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/predict/with-metadata")
async def predict_race_with_metadata(race_features: RaceFeatures):
    """
    Generate predictions with additional metadata.
    """
    try:
        result = ml_service.predict_with_metadata(
            race_features=race_features.features,
            race_name=race_features.race_name
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/calibration/status")
async def get_calibration_status():
    """
    Get current calibration status and statistics.
    """
    try:
        status = auto_calibrator.get_calibration_status()
        ml_status = ml_service.get_calibration_status()
        
        return {
            "auto_calibrator": status,
            "ml_service": ml_status,
            "system_ready": status.get("training_races_count", 0) >= 3
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status error: {str(e)}")

@app.post("/calibration/update")
async def update_calibration(request: CalibrationUpdateRequest, background_tasks: BackgroundTasks):
    """
    Update calibration parameters based on new race results.
    """
    try:
        # Run calibration update in background
        background_tasks.add_task(
            auto_calibrator.update_calibration,
            n_trials=request.n_trials,
            force_update=request.force_update
        )
        
        return {
            "message": "Calibration update started in background",
            "n_trials": request.n_trials,
            "force_update": request.force_update
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calibration update error: {str(e)}")

@app.post("/results/log")
async def log_race_result(race_result: RaceResult):
    """
    Log actual race results for calibration training.
    """
    try:
        ml_service.log_race_result(
            race_name=race_result.race_name,
            actual_results=race_result.actual_results,
            race_date=race_result.race_date,
            additional_metadata=race_result.metadata
        )
        
        return {
            "message": f"Race results logged for {race_result.race_name}",
            "results_count": len(race_result.actual_results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Logging error: {str(e)}")

@app.get("/predictions/history")
async def get_prediction_history(race_name: Optional[str] = None):
    """
    Get prediction history for a specific race or all races.
    """
    try:
        history = ml_service.get_prediction_history(race_name)
        
        return {
            "race_name": race_name,
            "predictions_count": len(history),
            "predictions": history
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"History error: {str(e)}")

@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    try:
        # Check if calibration config exists
        calibration_status = ml_service.get_calibration_status()
        
        return {
            "status": "healthy",
            "calibration_loaded": calibration_status.get("calibration_loaded", False),
            "timestamp": ml_service._get_current_timestamp()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": ml_service._get_current_timestamp()
        }

@app.post("/calibration/reload")
async def reload_calibration():
    """
    Manually reload calibration parameters.
    """
    try:
        success = ml_service.reload_calibration()
        
        if success:
            return {"message": "Calibration reloaded successfully"}
        else:
            raise HTTPException(status_code=404, detail="Calibration config not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reload error: {str(e)}")

@app.post("/calibration/weekly-update")
async def schedule_weekly_calibration_update(background_tasks: BackgroundTasks):
    """
    Schedule a weekly calibration update (for cron job usage).
    """
    try:
        background_tasks.add_task(auto_calibrator.schedule_weekly_update)
        
        return {
            "message": "Weekly calibration update scheduled",
            "note": "This will run with 200 trials and force update"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Schedule error: {str(e)}")

# Example usage endpoints
@app.get("/example/predict")
async def example_prediction():
    """
    Example prediction using mock data.
    """
    try:
        # Mock race features
        race_features = {
            "circuit": "Monaco",
            "weather": "dry",
            "temperature": 25,
            "track_condition": "optimal"
        }
        
        predictions = ml_service.predict(
            race_features=race_features,
            race_name="Monaco Grand Prix 2024"
        )
        
        return {
            "race_name": "Monaco Grand Prix 2024",
            "features": race_features,
            "predictions": predictions,
            "calibration_applied": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Example error: {str(e)}")

@app.post("/example/log-result")
async def example_log_result():
    """
    Example race result logging.
    """
    try:
        # Mock race results
        actual_results = [
            "Charles Leclerc",
            "Max Verstappen", 
            "Lando Norris",
            "Carlos Sainz",
            "Oscar Piastri"
        ]
        
        ml_service.log_race_result(
            race_name="Monaco Grand Prix 2024",
            actual_results=actual_results,
            race_date="2024-05-26",
            additional_metadata={"weather": "dry", "safety_cars": 0}
        )
        
        return {
            "message": "Example race results logged",
            "race_name": "Monaco Grand Prix 2024",
            "winner": actual_results[0]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Example error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
