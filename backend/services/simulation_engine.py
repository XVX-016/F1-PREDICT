import numpy as np
import logging
import time
import os
import json
from typing import Dict, List, Any, Optional
from engine.simulation.simulator import RaceSimulator
from engine.simulation.rigorous import RigorousSimulationEngine
from services.ml_residual_service import ml_residual_service
from services.sc_probability_service import sc_probability_service
from services.strategy_optimizer import StrategyOptimizer
from models.domain import TrackModel, DriverModel, StrategyResult, StrategyStint, SimulationRequest, SimulationResponse, TrackTyreWearFactors, SimulationRunOutput

logger = logging.getLogger(__name__)

class SimulationEngine:
    """
    Orchestrates deterministic physics models and Monte Carlo sampling.
    """
    
    def __init__(self):
        self.simulator = RaceSimulator()
        self.rigorous_simulator = RigorousSimulationEngine()
        self.optimizer = StrategyOptimizer(self.simulator)
        self.model_version = "v3.0.0-engineering"
        self.default_rigorous_params = self._load_default_rigorous_params()
        self.ml_residual_service = ml_residual_service
        self.sc_probability_service = sc_probability_service

    def _load_default_rigorous_params(self) -> Dict[str, float]:
        """
        Loads default rigorous model parameters from versioned JSON artifact.
        """
        candidates = [
            os.path.join(os.path.dirname(__file__), "..", "data", "rigorous_model_params.v1.calibrated.json"),
            os.path.join(os.path.dirname(__file__), "..", "data", "rigorous_model_params.v1.json"),
        ]
        for path in candidates:
            try:
                if not os.path.exists(path):
                    continue
                with open(path, "r", encoding="utf-8") as f:
                    payload = json.load(f)
                params = payload.get("params", {})
                if isinstance(params, dict):
                    logger.info(f"Loaded rigorous params from {os.path.basename(path)}")
                    return {str(k): float(v) for k, v in params.items()}
            except Exception as e:
                logger.warning(f"Failed to load rigorous params from {path}: {e}")
        return {}

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

    def _get_driver_profiles(
        self,
        track_id: str,
        use_ml: bool,
        seed: Optional[int] = None,
        pace_spread_scale: float = 1.0,
        forced_rank_offsets_ms: Optional[Dict[str, float]] = None,
        driver_ids_override: Optional[List[str]] = None,
    ) -> Dict[str, DriverModel]:
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
        
        driver_rows = []
        try:
            from data.enhanced_drivers_2025 import DRIVERS_2025
            driver_rows = list(DRIVERS_2025.values())
        except Exception:
            driver_rows = []

        fallback_driver_ids = [
            "VER", "NOR", "LEC", "PIA", "SAI", "HAM", "RUS", "ALO", "PER", "STR",
            "GAS", "OCO", "ALB", "TSU", "HUL", "MAG", "BOT", "ZHO", "RIC", "SAR"
        ]
        if driver_ids_override:
            driver_ids = [str(x).upper() for x in driver_ids_override]
        else:
            driver_ids = [row.driver_id for row in driver_rows] if driver_rows else fallback_driver_ids
        profiles = {}
        raw_pace_by_driver: Dict[str, float] = {}
        residual_feature_rows: List[Dict[str, Any]] = []
        for i, d in enumerate(driver_ids):
            row = next((x for x in driver_rows if x.driver_id == d), None)
            team_name = row.constructor if row else "FIELD"
            base_pace = 90000.0
            if row:
                # Convert tier multipliers to pace deltas (faster tier -> lower lap time).
                base_pace += (1.10 - row.tier_multiplier) * 900
            elif use_ml:
                # Small non-artifact fallback only when no row exists for the driver pool.
                base_pace += float(rng.normal(0, 10))
            raw_pace_by_driver[d] = float(base_pace)

            profiles[d] = DriverModel(
                id=d,
                name=row.name if row else d,
                team=team_name,
                pace_base_ms=base_pace,
                tyre_management=float(np.clip(row.tire_management if row else (0.85 if d=="HAM" else (0.95 if d=="VER" else 0.75)), 0.0, 1.0)),
                racecraft=float(np.clip((row.race_pace / 1.3) if row else (0.9 if d=="VER" else 0.8), 0.0, 1.0)),
                dnf_rate=0.02 if not row else max(0.005, 0.03 * (1.2 - row.car_reliability)),
                restart_skill=restart_calibrations.get(d, default_skill)
            )
            residual_feature_rows.append({
                "driver_id": d,
                "avg_long_run_pace_ms": float(base_pace),
                "tire_deg_rate": float(1.0 - profiles[d].tyre_management) * 0.12,
                "sector_consistency": float(max(1.0, (1.0 - profiles[d].racecraft) * 250.0)),
                "clean_air_delta": float((0.5 - profiles[d].racecraft) * 120.0),
                "recent_form": 0.0 if not row else float((row.race_pace - 0.8) * 10.0),
                "grid_position": i + 1,
                "tyre_age_compound_factor": float((1.0 - profiles[d].tyre_management) * 12.0),
                "track_temperature": 35.0,
                "qualifying_pace_delta": float((base_pace - 90000.0) / 10.0),
                "drs_activation_rate": float(np.clip(0.35 + profiles[d].racecraft * 0.3, 0.0, 1.0)),
                "sector_variance": float(max(1.0, (1.0 - profiles[d].racecraft) * 180.0)),
                "track_evolution_coefficient": 0.15,
                "weather_delta": 0.0,
            })
        if profiles:
            scale = float(np.clip(pace_spread_scale, 0.5, 4.0))
            pace_values = np.array([raw_pace_by_driver[d] for d in profiles.keys()], dtype=float)
            center = float(np.mean(pace_values))
            for d in profiles.keys():
                old = raw_pace_by_driver[d]
                profiles[d].pace_base_ms = float(center + (old - center) * scale)
            if isinstance(forced_rank_offsets_ms, dict) and forced_rank_offsets_ms:
                for d in profiles.keys():
                    if d in forced_rank_offsets_ms:
                        profiles[d].pace_base_ms = float(center + float(forced_rank_offsets_ms[d]))
            elif use_ml:
                residuals = self.ml_residual_service.predict_residuals(residual_feature_rows)
                for d in profiles.keys():
                    profiles[d].pace_base_ms = float(profiles[d].pace_base_ms + residuals.get(d, 0.0))
        return profiles

    def run_rigorous_output(self, request: SimulationRequest) -> SimulationRunOutput:
        base_seed = request.dict().get("seed")
        track = self._get_track_context(request.track_id)
        request_params = request.params if isinstance(request.params, dict) else {}
        pace_spread_scale = float(request_params.get("pace_spread_scale", 1.0))
        forced_rank_offsets_ms = request_params.get("forced_rank_offsets_ms")
        driver_ids_override = request_params.get("driver_ids")
        driver_profiles = self._get_driver_profiles(
            request.track_id,
            request.use_ml,
            seed=base_seed,
            pace_spread_scale=pace_spread_scale,
            forced_rank_offsets_ms=forced_rank_offsets_ms if isinstance(forced_rank_offsets_ms, dict) else None,
            driver_ids_override=driver_ids_override if isinstance(driver_ids_override, list) else None,
        )
        overrides = request_params.get("model_params", {})
        merged_params = dict(self.default_rigorous_params)
        if isinstance(overrides, dict):
            merged_params.update(overrides)
        sc_profile = self.sc_probability_service.summary(
            track,
            float(request_params.get("weather_delta", 0.0) or 0.0)
        )
        merged_params.setdefault("sc_peak_probability", sc_profile["peak_probability"])
        return self.rigorous_simulator.run(
            race_id=request.track_id,
            track=track,
            driver_profiles=driver_profiles,
            iterations=request.iterations,
            seed=base_seed,
            focus_driver=request_params.get("focus_driver", "VER"),
            model_params=merged_params,
            strategy_plan=request_params.get("strategy_plan"),
        )

    def run_simulation(self, request: SimulationRequest) -> SimulationResponse:
        """
        Primary entry point for Monte Carlo execution.
        """
        base_seed = request.dict().get("seed")
        
        track = self._get_track_context(request.track_id)
        pace_spread_scale = float(request.params.get("pace_spread_scale", 1.0))
        forced_rank_offsets_ms = request.params.get("forced_rank_offsets_ms")
        driver_ids_override = request.params.get("driver_ids")
        sc_summary = self.sc_probability_service.summary(
            track,
            float(request.params.get("weather_delta", 0.0) or 0.0)
        )
        driver_profiles = self._get_driver_profiles(
            request.track_id,
            request.use_ml,
            seed=base_seed,
            pace_spread_scale=pace_spread_scale,
            forced_rank_offsets_ms=forced_rank_offsets_ms if isinstance(forced_rank_offsets_ms, dict) else None,
            driver_ids_override=driver_ids_override if isinstance(driver_ids_override, list) else None,
        )
        
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
        
        # Trace collection for visualization
        final_trace: Optional[List[Any]] = None
        
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
            
            # Capture trace only for the first iteration if requested
            do_capture = request.capture_trace and i == 0
            
            race_times, trace = self.simulator.simulate_race(
                track=track,
                driver_profiles=driver_profiles,
                driver_strategies=driver_strategies,
                tyre_deg_multiplier=request.params.get("tyre_deg_multiplier", 1.0),
                sc_prob_override=request.params.get("sc_probability"),
                seed=iter_seed,
                capture_trace=do_capture,
                injected_events=request.events
            )
            
            if do_capture:
                final_trace = trace
            
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
                pace_distributions[d] = {"p10": 0, "p50": 0, "p90": 0}
                robustness_scores[d] = 0.0
                continue
                
            p10 = np.percentile(times, 10)
            p50 = np.percentile(times, 50)
            p90 = np.percentile(times, 90)
            
            pace_distributions[d] = {
                "p10": float(p10),
                "p50": float(p50),
                "p90": float(p90)
            }
            
            # Robustness: (P90 - P10) / P50
            # Higher spread = less robust strategy
            if p50 > 0:
                robustness_scores[d] = (p90 - p10) / p50
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

        run_output = None
        if request.params.get("rigorous_output", False):
            run_output = self.run_rigorous_output(request).model_dump()

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
                "events": [e.dict() for e in request.events],
                "ml_model_version": self.ml_residual_service.model_version,
                "feature_version": self.ml_residual_service.feature_version,
                "sc_model": sc_summary,
            },
            trace=final_trace,
            run_output=run_output
        )
    def run_comparison(self, request: SimulationRequest, strategies: List[StrategyResult]) -> List[SimulationResponse]:
        """
        Runs multiple strategies through identical Monte Carlo conditions.
        Useful for 'What If' comparison.
        """
        base_seed = request.dict().get("seed")
        track = self._get_track_context(request.track_id)
        pace_spread_scale = float(request.params.get("pace_spread_scale", 1.0))
        forced_rank_offsets_ms = request.params.get("forced_rank_offsets_ms")
        driver_ids_override = request.params.get("driver_ids")
        driver_profiles = self._get_driver_profiles(
            request.track_id,
            request.use_ml,
            seed=base_seed,
            pace_spread_scale=pace_spread_scale,
            forced_rank_offsets_ms=forced_rank_offsets_ms if isinstance(forced_rank_offsets_ms, dict) else None,
            driver_ids_override=driver_ids_override if isinstance(driver_ids_override, list) else None,
        )
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
            p10 = np.percentile(times, 10) if times else 0
            p50 = np.percentile(times, 50) if times else 0
            p90 = np.percentile(times, 90) if times else 0
            
            comparison_results.append(SimulationResponse(
                win_probability={focus_driver: win_counts[focus_driver] / iterations},
                dnf_risk={focus_driver: dnf_counts[focus_driver] / iterations},
                podium_probability={focus_driver: [0, 0, 0]}, # Simplified
                pace_distributions={focus_driver: {"p10": float(p10), "p50": float(p50), "p90": float(p90)}},
                robustness_score={focus_driver: (p90 - p10) / p50 if p50 > 0 else 0.0},
                strategy_recommendation=strat,
                metadata={
                    "compute_ms": int((time.time() - start_time) * 1000),
                    "ml_model_version": self.ml_residual_service.model_version,
                    "feature_version": self.ml_residual_service.feature_version,
                }
            ))
            
        return comparison_results

# Singleton instance
simulation_engine = SimulationEngine()
