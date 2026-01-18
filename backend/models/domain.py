from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal, Any

# --- Track Domain ---

class TrackTyreWearFactors(BaseModel):
    soft: float
    medium: float
    hard: float

class TrackModel(BaseModel):
    id: str
    name: str
    laps: int
    lap_length_km: float
    pit_loss_seconds: float
    sc_probability_base: float
    tyre_wear_factors: TrackTyreWearFactors
    overtaking_difficulty: float = Field(..., ge=0, le=1) # 0.0 to 1.0
    weather_variance: float

# --- Driver Domain ---

class DriverModel(BaseModel):
    id: str
    name: str
    team: str
    pace_base_ms: float
    tyre_management: float = Field(..., ge=0, le=1) 
    racecraft: float = Field(..., ge=0, le=1)
    dnf_rate: float = Field(..., ge=0, le=1)

# --- Strategy Domain ---

class StrategyStint(BaseModel):
    compound: Literal['soft', 'medium', 'hard']
    end_lap: int

class StrategyResult(BaseModel):
    name: str
    stints: List[StrategyStint]
    expected_time_loss: float
    risk_score: float
    robustness: float

# --- Simulation Contracts ---

class SimulationRequest(BaseModel):
    track_id: str
    tyre_deg_multiplier: float = 1.0
    sc_probability: Optional[float] = None
    strategy_aggression: Literal['defensive', 'balanced', 'aggressive'] = 'balanced'
    weather_scenario: Literal['dry', 'damp', 'wet'] = 'dry'
    use_ml: bool = True
    iterations: int = 10000

class SimulationResponse(BaseModel):
    win_probability: Dict[str, float]
    dnf_risk: Dict[str, float]
    strategy_recommendation: StrategyResult
    metadata: Dict[str, Any]
