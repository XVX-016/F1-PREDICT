"""
Race Simulator - Core race simulation (no ML)
Driver-agnostic: only knows base lap time, pace deltas, pit loss, variance, SC probability
"""
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class RaceSimulator:
    """
    Core race simulator - deterministic + stochastic math, not ML
    """
    
    def __init__(self):
        self.pit_loss_time_ms = 20000  # 20 seconds pit stop loss
        self.sc_probability = 0.15  # 15% chance of safety car
        self.sc_lap_loss = 5000  # 5 seconds lost per SC lap
    
    def simulate_race(
        self,
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
                    
        return race_times, trace

    def simulate_single_driver(
        self,
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






