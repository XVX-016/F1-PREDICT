"""
SC Hazard API - Real-Time Safety Car Probability Inference
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from services.sc_hazard_model import sc_hazard_model, SCHazardFeatures

router = APIRouter(tags=["Hazard"])

class SCHazardRequest(BaseModel):
    track_id: str
    current_lap: int
    total_laps: int
    gap_compression: float = 0.5
    tyre_age_variance: float = 0.3
    weather_intensity: float = 0.0
    aggression_index: float = 0.75
    lapped_traffic_density: float = 0.2

class SCHazardResponse(BaseModel):
    sc_probability_next_5_laps: float
    vsc_probability: float
    dominant_factors: List[str]
    confidence: float

@router.post("/hazard/sc", response_model=SCHazardResponse)
def predict_sc_probability(request: SCHazardRequest):
    """
    Predict Safety Car probability for the next 5 laps.
    """
    features = SCHazardFeatures(
        gap_compression=request.gap_compression,
        tyre_age_variance=request.tyre_age_variance,
        weather_intensity=request.weather_intensity,
        track_incident_density=sc_hazard_model.track_baselines.get(request.track_id, 0.2),
        aggression_index=request.aggression_index,
        lapped_traffic_density=request.lapped_traffic_density
    )
    
    prediction = sc_hazard_model.predict_next_n_laps(
        track_id=request.track_id,
        features=features,
        current_lap=request.current_lap,
        total_laps=request.total_laps,
        n_laps=5
    )
    
    return SCHazardResponse(
        sc_probability_next_5_laps=prediction.sc_probability_next_5_laps,
        vsc_probability=prediction.vsc_probability,
        dominant_factors=prediction.dominant_factors,
        confidence=prediction.confidence
    )
