"""
Race Simulator - Core race simulation logic
Physics-first, deterministic, trace-capable.
"""
import numpy as np
<<<<<<< HEAD
from typing import Dict, List, Any, Optional, Tuple
=======
from typing import Dict, List, Any, Optional, Tuple, Literal
>>>>>>> feature/redis-telemetry-replay
import logging
from models.domain import TrackModel, DriverModel, StrategyResult, LapFrame, SimulationEvent

logger = logging.getLogger(__name__)

class RaceSimulator:
    """
    Stochastic race engine.
    Computes lap-by-lap physics for N drivers concurrently.
    """
    
    def simulate_race(
        self,
<<<<<<< HEAD
        driver_profiles: Dict[str, Dict[str, Any]],
        total_laps: int = 60,
        driver_strategies: Optional[Dict[str, Any]] = None,
        capture_trace: bool = False
    ) -> Tuple[Dict[str, float], Optional[List[Dict[str, Any]]]]:
        """
        Simulate a single race with lap-by-lap precision.
        """
        race_times = {d: 0.0 for d in driver_profiles}
        driver_stint_idx = {d: 0 for d in driver_profiles}
        driver_tyre_age = {d: 0 for d in driver_profiles}
        active_drivers = set(driver_profiles.keys())
        trace = [] if capture_trace else None
        
        # Pre-set default strategies if none provided
        if not driver_strategies:
            driver_strategies = {d: {
                "stints": [{"compound": "Medium", "end_lap": 30}, {"compound": "Hard", "end_lap": total_laps}]
            } for d in driver_profiles}

        for lap in range(1, total_laps + 1):
            # Check for Safety Car on this lap
            is_sc = np.random.rand() < (self.sc_probability / total_laps) # Per-lap SC chance
            
            lap_data = {"lap": lap, "is_sc": is_sc, "drivers": {}} if capture_trace else None
            
            for driver_id in list(active_drivers):
                profile = driver_profiles[driver_id]
                strategy = driver_strategies[driver_id]
                
                # Check for DNF
                if np.random.rand() < (profile.get("dnf_prob", 0.05) / total_laps):
                    race_times[driver_id] = float('inf')
                    active_drivers.remove(driver_id)
                    continue
                
                # Get current stint info
                stint_idx = driver_stint_idx[driver_id]
                current_stint = strategy["stints"][stint_idx]
                compound = current_stint["compound"]
                
                # ... physics logic ... (keep existing)
                alpha = 0.05 if compound == "Soft" else (0.03 if compound == "Medium" else 0.02)
                beta = 0.5
                gamma = 0.1
                
                base_lap = profile["base_lap_ms"]
                pace_delta = profile.get("pace_delta_ms", 0.0)
                t_deg = alpha * driver_tyre_age[driver_id] + beta * (1 - np.exp(-gamma * driver_tyre_age[driver_id]))
                f_burn = -0.03 * lap
                
                lap_time = base_lap + pace_delta + (t_deg * 1000) + (f_burn * 1000) + np.random.normal(0, profile.get("variance_ms", 100))

                # Multi-driver interaction model (Traffic / Dirty Air)
                traffic_penalty = 0.0
                rank = sorted(race_times.values()).index(race_times[driver_id])
                if rank > 0:
                     # Probabilistic traffic loss if behind someone
                    if np.random.rand() < 0.3:
                        traffic_penalty = 400 # 0.4s loss in dirty air
                
                lap_time += traffic_penalty
                
                if is_sc:
                    lap_time += self.sc_lap_loss
                
                race_times[driver_id] += lap_time
                driver_tyre_age[driver_id] += 1
                
                if capture_trace:
                    lap_data["drivers"][driver_id] = {
                        "lap_time": float(lap_time),
                        "total_time": float(race_times[driver_id]),
                        "compound": compound,
                        "tyre_age": driver_tyre_age[driver_id]
                    }

                # Check for pit stop
                if lap == current_stint["end_lap"] and lap < total_laps:
                    race_times[driver_id] += self.pit_loss_time_ms
                    driver_stint_idx[driver_id] += 1
                    driver_tyre_age[driver_id] = 0
                    if capture_trace:
                        lap_data["drivers"][driver_id]["is_pit"] = True
            
            if capture_trace:
                trace.append(lap_data)
                    
