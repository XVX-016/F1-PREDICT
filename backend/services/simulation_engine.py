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

    def _get_driver_profiles(self, track_id: str, use_ml: bool, seed: Optional[int] = None) -> Dict[str, DriverModel]:
        """
        Aggregates driver capabilities including calibrated RestartSkill.
        """
        from models.domain import RestartSkill # Local import to avoid circular deps
        rng = np.random.default_rng(seed)
        
        # Calibrated Restart Skills (based on historical performance patterns)
        restart_calibrations = {
            "VER": RestartSkill(reaction_mu=0.14, reaction_sigma=0.03, aggression=0.90, risk_penalty=0.35, tyre_warmup_factor=0.95),
            "HAM": RestartSkill(reaction_mu=0.16, reaction_sigma=0.04, aggression=0.82, risk_penalty=0.40, tyre_warmup_factor=0.96),
            "LEC": RestartSkill(reaction_mu=0.18, reaction_sigma=0.05, aggression=0.85, risk_penalty=0.55, tyre_warmup_factor=0.92),
            "NOR": RestartSkill(reaction_mu=0.17, reaction_sigma=0.04, aggression=0.80, risk_penalty=0.45, tyre_warmup_factor=0.93),
            "SAI": RestartSkill(reaction_mu=0.19, reaction_sigma=0.05, aggression=0.78, risk_penalty=0.48, tyre_warmup_factor=0.91),
            "RUS": RestartSkill(reaction_mu=0.18, reaction_sigma=0.04, aggression=0.75, risk_penalty=0.42, tyre_warmup_factor=0.92),
            "ALO": RestartSkill(reaction_mu=0.15, reaction_sigma=0.03, aggression=0.88, risk_penalty=0.38, tyre_warmup_factor=0.94),
            "PIA": RestartSkill(reaction_mu=0.20, reaction_sigma=0.05, aggression=0.72, risk_penalty=0.50, tyre_warmup_factor=0.90),
            "PER": RestartSkill(reaction_mu=0.22, reaction_sigma=0.06, aggression=0.70, risk_penalty=0.60, tyre_warmup_factor=0.88),
            "STR": RestartSkill(reaction_mu=0.24, reaction_sigma=0.06, aggression=0.65, risk_penalty=0.55, tyre_warmup_factor=0.87),
        }
        default_skill = RestartSkill()
        
        driver_ids = ["VER", "NOR", "LEC", "PIA", "SAI", "HAM", "RUS", "ALO", "PER", "STR"]
        profiles = {}
        for i, d in enumerate(driver_ids):
            ml_offset = 0.0
            if use_ml:
                ml_offset = (i * 10) - 50
                ml_offset += rng.normal(0, 10)
                
            profiles[d] = DriverModel(
                id=d,
                name=d,
                team="FIELD",
                pace_base_ms=90000 + ml_offset,
                tyre_management=0.85 if d=="HAM" else (0.95 if d=="VER" else 0.75),
                racecraft=0.9 if d=="VER" else 0.8,
                dnf_rate=0.02,
                restart_skill=restart_calibrations.get(d, default_skill)
            )
        return profiles

    def run_simulation(self, request: SimulationRequest) -> SimulationResponse:
        """
        Primary entry point for Monte Carlo execution.
        """
        base_seed = request.dict().get("seed")
        
        track = self._get_track_context(request.track_id)
        driver_profiles = self._get_driver_profiles(request.track_id, request.use_ml, seed=base_seed)
        
        # 1. Optimize Strategy for Focus Driver (VER)
        focus_driver = "VER"
        logger.info(f"SimulationEngine: Optimizing strategy for {focus_driver}...")
        recommended_strategy = self.optimizer.optimize(
            track=track,
            driver_profile=driver_profiles[focus_driver],
            params=request.params,
            iterations=400, # Reduced for better web responsiveness
            seed=base_seed,
            events=request.events
        )
        logger.info(f"SimulationEngine: Strategy optimized: {recommended_strategy.name}")

        # 2. Run Main Monte Carlo Simulation
        win_counts = {d: 0 for d in driver_profiles}
        dnf_counts = {d: 0 for d in driver_profiles}
        podium_counts = {d: [0, 0, 0] for d in driver_profiles} # P1, P2, P3 counts
        
        # Store all valid race times for distribution analysis
        all_race_times: Dict[str, List[float]] = {d: [] for d in driver_profiles}
        
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
        
        for i in range(iterations):
            # Deterministic seed per iteration if base_seed exists
            iter_seed = (base_seed + i) if base_seed is not None else None
            
            race_times, _ = self.simulator.simulate_race(
                track=track,
                driver_profiles=driver_profiles,
                driver_strategies=driver_strategies,
                tyre_deg_multiplier=request.params.get("tyre_deg_multiplier", 1.0),
                sc_prob_override=request.params.get("sc_probability"),
                seed=iter_seed,
                capture_trace=False,
                injected_events=request.events
            )
            
            # Aggregate Rankings and Times
            valid_finishers = [(d, t) for d, t in race_times.items() if t != float('inf')]
            sorted_finishers = sorted(valid_finishers, key=lambda x: x[1])
            
            # Track DNFs
            for d in driver_profiles:
                if race_times[d] == float('inf'):
                    dnf_counts[d] += 1
                else:
                    all_race_times[d].append(race_times[d])

            # Track Wins and Podiums
            if sorted_finishers:
                winner = sorted_finishers[0][0]
                win_counts[winner] += 1
                
                for rank, (driver, _) in enumerate(sorted_finishers[:3]):
                    podium_counts[driver][rank] += 1
            
        compute_ms = int((time.time() - start_time) * 1000)

        # 3. Compute Distributions & Metrics
        pace_distributions = {}
        robustness_scores = {}
        
        for d in driver_profiles:
            times = all_race_times[d]
            if not times:
                # If driver DNF'd every time (unlikely but possible)
                pace_distributions[d] = {"p05": 0, "p50": 0, "p95": 0}
                robustness_scores[d] = 0.0
                continue
                
            p05 = np.percentile(times, 5)
            p50 = np.percentile(times, 50)
            p95 = np.percentile(times, 95)
            
            pace_distributions[d] = {
                "p05": float(p05),
                "p50": float(p50),
                "p95": float(p95)
            }
            
            # Robustness: (P95 - P05) / P50
            # Higher spread = less robust strategy
            if p50 > 0:
                robustness_scores[d] = (p95 - p05) / p50
            else:
                robustness_scores[d] = 0.0

        # Phase 4A: Decision Attribution (Causal Shadow Run)
        event_attribution = {}
        if request.events and iterations >= 500: # Only attribute if sample size is sufficient
            logger.info("SimulationEngine: Running attribution shadow baseline...")
            baseline_win_count = 0
            for i in range(iterations):
                iter_seed = (base_seed + i) if base_seed is not None else None
                # Baseline run: Same conditions, but events=[]
                base_race_times, _ = self.simulator.simulate_race(
                    track=track,
                    driver_profiles=driver_profiles,
                    driver_strategies=driver_strategies,
                    tyre_deg_multiplier=request.params.get("tyre_deg_multiplier", 1.0),
                    sc_prob_override=request.params.get("sc_probability"),
                    seed=iter_seed,
                    capture_trace=False,
                    injected_events=[] # NO EVENTS
                )
                valid_base = [(d, t) for d, t in base_race_times.items() if t != float('inf')]
                sorted_base = sorted(valid_base, key=lambda x: x[1])
                if sorted_base and sorted_base[0][0] == focus_driver:
                    baseline_win_count += 1
            
            baseline_win_prob = baseline_win_count / iterations
            current_win_prob = win_counts[focus_driver] / iterations
            impact = current_win_prob - baseline_win_prob
            
            # Combine all events into one 'event_stack' attribution for now
            event_ids = [f"{e.type}@{e.lap}" for e in request.events]
            tag = " + ".join(event_ids)
            event_attribution[tag] = {
                "impact_win_prob": float(impact),
                "baseline_win_prob": float(baseline_win_prob)
            }

        # 4. Final Response Construction
        return SimulationResponse(
            win_probability={d: count / iterations for d, count in win_counts.items()},
            dnf_risk={d: count / iterations for d, count in dnf_counts.items()},
            podium_probability={d: [c / iterations for c in counts] for d, counts in podium_counts.items()},
            pace_distributions=pace_distributions,
            robustness_score=robustness_scores,
            strategy_recommendation=recommended_strategy,
            event_attribution=event_attribution,
            metadata={
                "iterations": iterations,
                "model_version": self.model_version,
                "use_ml": request.use_ml,
                "mode": "PHYSICS_ML_HYBRID" if request.use_ml else "PHYSICS_LITERAL",
                "compute_ms": compute_ms,
                "seed": base_seed,
                "params": request.params,
                "events": [e.dict() for e in request.events]
            }
        )
    def run_comparison(self, request: SimulationRequest, strategies: List[StrategyResult]) -> List[SimulationResponse]:
        """
        Runs multiple strategies through identical Monte Carlo conditions.
        Useful for 'What If' comparison.
        """
        base_seed = request.dict().get("seed")
        track = self._get_track_context(request.track_id)
        driver_profiles = self._get_driver_profiles(request.track_id, request.use_ml, seed=base_seed)
        focus_driver = "VER"
        
        iterations = request.iterations
        comparison_results = []
        
        for strat in strategies:
            win_counts = {d: 0 for d in driver_profiles}
            dnf_counts = {d: 0 for d in driver_profiles}
            all_race_times: Dict[str, List[float]] = {d: [] for d in driver_profiles}
            
            # Default field strategy
            field_strategy = StrategyResult(
                name="Field Default",
                stints=[
                    StrategyStint(compound="medium", end_lap=track.laps // 2),
                    StrategyStint(compound="hard", end_lap=track.laps)
                ],
                expected_time_loss=0, risk_score=0, robustness=0
            )
            
            driver_strategies = {d: field_strategy for d in driver_profiles}
            driver_strategies[focus_driver] = strat # Override with test strategy
            
            start_time = time.time()
            for i in range(iterations):
                iter_seed = (base_seed + i) if base_seed is not None else None
                
                race_times, _ = self.simulator.simulate_race(
                    track=track,
                    driver_profiles=driver_profiles,
                    driver_strategies=driver_strategies,
                    tyre_deg_multiplier=request.params.get("tyre_deg_multiplier", 1.0),
                    sc_prob_override=request.params.get("sc_probability"),
                    seed=iter_seed,
                    capture_trace=False,
                    injected_events=request.events
                )
                
                valid_finishers = [(d, t) for d, t in race_times.items() if t != float('inf')]
                sorted_finishers = sorted(valid_finishers, key=lambda x: x[1])
                
                for d in driver_profiles:
                    if race_times[d] == float('inf'):
                        dnf_counts[d] += 1
                    else:
                        all_race_times[d].append(race_times[d])

                if sorted_finishers and sorted_finishers[0][0] == focus_driver:
                    win_counts[focus_driver] += 1
            
            # Aggregate Result for this strategy
            times = all_race_times[focus_driver]
            p05 = np.percentile(times, 5) if times else 0
            p50 = np.percentile(times, 50) if times else 0
            p95 = np.percentile(times, 95) if times else 0
            
            comparison_results.append(SimulationResponse(
                win_probability={focus_driver: win_counts[focus_driver] / iterations},
                dnf_risk={focus_driver: dnf_counts[focus_driver] / iterations},
                podium_probability={focus_driver: [0, 0, 0]}, # Simplified
                pace_distributions={focus_driver: {"p05": float(p05), "p50": float(p50), "p95": float(p95)}},
                robustness_score={focus_driver: (p95 - p05) / p50 if p50 > 0 else 0.0},
                strategy_recommendation=strat,
                metadata={"compute_ms": int((time.time() - start_time) * 1000)}
            ))
            
        return comparison_results

# Singleton instance
simulation_engine = SimulationEngine()
