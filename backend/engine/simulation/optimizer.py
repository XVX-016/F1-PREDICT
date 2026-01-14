import numpy as np
from typing import List, Dict, Any
from engine.simulation.monte_carlo import simulate_strategy, calculate_robustness, Strategy

class StrategyOptimizer:
    """
    Evaluates and ranks race strategies based on expected time and robustness.
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config

    def evaluate_strategies(self, potential_strategies: List[Strategy]) -> List[Dict[str, Any]]:
        results = []
        
        for strat in potential_strategies:
            race_times = simulate_strategy(
                strategy=strat,
                total_laps=self.config['total_laps'],
                base_lap_time=self.config['base_lap_time'],
                initial_fuel=self.config['initial_fuel'],
                fuel_burn_rate=self.config['fuel_burn_rate'],
                fuel_k=self.config['fuel_k'],
                tyre_params=self.config['tyre_params'],
                n_simulations=500
            )
            
            mean_time = np.mean(race_times)
            std_dev = np.std(race_times)
            robustness = calculate_robustness(race_times)
            
            results.append({
                "pit_laps": strat.pit_laps,
                "compounds": strat.tyre_compounds,
                "expected_time": mean_time,
                "variance": std_dev,
                "robustness": robustness
            })
            
        # Rank by expected time (primary) and robustness (secondary)
        results.sort(key=lambda x: (x['expected_time'], x['robustness']))
        return results