=======
        track: TrackModel,
        driver_profiles: Dict[str, DriverModel],
        driver_strategies: Dict[str, StrategyResult],
        tyre_deg_multiplier: float = 1.0,
        sc_prob_override: Optional[float] = None,
        capture_trace: bool = False,
        seed: Optional[int] = None,
        injected_events: List[SimulationEvent] = None
    ) -> Tuple[Dict[str, float], Optional[List[LapFrame]]]:
        """
        Simulates a full race distance based on track-first properties.
        Supports:
        - Seed locking (Deterministic Replay)
        - LapFrame outputs (Unified Schema)
        - Physics-first ordering
        - Counterfactual Event Injection
        """
        # Seed Management (Scope-Locked)
        rng = np.random.default_rng(seed) if seed is not None else np.random.default_rng()
        
        total_laps = track.laps
        pit_loss_ms = track.pit_loss_seconds * 1000
        sc_prob = sc_prob_override if sc_prob_override is not None else track.sc_probability_base
        
        race_times = {d_id: 0.0 for d_id in driver_profiles}
        driver_stint_idx = {d_id: 0 for d_id in driver_profiles}
        driver_tyre_age = {d_id: 0 for d_id in driver_profiles}
        active_drivers = set(driver_profiles.keys())
        
        # Event Processing
        event_map: Dict[int, List[SimulationEvent]] = {}
        if injected_events:
            for e in injected_events:
                event_map.setdefault(e.lap, []).append(e)
        
        # State modifiers from events
        current_weather_impact = 1.0
        previous_lap_was_sc = False # Track restart laps for skill application
        
        # Trace collection
        trace: List[LapFrame] = [] if capture_trace else None

        for lap in range(1, total_laps + 1):
            # 1. Gather Lap Events
            lap_events = event_map.get(lap, [])
            # Resolve Event Precedence: FAILURE > SC > VSC > WEATHER
            # Reset lap flags
            is_sc = False
            is_vsc = False
            
            # 1. Check for injected events
            for e in lap_events:
                if e.type == "FAILURE":
                    if e.driver_id and e.driver_id in active_drivers:
                        active_drivers.remove(e.driver_id)
                        race_times[e.driver_id] = float('inf')
                elif e.type == "WEATHER":
                    # Weather impact persists
                    current_weather_impact = 1.0 + (e.intensity * 0.5) 
                elif e.type == "SC":
                    is_sc = True
                elif e.type == "VSC":
                    is_vsc = True

            # 2. Natural Probability SC (only if not already an injected event)
            if not (is_sc or is_vsc):
                is_sc = rng.random() < (sc_prob / total_laps)
            
            # 3. Final Precedence Enforcement
            if is_sc:
                # SC overrides VSC
                is_vsc = False
            
            # Sort drivers by current total time to handle traffic interaction
            current_order = sorted(active_drivers, key=lambda x: race_times[x])
            
            for rank, driver_id in enumerate(current_order):
                profile = driver_profiles[driver_id]
                strategy = driver_strategies[driver_id]
                
                # 2. Random DNF Check (Natural)
                if rng.random() < (profile.dnf_rate / total_laps):
                    race_times[driver_id] = float('inf')
                    if driver_id in active_drivers:
                        active_drivers.remove(driver_id)
                    continue
                
                # 3. Get Strategy/Tyre Info
                stint_idx = driver_stint_idx[driver_id]
                current_stint = strategy.stints[stint_idx]
                compound = current_stint.compound
                
                # 4. Physics: Tyre Degradation
                wear_base = getattr(track.tyre_wear_factors, compound)
                # Weather also increases degradation
                deg_rate = wear_base * (1.1 - profile.tyre_management) * tyre_deg_multiplier * current_weather_impact
                
                age = driver_tyre_age[driver_id]
                t_deg_ms = deg_rate * (age ** 1.1) * 20 
                
                # 5. Physics: Fuel Burn
                f_burn_ms = -35 * lap 
                
                # 6. Environmental Randomness
                variance = 80 + (track.weather_variance * 50)
                if current_weather_impact > 1.0:
                    variance *= current_weather_impact # more rain = more variance
                
                # SC/VSC High-Variance injection (Phase 3: Causal Stochasticity)
                if is_sc:
                    variance = 800 # ±0.8s chaos as requested
                elif is_vsc:
                    variance = 300 # ±0.3s chaos for VSC
                
                noise = rng.normal(0, variance)
                
                # Leader Penalty (Restart Vulnerability)
                if is_sc and rank == 0:
                    noise += 500 # 500ms penalty for leading during SC
                
                # 7. Traffic / Overtaking Interaction
                traffic_ms = 0.0
                if rank > 0 and not (is_sc or is_vsc): # No normal overtaking under SC/VSC
                    leader_id = current_order[rank-1]
                    gap = race_times[driver_id] - race_times[leader_id]
                    if gap < 1500: 
                        dirty_air_prob = 0.6 * track.overtaking_difficulty
                        if rng.random() < dirty_air_prob:
                            traffic_ms = 400 + (rng.random() * 400)

                # 8. SC / VSC Impact (with Field Compression)
                sc_impact_ms = 0.0
                if is_sc:
                    sc_impact_ms = 12000 
                elif is_vsc:
                    sc_impact_ms = 5000 
                
                # Weather base impact
                weather_base_ms = (current_weather_impact - 1.0) * 8000 

                # 9. Restart Skill Physics (Applied on the first green lap after SC/VSC)
                restart_delta_ms = 0.0
                if previous_lap_was_sc and not (is_sc or is_vsc):
                    # This is the restart lap
                    skill = profile.restart_skill
                    
                    # Reaction Time (stochastic per driver)
                    reaction_ms = rng.normal(skill.reaction_mu, skill.reaction_sigma) * 1000
                    
                    # Tyre Warmup Penalty
                    warmup_penalty_ms = (1.0 - skill.tyre_warmup_factor) * 500
                    
                    # Aggression Gain (probabilistic position gain attempt)
                    # This translates to time if successful, capped by risk_penalty
                    aggression_gain_ms = 0.0
                    if rng.random() < skill.aggression * 0.3: # 30% of aggression score = overtake attempt
                        if rng.random() > skill.risk_penalty: # Success without incident
                            aggression_gain_ms = -300 # Gained ~0.3s
                        # else: incident could cause penalty, but we don't model DNF here to keep it simple
                    
                    # Net Restart Delta
                    restart_delta_ms = reaction_ms + warmup_penalty_ms + aggression_gain_ms

                # Final Lap Calculation
                lap_time = profile.pace_base_ms + t_deg_ms + f_burn_ms + noise + traffic_ms + sc_impact_ms + weather_base_ms + restart_delta_ms
                
                # Apply the lap time
                new_race_time = race_times[driver_id] + lap_time
                
                # FIELD COMPRESSION (State Reset)
                if (is_sc or is_vsc) and rank > 0:
                    leader_id = current_order[rank-1]
                    # Snapping to previous driver with some stochastic gap
                    gap_to_leader = new_race_time - race_times[leader_id]
                    max_gap = 500 if is_sc else 1000 
                    
                    if gap_to_leader > max_gap:
                        # Force bunching
                         new_race_time = race_times[leader_id] + max_gap
                    
                    # Add extra noise to compressed field to allow reshuffling
                    if is_sc:
                         new_race_time += rng.normal(0, 100) # ±0.1s jitter to avoid perfect trains
                
                race_times[driver_id] = new_race_time
                driver_tyre_age[driver_id] += 1
                
                # 9. Pit Stop Check
                pit_this_lap = False
                if lap == current_stint.end_lap and lap < total_laps:
                    race_times[driver_id] += pit_loss_ms
                    driver_stint_idx[driver_id] += 1
                    driver_tyre_age[driver_id] = 0
                    pit_this_lap = True

                if capture_trace:
                    frame = LapFrame(
                        lap=lap,
                        driver_id=driver_id,
                        
                        # RAW (Simulated observation)
                        lap_time_ms=float(lap_time),
                        compound=compound,
                        position=rank + 1,
                        
                        # DERIVED (Simulated truth)
                        tyre_wear=float(t_deg_ms), # Proxy for wear state
                        fuel_remaining_kg=100.0 - (lap * 1.5), # Approx
                        pit_this_lap=pit_this_lap,
                        
                        source="SIMULATION",
                        explanation="PIT" if pit_this_lap else ("SC" if is_sc else None)
                    )
                    trace.append(frame)

            # End of lap: update previous_lap_was_sc for next lap's restart skill check
            previous_lap_was_sc = is_sc or is_vsc

