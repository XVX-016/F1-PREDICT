import numpy as np
from typing import List, Dict, Any, Tuple
from engine.simulation.simulator import RaceSimulator

class StrategyOptimizer:
    """
    Finds optimal race strategies (pit stops, compounds) using Monte Carlo evaluation.
    """
    
    def __init__(self, simulator: RaceSimulator):
        self.simulator = simulator
        self.compounds = ["Soft", "Medium", "Hard"]
        self.min_stint_laps = 10
        self.max_laps = 60
        
    def generate_feasible_strategies(self) -> List[Dict[str, Any]]:
        """
        Generates a set of valid race strategies (1 and 2 stops).
        """
        strategies = []
        
        # 1-Stop Strategies
        for pit1 in range(15, 45, 2):
            for c1 in self.compounds:
                for c2 in self.compounds:
                    if c1 == c2: continue # Must use two different compounds (simplified rule)
                    strategies.append({
                        "name": f"1-Stop: {c1}-{c2} (L{pit1})",
                        "stints": [
                            {"compound": c1, "end_lap": pit1},
                            {"compound": c2, "end_lap": self.max_laps}
                        ]
                    })
                    
        # 2-Stop Strategies (Simplified subset to avoid search space explosion)
        for pit1 in range(12, 25, 4):
            for pit2 in range(35, 48, 4):
                strategies.append({
                    "name": f"2-Stop: S-M-H (L{pit1}, L{pit2})",
                    "stints": [
                        {"compound": "Soft", "end_lap": pit1},
                        {"compound": "Medium", "end_lap": pit2},
                        {"compound": "Hard", "end_lap": self.max_laps}
                    ]
                })
        
        return strategies

    def optimize(
        self, 
        driver_profile: Dict[str, Any], 
        params: Dict[str, Any],
        iterations: int = 1000
    ) -> Dict[str, Any]:
        """
        Evaluates strategies and returns the best one.
        Score = MeanTime + (RiskTolerance * StdDev)
        """
        strategies = self.generate_feasible_strategies()
        risk_tolerance = params.get("risk_tolerance", 1.5)
        
        results = []
        for strat in strategies:
            # Run a smaller Monte Carlo for optimization
            times = []
            for _ in range(iterations):
                time = self.simulator.simulate_single_driver(
                    driver_profile=driver_profile,
                    strategy=strat,
                    total_laps=self.max_laps,
                    sc_prob=params.get("sc_probability", 0.15)
                )
                if time != float('inf'):
                    times.append(time)
            
            if not times: continue
            
            mean_time = np.mean(times)
            std_time = np.std(times)
            score = mean_time + (risk_tolerance * std_time)
            
            results.append({
                "strategy": strat,
                "mean_time": float(mean_time),
                "std_time": float(std_time),
                "score": float(score)
            })
            
        # Sort by score (lower is better)
        results.sort(key=lambda x: x["score"])
        
        return results[0] if results else None
