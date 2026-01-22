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

class RestartSkill(BaseModel):
    """
    Conditional skill vector activated only at SC/VSC restarts.
    Calibrated from historical restart performance data.
    """
    reaction_mu: float = Field(0.20, ge=0.10, le=0.40, description="Mean reaction delay (seconds)")
    reaction_sigma: float = Field(0.04, ge=0.02, le=0.10, description="Reaction consistency")
    aggression: float = Field(0.75, ge=0.0, le=1.0, description="Overtake attempt rate on restart")
    risk_penalty: float = Field(0.50, ge=0.0, le=1.0, description="Incident probability on restart")
    tyre_warmup_factor: float = Field(0.90, ge=0.70, le=1.0, description="Tyre temp recovery efficiency")

class DriverModel(BaseModel):
    id: str
    name: str
    team: str
    pace_base_ms: float
    tyre_management: float = Field(..., ge=0, le=1) 
    racecraft: float = Field(..., ge=0, le=1)
    dnf_rate: float = Field(..., ge=0, le=1)
    restart_skill: RestartSkill = Field(default_factory=RestartSkill)

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

# --- Simulation / Replay Core Invariants ---

class LapFrame(BaseModel):
    """
    Unified per-lap data structure.
    Strictly separates RAW (observed) from DERIVED (simulated) data.
    """
    # Identity (Common)
    lap: int
    driver_id: str
    
    # RAW fields (FastF1 / Telemetry) - Nullable if not available
    lap_time_ms: Optional[float] = None
    compound: Optional[str] = None
    position: Optional[int] = None
    
    # DERIVED fields (Simulation ONLY) - MUST be None for Replay
    tyre_wear: Optional[float] = None
    fuel_remaining_kg: Optional[float] = None
    pit_this_lap: Optional[bool] = None
    
    # Provenance (Mandatory)
    source: Literal["REPLAY", "SIMULATION", "LIVE"]
    
    # Optional metadata
    explanation: Optional[str] = None

class RaceTimeline(BaseModel):
    """
    Unified output schema for ALL agents (Backend, Replay, D3).
    """
    meta: Dict[str, Any] = Field(
        ..., 
        description="Must include source, race_id, strategy_id(opt), model_version(opt), seed(opt)"
    )
    laps: List[LapFrame]
    summary: Dict[str, Any] = Field(
        ...,
        description="Must include total_time_ms. For sim: p05, p50, p95, risk_spread_ms."
    )

# --- Simulation Contracts ---

class SimulationEvent(BaseModel):
    """
    Artificial events injected into the simulation for counterfactual analysis.
    """
    type: Literal["SC", "VSC", "WEATHER", "FAILURE"]
    lap: int
    intensity: float = 1.0 # 0.0 to 1.0 (e.g. rain intensity or failure severity)
    driver_id: Optional[str] = None # Optional: applies only to a specific driver

class SimulationRequest(BaseModel):
    track_id: str
    iterations: int = 10000
    seed: Optional[int] = None
    use_ml: bool = True
    
    # Core Parameters
    params: Dict[str, Any] = Field(
        default_factory=lambda: {
            "tyre_deg_multiplier": 1.0,
            "sc_probability": None,
            "strategy_aggression": "balanced",
            "weather_scenario": "dry"
        }
    )
    
    # Phase 3: Counterfactual Events
    events: List[SimulationEvent] = Field(default_factory=list)

class SimulationResponse(BaseModel):
    win_probability: Dict[str, float]
    dnf_risk: Dict[str, float]
    podium_probability: Dict[str, List[float]] # [P1, P2, P3]
    
    # Distribution Metrics
    pace_distributions: Dict[str, Dict[str, float]] # {driver: {p05, p50, p95}}
    robustness_score: Dict[str, float] # (p95 - p05) / p50
    
    strategy_recommendation: StrategyResult
    
    # Phase 4A: Decision Attribution
    event_attribution: Dict[str, Dict[str, float]] = Field(default_factory=dict) # {event_id: {impact_win_prob: 0.05}}
    
    metadata: Dict[str, Any]
