"""
Monte Carlo Engine - Runs 5k-10k simulations per race
Pure physics/stochastic - no ML in simulation
"""
import numpy as np
from typing import Dict, List, Any, Optional
import logging
from simulation.race_simulator import RaceSimulator

logger = logging.getLogger(__name__)

class MonteCarloEngine:
    """
    Monte Carlo simulation engine for F1 race predictions
    Runs multiple simulations and aggregates results into probabilities
    """
    
    def __init__(self, n_simulations: int = 10000, random_seed: Optional[int] = None):
        self.n_simulations = n_simulations
        self.simulator = RaceSimulator()
        
        if random_seed is not None:
            np.random.seed(random_seed)
        
        logger.info(f"Monte Carlo Engine initialized with {n_simulations} simulations")
    
    def simulate_race_probabilities(
        self,
        driver_profiles: Dict[str, Dict[str, Any]],
        total_laps: int = 60
    ) -> Dict[str, Dict[str, float]]:
        """
        Run Monte Carlo simulations and return probabilities
        
        Args:
            driver_profiles: Dict mapping driver_id to profile with:
                - base_lap_ms: Base lap time
                - pace_delta_ms: Pace delta from ML
                - variance_ms: Variance
                - dnf_prob: DNF probability
            total_laps: Total race laps
        
        Returns:
            Dict mapping driver_id to probabilities:
                - win_prob: Win probability
                - podium_prob: Podium probability (top 3)
                - top10_prob: Top 10 probability
        """
        logger.info(f"Running {self.n_simulations} Monte Carlo simulations...")
        
        # Initialize counters
        wins = {driver_id: 0 for driver_id in driver_profiles.keys()}
        podiums = {driver_id: 0 for driver_id in driver_profiles.keys()}
        top10s = {driver_id: 0 for driver_id in driver_profiles.keys()}
        
        # Run simulations
        for i in range(self.n_simulations):
            if (i + 1) % 1000 == 0:
                logger.info(f"   Progress: {i + 1}/{self.n_simulations} simulations")
            
            # Simulate one race
            race_times = self.simulator.simulate_race(driver_profiles, total_laps)
            positions = self.simulator.calculate_finishing_positions(race_times)
            
            # Count outcomes
            for driver_id, position in positions.items():
                if position == 1:
                    wins[driver_id] += 1
                if position <= 3:
                    podiums[driver_id] += 1
                if position <= 10:
                    top10s[driver_id] += 1
        
        # Calculate probabilities
        probabilities = {}
        for driver_id in driver_profiles.keys():
            probabilities[driver_id] = {
                "win_prob": wins[driver_id] / self.n_simulations,
                "podium_prob": podiums[driver_id] / self.n_simulations,
                "top10_prob": top10s[driver_id] / self.n_simulations
            }
        
        logger.info(f"Completed {self.n_simulations} simulations")
        return probabilities
    
    def get_simulation_seed(self) -> int:
        """Get current random seed for reproducibility"""
        return np.random.get_state()[1][0] if np.random.get_state()[0] == 'MT19937' else None





