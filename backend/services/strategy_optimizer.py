import numpy as np
<<<<<<< HEAD
from typing import List, Dict, Any, Tuple
from engine.simulation.simulator import RaceSimulator
=======
from typing import List, Dict, Any, Tuple, Literal, Optional
from engine.simulation.simulator import RaceSimulator
from models.domain import TrackModel, DriverModel, StrategyResult, StrategyStint, SimulationEvent
>>>>>>> feature/redis-telemetry-replay

class StrategyOptimizer:
    """
    Finds optimal race strategies (pit stops, compounds) using Monte Carlo evaluation.
    """
    
    def __init__(self, simulator: RaceSimulator):
        self.simulator = simulator
<<<<<<< HEAD
        self.compounds = ["Soft", "Medium", "Hard"]
        self.min_stint_laps = 10
        self.max_laps = 60
        
    def generate_feasible_strategies(self) -> List[Dict[str, Any]]:
=======
        self.compounds: List[Literal['soft', 'medium', 'hard']] = ["soft", "medium", "hard"]
        
    def generate_feasible_strategies(self, track: TrackModel) -> List[StrategyResult]:
>>>>>>> feature/redis-telemetry-replay
        """
        Generates a set of valid race strategies (1 and 2 stops).
        """
        strategies = []
<<<<<<< HEAD
        
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
=======
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
>>>>>>> feature/redis-telemetry-replay
        
        return strategies

    def optimize(
        self, 
<<<<<<< HEAD
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
=======
        track: TrackModel,
        driver_profile: DriverModel, 
        params: Dict[str, Any],
        iterations: int = 500,
        seed: Optional[int] = None,
        events: List[SimulationEvent] = None
    ) -> StrategyResult:
        """
        Evaluates strategies using Championship Utility Function:
        U = E[points] - alpha * Var(pos) - beta * P(DNF)
        """
        strategies = self.generate_feasible_strategies(track)
        
        # Utility Coefficients (clamped for sanity)
        alpha = np.clip(params.get("alpha", 0.5), 0.0, 2.0) # Risk aversion
        beta = np.clip(params.get("beta", 1.0), 0.0, 2.0) # DNF aversion
        tyre_deg = params.get("tyre_deg_multiplier", 1.0)
        
        # F1 Points System (Top 10)
        POINTS = {1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1}
        
        optimization_results = []
        for strat in strategies:
            times = []
            dnf_count = 0
            for i in range(iterations):
                iter_seed = (seed + i + abs(hash(strat.name))) if seed is not None else None
                
                time = self.simulator.simulate_single_driver(
                    track=track,
                    driver_profile=driver_profile,
                    strategy=strat,
                    tyre_deg_multiplier=tyre_deg,
                    seed=iter_seed,
                    injected_events=events
                )
                if time == float('inf'):
                    dnf_count += 1
                else:
                    times.append(time)
            
            if not times: 
                continue
            
            mean_time = np.mean(times)
            std_time = np.std(times)
            dnf_prob = dnf_count / iterations
            
            # Simplified Position Estimation (assumes mean_time correlates with position)
            # In a full implementation, this would use full-grid race simulation
            # For now, use variance as a proxy for position stability
            position_variance = (std_time / 1000) ** 2 # Seconds -> Proxy for position spread
            
            # Points Estimation (Best-guess based on pace)
            # Faster mean_time = higher expected points 
            # This is a proxy; real system would use full-grid MC
            expected_position = max(1, min(10, int(1 + (mean_time - 5200000) / 500)))
            expected_points = POINTS.get(expected_position, 0)
            
            # Utility Function
            utility = expected_points - alpha * position_variance - beta * dnf_prob * 25
            
            # Engineering-Grade Metrics
            robustness = 100 / (1 + (std_time / 1000))
            risk_score = (std_time / mean_time) * 1000
            expected_loss = float(mean_time - (track.laps * 90000))
            
            strat.expected_time_loss = expected_loss
            strat.risk_score = float(risk_score)
            strat.robustness = float(robustness)
            
            optimization_results.append((utility, strat, position_variance, dnf_prob))
            
        # Sort by utility (higher is better)
        optimization_results.sort(key=lambda x: x[0], reverse=True)
        
        if not optimization_results:
            return None
        
        best_utility, best_strat, _, best_dnf = optimization_results[0]
        
        # Dominance Margin
        dominance_margin = 0.0
        if len(optimization_results) > 1:
            runner_up_utility = optimization_results[1][0]
            dominance_margin = best_utility - runner_up_utility
        
        # Risk Profile Label
        if best_dnf > 0.15:
            risk_profile = "High Risk / High Upside"
        elif best_dnf > 0.05:
            risk_profile = "Moderate Risk"
        else:
            risk_profile = "Conservative / Stable"
        
        # Store additional metadata in the strategy name for now (replace with proper field later)
        best_strat.name = f"{best_strat.name} | Profile: {risk_profile} | Δ: {dominance_margin:.2f}"
        
        return best_strat
>>>>>>> feature/redis-telemetry-replay
