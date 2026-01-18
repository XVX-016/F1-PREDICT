import numpy as np
from typing import List, Dict, Any, Tuple, Literal
from engine.simulation.simulator import RaceSimulator
from models.domain import TrackModel, DriverModel, StrategyResult, StrategyStint

class StrategyOptimizer:
    """
    Finds optimal race strategies (pit stops, compounds) using Monte Carlo evaluation.
    """
    
    def __init__(self, simulator: RaceSimulator):
        self.simulator = simulator
        self.compounds: List[Literal['soft', 'medium', 'hard']] = ["soft", "medium", "hard"]
        
    def generate_feasible_strategies(self, track: TrackModel) -> List[StrategyResult]:
        """
        Generates a set of valid race strategies (1 and 2 stops).
        """
        strategies = []
        max_laps = track.laps
        
        # 1-Stop Strategies
        for pit1 in range(15, 45, 3):
            for c1 in ["soft", "medium"]:
                for c2 in ["medium", "hard"]:
                    if c1 == c2: continue
                    strategies.append(StrategyResult(
                        name=f"1-Stop: {c1.upper()}-{c2.upper()} (L{pit1})",
                        stints=[
                            StrategyStint(compound=c1, end_lap=pit1),
                            StrategyStint(compound=c2, end_lap=max_laps)
                        ],
                        expected_time_loss=0, risk_score=0, robustness=0
                    ))
                    
        # 2-Stop Strategies
        for pit1 in range(12, 22, 5):
            for pit2 in range(35, 48, 5):
                strategies.append(StrategyResult(
                    name=f"2-Stop: S-M-H (L{pit1}, L{pit2})",
                    stints=[
                        StrategyStint(compound="soft", end_lap=pit1),
                        StrategyStint(compound="medium", end_lap=pit2),
                        StrategyStint(compound="hard", end_lap=max_laps)
                    ],
                    expected_time_loss=0, risk_score=0, robustness=0
                ))
        
        return strategies

    def optimize(
        self, 
        track: TrackModel,
        driver_profile: DriverModel, 
        params: Dict[str, Any],
        iterations: int = 500
    ) -> StrategyResult:
        """
        Evaluates strategies and returns the best one.
        Score = MeanTime + (RiskTolerance * StdDev)
        """
        strategies = self.generate_feasible_strategies(track)
        risk_tolerance = params.get("risk_tolerance", 1.5)
        tyre_deg = params.get("tyre_deg_multiplier", 1.0)
        
        optimization_results = []
        for strat in strategies:
            times = []
            for _ in range(iterations):
                time = self.simulator.simulate_single_driver(
                    track=track,
                    driver_profile=driver_profile,
                    strategy=strat,
                    tyre_deg_multiplier=tyre_deg
                )
                if time != float('inf'):
                    times.append(time)
            
            if not times: continue
            
            mean_time = np.mean(times)
            std_time = np.std(times)
            
            # Engineering-Grade Scoring
            # Robustness is inverse of variance (higher is better)
            robustness = 100 / (1 + (std_time / 1000)) 
            risk_score = (std_time / mean_time) * 1000
            
            # Baseline offset for comparison
            expected_loss = float(mean_time - (track.laps * 90000)) # Offset vs 90s lap
            
            strat.expected_time_loss = expected_loss
            strat.risk_score = float(risk_score)
            strat.robustness = float(robustness)
            
            score = mean_time + (risk_tolerance * std_time)
            
            optimization_results.append((score, strat))
            
        # Sort by score (lower is better)
        optimization_results.sort(key=lambda x: x[0])
        
        return optimization_results[0][1] if optimization_results else None