>>>>>>> feature/redis-telemetry-replay
        return race_times, trace

    def simulate_single_driver(
        self,
<<<<<<< HEAD
        driver_profile: Dict[str, Any],
        strategy: Dict[str, Any],
        total_laps: int = 60,
        sc_prob: float = 0.15
    ) -> float:
        """
        Simulate a race for a single driver with a specific strategy.
        Used by the Optimizer.
        """
        race_times, _ = self.simulate_race(
            driver_profiles={"DRIVER": driver_profile},
            total_laps=total_laps,
            driver_strategies={"DRIVER": strategy},
            capture_trace=False
        )
        return race_times["DRIVER"]






=======
        track: TrackModel,
        driver_profile: DriverModel,
        strategy: StrategyResult,
        tyre_deg_multiplier: float = 1.0,
        sc_prob_override: Optional[float] = None,
        seed: Optional[int] = None,
        injected_events: List[SimulationEvent] = None
    ) -> float:
        """
        Isolated simulation for strategy optimization.
        """
        race_times, _ = self.simulate_race(
            track=track,
            driver_profiles={"DRIVER": driver_profile},
            driver_strategies={"DRIVER": strategy},
            tyre_deg_multiplier=tyre_deg_multiplier,
            sc_prob_override=sc_prob_override,
            capture_trace=False,
            seed=seed,
            injected_events=injected_events
        )
        return race_times["DRIVER"]
>>>>>>> feature/redis-telemetry-replay
