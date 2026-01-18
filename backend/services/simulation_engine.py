import numpy as np
import logging
import time
from typing import Dict, List, Any, Optional
from engine.simulation.simulator import RaceSimulator
from services.strategy_optimizer import StrategyOptimizer
from models.domain import TrackModel, DriverModel, StrategyResult, StrategyStint, SimulationRequest, SimulationResponse, TrackTyreWearFactors

logger = logging.getLogger(__name__)

class SimulationEngine:
    """
    Orchestrates deterministic physics models and Monte Carlo sampling.
    """
    
    def __init__(self):
        self.simulator = RaceSimulator()
        self.optimizer = StrategyOptimizer(self.simulator)
        self.model_version = "v3.0.0-engineering"

    def _get_track_context(self, track_id: str) -> TrackModel:
        """
        Fetches track metadata. Hardcoded for Phase 1.
        """
        # In production: fetch from Supabase 'tracks' table
        tracks = {
            "abu_dhabi": TrackModel(
                id="abu_dhabi",
                name="Yas Marina Circuit",
                laps=58,
                lap_length_km=5.281,
                pit_loss_seconds=22.5,
                sc_probability_base=0.18,
                tyre_wear_factors=TrackTyreWearFactors(soft=0.08, medium=0.04, hard=0.02),
                overtaking_difficulty=0.75,
                weather_variance=0.1
            ),
            "bahrain": TrackModel(
                id="bahrain",
                name="Sakhir International Circuit",
                laps=57,
                lap_length_km=5.412,
                pit_loss_seconds=23.1,
                sc_probability_base=0.12,
                tyre_wear_factors=TrackTyreWearFactors(soft=0.12, medium=0.06, hard=0.03),
                overtaking_difficulty=0.4,
                weather_variance=0.05
            )
        }
        return tracks.get(track_id, tracks["abu_dhabi"])

    def _get_driver_profiles(self, track_id: str, use_ml: bool) -> Dict[str, DriverModel]:
        """
        Aggregates driver capabilities.
        """
        # In production: fetch from ML model store + driver database
        driver_ids = ["VER", "NOR", "LEC", "PIA", "SAI", "HAM", "RUS", "ALO", "PER", "STR"]
        profiles = {}
        for i, d in enumerate(driver_ids):
            # ML Residual Pace (ms offset)
            # If use_ml=False, we only use physics-based field spread
            ml_offset = 0.0
            if use_ml:
                # Mock ML output: VER is fastest, field spread is ~2s
                ml_offset = (i * 150) - 500 # VER is -500ms vs field base
                ml_offset += np.random.normal(0, 30) # Inference noise
                
            profiles[d] = DriverModel(
                id=d,
                name=d, # Placeholder
                team="FIELD", # Placeholder
                pace_base_ms=90000 + ml_offset,
                tyre_management=0.85 if d=="HAM" else (0.95 if d=="VER" else 0.75),
                racecraft=0.9 if d=="VER" else 0.8,
                dnf_rate=0.02
            )
        return profiles

    def run_simulation(self, request: SimulationRequest) -> SimulationResponse:
        """
        Primary entry point for Monte Carlo execution.
        """
        logger.info(f"SimulationEngine: Starting run for track={request.track_id}, iterations={request.iterations}")
        
        track = self._get_track_context(request.track_id)
        driver_profiles = self._get_driver_profiles(request.track_id, request.use_ml)
        
        # 1. Optimize Strategy for Focus Driver (VER)
        focus_driver = "VER"
        logger.info(f"SimulationEngine: Optimizing strategy for {focus_driver}...")
        recommended_strategy = self.optimizer.optimize(
            track=track,
            driver_profile=driver_profiles[focus_driver],
            params=request.dict(),
            iterations=400 # Reduced for better web responsiveness
        )
        logger.info(f"SimulationEngine: Strategy optimized: {recommended_strategy.name}")

        # 2. Run Main Monte Carlo Simulation
        win_counts = {d: 0 for d in driver_profiles}
        dnf_counts = {d: 0 for d in driver_profiles}
        
        logger.info(f"SimulationEngine: Starting MC loop ({request.iterations} iters)...")
        
        # Use simple strategy for field, recommended for focus
        field_strategy = StrategyResult(
            name="Field Default",
            stints=[
                StrategyStint(compound="medium", end_lap=track.laps // 2),
                StrategyStint(compound="hard", end_lap=track.laps)
            ],
            expected_time_loss=0, risk_score=0, robustness=0
        )
        
        driver_strategies = {d: field_strategy for d in driver_profiles}
        driver_strategies[focus_driver] = recommended_strategy

        start_time = time.time()
        iterations = request.iterations
        for _ in range(iterations):
            race_times, _ = self.simulator.simulate_race(
                track=track,
                driver_profiles=driver_profiles,
                driver_strategies=driver_strategies,
                tyre_deg_multiplier=request.tyre_deg_multiplier,
                sc_prob_override=request.sc_probability
            )
            
            # Aggregate Rankings
            winners = sorted([d for d in race_times if race_times[d] != float('inf')], 
                            key=lambda x: race_times[x])
            
            if winners:
                win_counts[winners[0]] += 1
            
            for d in driver_profiles:
                if race_times[d] == float('inf'):
                    dnf_counts[d] += 1
            
        compute_ms = int((time.time() - start_time) * 1000)

        # 3. Final Response Construction
        return SimulationResponse(
            win_probability={d: count / iterations for d, count in win_counts.items()},
            dnf_risk={d: count / iterations for d, count in dnf_counts.items()},
            strategy_recommendation=recommended_strategy,
            metadata={
                "iterations": iterations,
                "model_version": self.model_version,
                "use_ml": request.use_ml,
                "mode": "PHYSICS_ML_HYBRID" if request.use_ml else "PHYSICS_LITERAL",
                "compute_ms": compute_ms,
                "seed": request.dict().get("seed", -1)
            }
        )

# Singleton instance
simulation_engine = SimulationEngine()
