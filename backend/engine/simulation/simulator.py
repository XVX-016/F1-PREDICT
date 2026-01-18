"""
Race Simulator - Core race simulation logic
Anchored in Track and Driver domain models.
"""
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
import logging
from models.domain import TrackModel, DriverModel, StrategyResult

logger = logging.getLogger(__name__)

class RaceSimulator:
    """
    Stochastic race engine.
    Computes lap-by-lap physics for N drivers concurrently.
    """
    
    def simulate_race(
        self,
        track: TrackModel,
        driver_profiles: Dict[str, DriverModel],
        driver_strategies: Dict[str, StrategyResult],
        tyre_deg_multiplier: float = 1.0,
        sc_prob_override: Optional[float] = None,
        capture_trace: bool = False
    ) -> Tuple[Dict[str, float], Optional[List[Dict[str, Any]]]]:
        """
        Simulates a full race distance based on track-first properties.
        """
        total_laps = track.laps
        pit_loss_ms = track.pit_loss_seconds * 1000
        sc_prob = sc_prob_override if sc_prob_override is not None else track.sc_probability_base
        
        race_times = {d_id: 0.0 for d_id in driver_profiles}
        driver_stint_idx = {d_id: 0 for d_id in driver_profiles}
        driver_tyre_age = {d_id: 0 for d_id in driver_profiles}
        active_drivers = set(driver_profiles.keys())
        trace = [] if capture_trace else None

        for lap in range(1, total_laps + 1):
            # Per-lap Safety Car rollup
            is_sc = np.random.rand() < (sc_prob / total_laps)
            
            lap_data = {"lap": lap, "is_sc": is_sc, "drivers": {}} if capture_trace else None
            
            # Sort drivers by current total time to handle traffic interaction
            current_order = sorted(active_drivers, key=lambda x: race_times[x])
            
            for rank, driver_id in enumerate(current_order):
                profile = driver_profiles[driver_id]
                strategy = driver_strategies[driver_id]
                
                # 1. Random DNF Check (ML + Driver Base)
                if np.random.rand() < (profile.dnf_rate / total_laps):
                    race_times[driver_id] = float('inf')
                    active_drivers.remove(driver_id)
                    continue
                
                # 2. Get Strategy/Tyre Info
                stint_idx = driver_stint_idx[driver_id]
                current_stint = strategy.stints[stint_idx]
                compound = current_stint.compound
                
                # 3. Physics: Tyre Degradation
                # Use track-specific wear factors
                wear_base = getattr(track.tyre_wear_factors, compound)
                # Modified by driver management and global multiplier
                deg_rate = wear_base * (1.1 - profile.tyre_management) * tyre_deg_multiplier
                
                # Thermal/Stiffness model (simplified)
                age = driver_tyre_age[driver_id]
                t_deg_ms = deg_rate * (age ** 1.1) * 20 # 20ms base deg scaling
                
                # 4. Physics: Fuel Burn
                # Standard depletion model
                f_burn_ms = -35 * lap # 35ms lap time improvement per lap due to weight reduction
                
                # 5. ML/Pace Offset
                # profile.pace_base_ms is the combined ML + Driver capability
                
                # 6. Environmental Randomness
                variance = 80 + (track.weather_variance * 50)
                noise = np.random.normal(0, variance)
                
                # 7. Traffic / Overtaking Interaction
                traffic_ms = 0.0
                if rank > 0:
                    leader_id = current_order[rank-1]
                    gap = race_times[driver_id] - race_times[leader_id]
                    if gap < 1500: # Within 1.5s (dirty air / DRS zone)
                        # Overtaking difficulty reduces the chance of clear lap
                        dirty_air_prob = 0.6 * track.overtaking_difficulty
                        if np.random.rand() < dirty_air_prob:
                            traffic_ms = 400 + (np.random.rand() * 400)

                # 8. SC Impact
                sc_impact_ms = 8000 if is_sc else 0.0 # 8s per lap loss under SC

                # Final Lap Calculation
                lap_time = profile.pace_base_ms + t_deg_ms + f_burn_ms + noise + traffic_ms + sc_impact_ms
                
                race_times[driver_id] += lap_time
                driver_tyre_age[driver_id] += 1
                
                if capture_trace:
                    lap_data["drivers"][driver_id] = {
                        "lap_time": float(lap_time),
                        "total_time": float(race_times[driver_id]),
                        "compound": compound,
                        "tyre_age": age,
                        "rank": rank + 1
                    }

                # 9. Pit Stop Check
                if lap == current_stint.end_lap and lap < total_laps:
                    race_times[driver_id] += pit_loss_ms
                    driver_stint_idx[driver_id] += 1
                    driver_tyre_age[driver_id] = 0
                    if capture_trace:
                        lap_data["drivers"][driver_id]["is_pit"] = True
            
            if capture_trace:
                trace.append(lap_data)
                    
        return race_times, trace

    def simulate_single_driver(
        self,
        track: TrackModel,
        driver_profile: DriverModel,
        strategy: StrategyResult,
        tyre_deg_multiplier: float = 1.0,
        sc_prob_override: Optional[float] = None
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
            capture_trace=False
        )
        return race_times["DRIVER"]
