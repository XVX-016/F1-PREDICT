#!/usr/bin/env python3
"""
FastAPI Integration for F1 Calibration Auto-Tuning Service

This module provides REST API endpoints for triggering calibration optimization
and managing calibration parameters. It integrates with the AutoCalibrationService.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import asyncio
import json
from datetime import datetime
import logging

from auto_calibration_service import AutoCalibrationService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="F1 Calibration Auto-Tuning API",
    description="API for automatically optimizing F1 prediction calibration parameters",
    version="1.0.0"
)

# Global service instance
calibration_service = AutoCalibrationService()

# Pydantic models for API requests/responses
class OptimizationRequest(BaseModel):
    n_trials: int = 100
    study_name: str = "f1_calibration"
    config_path: Optional[str] = None

class OptimizationResponse(BaseModel):
    status: str
    message: str
    best_params: Optional[Dict[str, Any]] = None
    best_loss: Optional[float] = None
    optimization_id: Optional[str] = None
    timestamp: str

class CalibrationStatus(BaseModel):
    status: str
    current_params: Optional[Dict[str, Any]] = None
    last_optimization: Optional[str] = None
    best_loss: Optional[float] = None

class HistoricalDataRequest(BaseModel):
    race_name: str
    predictions: Dict[str, float]
    actual_winner: str

# Background task storage
optimization_tasks = {}

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "F1 Calibration Auto-Tuning API",
        "version": "1.0.0",
        "endpoints": {
            "/calibration/status": "Get current calibration status",
            "/calibration/optimize": "Start optimization (POST)",
            "/calibration/optimize/{task_id}": "Get optimization status",
            "/calibration/params": "Get current parameters",
            "/calibration/params/update": "Update parameters manually (POST)",
            "/calibration/historical/add": "Add historical race data (POST)"
        }
    }

@app.get("/calibration/status")
async def get_calibration_status() -> CalibrationStatus:
    """Get current calibration status and parameters."""
    try:
        # Load current parameters if they exist
        current_params = None
        last_optimization = None
        best_loss = None
        
        try:
            with open(calibration_service.config_path, 'r') as f:
                config = json.load(f)
                current_params = config
                last_optimization = config.get('optimization_metadata', {}).get('optimized_at')
                best_loss = config.get('optimization_metadata', {}).get('best_loss')
        except FileNotFoundError:
            pass
        
        return CalibrationStatus(
            status="ready",
            current_params=current_params,
            last_optimization=last_optimization,
            best_loss=best_loss
        )
        
    except Exception as e:
        logger.error(f"Error getting calibration status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/calibration/optimize")
async def start_optimization(
    request: OptimizationRequest,
    background_tasks: BackgroundTasks
) -> OptimizationResponse:
    """Start calibration optimization in the background."""
    try:
        # Generate optimization ID
        optimization_id = f"opt_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Update service config path if provided
        if request.config_path:
            calibration_service.config_path = request.config_path
        
        # Start background optimization
        background_tasks.add_task(
            run_optimization_background,
            optimization_id,
            request.n_trials,
            request.study_name
        )
        
        # Store task info
        optimization_tasks[optimization_id] = {
            "status": "running",
            "started_at": datetime.now().isoformat(),
            "n_trials": request.n_trials,
            "study_name": request.study_name
        }
        
        return OptimizationResponse(
            status="started",
            message=f"Optimization started with ID: {optimization_id}",
            optimization_id=optimization_id,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error starting optimization: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/calibration/optimize/{task_id}")
async def get_optimization_status(task_id: str) -> OptimizationResponse:
    """Get status of a specific optimization task."""
    try:
        if task_id not in optimization_tasks:
            raise HTTPException(status_code=404, detail="Optimization task not found")
        
        task_info = optimization_tasks[task_id]
        
        # Check if optimization is complete
        if task_info["status"] == "running":
            return OptimizationResponse(
                status="running",
                message=f"Optimization {task_id} is still running",
                optimization_id=task_id,
                timestamp=task_info["started_at"]
            )
        elif task_info["status"] == "completed":
            return OptimizationResponse(
                status="completed",
                message=f"Optimization {task_id} completed successfully",
                best_params=task_info.get("best_params"),
                best_loss=task_info.get("best_loss"),
                optimization_id=task_id,
                timestamp=task_info["started_at"]
            )
        elif task_info["status"] == "failed":
            return OptimizationResponse(
                status="failed",
                message=f"Optimization {task_id} failed: {task_info.get('error')}",
                optimization_id=task_id,
                timestamp=task_info["started_at"]
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting optimization status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/calibration/params")
async def get_current_params() -> Dict[str, Any]:
    """Get current calibration parameters."""
    try:
        with open(calibration_service.config_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="No calibration parameters found")
    except Exception as e:
        logger.error(f"Error loading parameters: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/calibration/params/update")
async def update_params(params: Dict[str, Any]) -> Dict[str, str]:
    """Manually update calibration parameters."""
    try:
        # Add metadata
        params["optimization_metadata"] = {
            "optimized_at": datetime.now().isoformat(),
            "method": "manual_update",
            "best_loss": None
        }
        
        # Save parameters
        with open(calibration_service.config_path, 'w') as f:
            json.dump(params, f, indent=2)
        
        return {"message": "Parameters updated successfully"}
        
    except Exception as e:
        logger.error(f"Error updating parameters: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/calibration/historical/add")
async def add_historical_data(request: HistoricalDataRequest) -> Dict[str, str]:
    """Add historical race data for optimization."""
    try:
        # In a real implementation, you would store this in a database
        # For now, we'll just log it
        logger.info(f"Added historical data for {request.race_name}: {request.actual_winner} won")
        
        return {
            "message": f"Historical data added for {request.race_name}",
            "winner": request.actual_winner
        }
        
    except Exception as e:
        logger.error(f"Error adding historical data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/calibration/optimize/active")
async def get_active_optimizations() -> List[Dict[str, Any]]:
    """Get list of active optimization tasks."""
    try:
        active_tasks = [
            {
                "task_id": task_id,
                "status": task_info["status"],
                "started_at": task_info["started_at"],
                "n_trials": task_info["n_trials"]
            }
            for task_id, task_info in optimization_tasks.items()
            if task_info["status"] == "running"
        ]
        return active_tasks
        
    except Exception as e:
        logger.error(f"Error getting active optimizations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def run_optimization_background(task_id: str, n_trials: int, study_name: str):
    """Run optimization in background task."""
    try:
        logger.info(f"Starting background optimization {task_id}")
        
        # Run optimization
        best_params = calibration_service.optimize(n_trials=n_trials, study_name=study_name)
        
        # Save parameters
        calibration_service.save_parameters()
        
        # Generate TypeScript code
        ts_code = calibration_service.generate_typescript_params()
        ts_path = calibration_service.config_path.replace('.json', '.ts')
        with open(ts_path, 'w') as f:
            f.write(ts_code)
        
        # Update task status
        optimization_tasks[task_id].update({
            "status": "completed",
            "completed_at": datetime.now().isoformat(),
            "best_params": best_params,
            "best_loss": calibration_service.study.best_value if calibration_service.study else None
        })
        
        logger.info(f"Background optimization {task_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Background optimization {task_id} failed: {e}")
        optimization_tasks[task_id].update({
            "status": "failed",
            "failed_at": datetime.now().isoformat(),
            "error": str(e)
        })

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    
    # Run the FastAPI server
    uvicorn.run(
        "fastapi_calibration_service:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )


