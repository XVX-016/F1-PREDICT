import random
import numpy as np
import logging
from typing import List, Dict, Any, Optional
from engine.physics.tyre import tyre_lap_time
from engine.physics.fuel import fuel_time_penalty
from engine.physics.pit import pit_loss

logger = logging.getLogger(__name__)

class Strategy:
    def __init__(self, pit_laps: List[int], tyre_compounds: List[str], noise_sigma: float = 0.15):
        self.pit_laps = pit_laps
        self.tyre_compounds = tyre_compounds
        self.noise_sigma = noise_sigma

def simulate_strategy(
    strategy: Strategy,
    total_laps: int,
    base_lap_time: float,
    initial_fuel: float,
    fuel_burn_rate: float,
    fuel_k: float,
    tyre_params: Dict[str, Dict[str, float]],  # {compound: {alpha, beta, gamma}}
    n_simulations: int = 1000
) -> List[float]:
    """
    Runs a Monte Carlo simulation for a specific race strategy.
    
    Args:
        strategy: The strategy object containing pit laps and compounds.
        total_laps: Total race distance in laps.
        base_lap_time: Fresh tyre, zero fuel lap time.
        initial_fuel: Starting fuel load (kg).
        fuel_burn_rate: Fuel burn per lap (kg).
        fuel_k: Fuel weight penalty constant.
        tyre_params: Parameters for each tyre compound.
        n_simulations: Number of Monte Carlo iterations.
        
    Returns:
        List[float]: Distribution of total race times.
    """
    results = []

    for i in range(n_simulations):
        race_time = 0.0
        tyre_age = 0
        current_compound_idx = 0
        current_compound = strategy.tyre_compounds[current_compound_idx]

        for lap in range(1, total_laps + 1):
            # 1. Physics: Tyre & Fuel
            p = tyre_params.get(current_compound, {"alpha": 0.1, "beta": 1.0, "gamma": 0.2})
            
            lap_time = tyre_lap_time(
                base_time=base_lap_time,
                tyre_age=tyre_age,
                alpha=p["alpha"],
                beta=p["beta"],
                gamma=p["gamma"]
            )
            
            lap_time += fuel_time_penalty(
                initial_fuel=initial_fuel,
                lap=lap,
                burn_rate=fuel_burn_rate,
                k=fuel_k
            )

            # 2. Stochastic Noise (Gaussian)
            lap_time += random.gauss(0, strategy.noise_sigma)
            
            race_time += lap_time

            # 3. Pit Stop Logic
            if lap in strategy.pit_laps:
                race_time += pit_loss(base_loss=20.0, traffic_penalty=random.uniform(0, 2.0))
                tyre_age = 0
                current_compound_idx += 1
                if current_compound_idx < len(strategy.tyre_compounds):
                    current_compound = strategy.tyre_compounds[current_compound_idx]
            else:
                tyre_age += 1

        results.append(race_time)

    return results

def calculate_robustness(race_times: List[float]) -> float:
    """
    Calculates the Strategy Robustness Metric: std(T) / mean(T).
    Lower is better (more stable under uncertainty).
    """
    if not race_times:
        return 0.0
    return np.std(race_times) / np.mean(race_times)
