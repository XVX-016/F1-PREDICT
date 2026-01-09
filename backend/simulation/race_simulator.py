"""
Race Simulator - Core race simulation (no ML)
Driver-agnostic: only knows base lap time, pace deltas, pit loss, variance, SC probability
"""
import numpy as np
from typing import Dict, List, Any, Optional
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
        total_laps: int = 60
    ) -> Dict[str, float]:
        """
        Simulate a single race
        
        Args:
            driver_profiles: Dict mapping driver_id to profile with:
                - base_lap_ms: Base lap time in milliseconds
                - pace_delta_ms: Pace delta from ML (relative to mean)
                - variance_ms: Variance in lap times (from consistency)
                - dnf_prob: Probability of DNF
            total_laps: Total race laps
        
        Returns:
            Dict mapping driver_id to race_time_ms
        """
        race_times = {}
        
        # Check for safety car (affects all drivers)
        has_sc = np.random.rand() < self.sc_probability
        sc_laps = np.random.randint(2, 8) if has_sc else 0
        
        for driver_id, profile in driver_profiles.items():
            # Check for DNF
            if np.random.rand() < profile.get("dnf_prob", 0.05):
                race_times[driver_id] = float('inf')
                continue
            
            # Calculate effective lap time
            base_lap = profile["base_lap_ms"]
            pace_delta = profile.get("pace_delta_ms", 0.0)
            variance = profile.get("variance_ms", 100.0)
            
            # Effective lap time = base + pace_delta + random variance
            effective_lap = base_lap + pace_delta + np.random.normal(0, variance)
            
            # Calculate race time
            race_time = effective_lap * total_laps
            
            # Add pit stop loss (assume 1-2 stops)
            num_stops = np.random.choice([1, 2], p=[0.6, 0.4])
            race_time += num_stops * self.pit_loss_time_ms
            
            # Add safety car impact
            if has_sc:
                race_time += sc_laps * self.sc_lap_loss
            
            race_times[driver_id] = race_time
        
        return race_times
    
    def calculate_finishing_positions(
        self,
        race_times: Dict[str, float]
    ) -> Dict[str, int]:
        """Calculate finishing positions from race times"""
        # Sort by race time (lower is better)
        sorted_drivers = sorted(race_times.items(), key=lambda x: x[1])
        
        positions = {}
        position = 1
        for driver_id, race_time in sorted_drivers:
            if race_time == float('inf'):
                positions[driver_id] = 20  # DNF = last
            else:
                positions[driver_id] = position
                position += 1
        
        return positions





