import numpy as np
import logging
from typing import Dict, List, Any, Optional
from engine.simulation.simulator import RaceSimulator
from engine.physics.tyre import tyre_lap_time
from engine.physics.fuel import fuel_time_penalty

logger = logging.getLogger(__name__)

class SimulationEngine:
    """
    Orchestrates deterministic physics models and Monte Carlo sampling.
    """
    
    def __init__(self):
        self.simulator = RaceSimulator()
        self.model_version = "v2.5.0-proto"
        self.iterations = 10000

    def run_simulation(
        self, 
        race_id: str, 
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Public entry point with sensitivity analysis.
        """
        # Run main simulation
        main_results = self.run_simulation_internal(race_id, params, self.iterations)
        
        # Generate Sensitivity
        tyre_deg = params.get("tyre_deg_multiplier", 1.0)
        params_plus = params.copy()
        params_plus["tyre_deg_multiplier"] = tyre_deg + 0.1
        
        plus_results = self.run_simulation_internal(race_id, params_plus, iterations=1000)
        
        deltas = {}
        for d in main_results["win_probability"].keys():
            diff = plus_results["win_probability"].get(d, 0) - main_results["win_probability"].get(d, 0)
            deltas[d] = float(diff)

        main_results["sensitivity"] = [{
            "parameter": "tyre_deg_multiplier",
            "baseline": tyre_deg,
            "modified": tyre_deg + 0.1,
            "deltas": deltas
        }]
        
        return main_results

    def run_simulation_internal(
        self, 
        race_id: str, 
        params: Dict[str, Any],
        iterations: int
    ) -> Dict[str, Any]:
        """
        Internal simulation core.
        """
        seed = params.get("seed")
        if seed is not None and seed != -1:
            np.random.seed(seed)
        
        driver_ids = ["VER", "NOR", "LEC", "PIA", "SAI", "HAM", "RUS", "ALO", "PER", "STR"]
        tyre_deg = params.get("tyre_deg_multiplier", 1.0)
        
        driver_profiles = {}
        for i, d in enumerate(driver_ids):
            base_lap = 90000 + (i * 150)
            driver_profiles[d] = {
                "base_lap_ms": base_lap,
                "pace_delta_ms": np.random.normal(0, 100),
                "variance_ms": 150,
                "dnf_prob": 0.03 + (params.get("sc_probability", 0.15) * 0.1)
            }

        win_counts = {d: 0 for d in driver_ids}
        podium_counts = {d: [0, 0, 0] for d in driver_ids}
        dnf_counts = {d: 0 for d in driver_ids}

        for _ in range(iterations):
            race_times = self.simulator.simulate_race(
                driver_profiles=driver_profiles,
                total_laps=60
            )
            sorted_times = sorted(race_times.items(), key=lambda x: x[1])
            for rank, (d, t) in enumerate(sorted_times):
                if t == float('inf'):
                    dnf_counts[d] += 1
                    continue
                if rank == 0: win_counts[d] += 1
                if rank < 3: podium_counts[d][rank] += 1

        win_prob = {d: count / iterations for d, count in win_counts.items()}
        podium_prob = {d: [c / iterations for c in counts] for d, counts in podium_counts.items()}
        dnf_risk = {d: count / iterations for d, count in dnf_counts.items()}
        
        # Pace Series (simplified for internal)
        pace_series = {}
        for d in driver_ids:
            base_delta = -0.5 if d == "VER" else (driver_ids.index(d) * 0.1)
            series = []
            for lap in range(1, 61):
                fuel_impact = -0.03 * lap
                tyre_impact = 0.04 * tyre_deg * (lap % 20)
                series.append(float(base_delta + fuel_impact + tyre_impact + np.random.normal(0, 0.05)))
            pace_series[d] = series

        return {
            "win_probability": win_prob,
            "podium_probability": podium_prob,
            "dnf_risk": dnf_risk,
            "pace_series": pace_series,
            "explanations": {
                "VER": ["High aerodynamic efficiency favors current track layout."],
                "NOR": ["Strong sector 2 performance offset by poor start statistics."],
                "LEC": ["Maximum cooling required; potential performance drop in traffic."]
            },
            "metadata": {
                "iterations": iterations,
                "seed": seed if seed is not None else -1,
                "model_version": self.model_version
            }
        }

# Singleton instance
simulation_engine = SimulationEngine()
