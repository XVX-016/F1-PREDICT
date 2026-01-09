"""
Probability Engine - Combines simulation + ML deltas into outcome probabilities
This is the ONLY thing frontend consumes
"""
import logging
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from simulation.monte_carlo import MonteCarloEngine
from models.calibration import calibrator
from database.supabase_client import get_db

logger = logging.getLogger(__name__)

class ProbabilityEngine:
    """
    Combines simulation distributions with calibrated ML pace deltas
    Outputs probabilities that frontend consumes
    """
    
    def __init__(self, n_simulations: int = 10000):
        self.monte_carlo = MonteCarloEngine(n_simulations=n_simulations)
        self.db = get_db()
    
    def generate_probabilities(
        self,
        race_id: str,
        driver_profiles: Dict[str, Dict[str, Any]],
        total_laps: int = 60,
        apply_calibration: bool = True
    ) -> Dict[str, Dict[str, float]]:
        """
        Generate outcome probabilities for a race
        
        Args:
            race_id: Race UUID
            driver_profiles: Dict mapping driver_id to profile with:
                - base_lap_ms: Base lap time
                - pace_delta_ms: Pace delta from ML
                - variance_ms: Variance
                - dnf_prob: DNF probability
            total_laps: Total race laps
            apply_calibration: Whether to apply probability calibration
        
        Returns:
            Dict mapping driver_id to probabilities:
                - win_prob: Win probability
                - podium_prob: Podium probability
                - top10_prob: Top 10 probability
        """
        logger.info(f"Generating probabilities for race {race_id}")
        
        # Run Monte Carlo simulation
        probabilities = self.monte_carlo.simulate_race_probabilities(
            driver_profiles,
            total_laps
        )
        
        # Apply calibration if enabled
        if apply_calibration and calibrator.is_fitted:
            probabilities = calibrator.calibrate_probabilities(probabilities)
        
        # Store in database
        self._store_probabilities(race_id, probabilities)
        
        return probabilities
    
    def _store_probabilities(
        self,
        race_id: str,
        probabilities: Dict[str, Dict[str, float]]
    ):
        """Store probabilities in Supabase"""
        try:
            # Get simulation run ID
            simulation_run = self.db.table("simulation_runs").insert({
                "race_id": race_id,
                "n_simulations": self.monte_carlo.n_simulations,
                "seed": self.monte_carlo.get_simulation_seed()
            }).execute()
            
            simulation_run_id = simulation_run.data[0]["id"]
            
            # Store probabilities
            for driver_id, probs in probabilities.items():
                self.db.table("outcome_probabilities").upsert({
                    "race_id": race_id,
                    "driver_id": driver_id,
                    "win_prob": probs["win_prob"],
                    "podium_prob": probs["podium_prob"],
                    "top10_prob": probs["top10_prob"],
                    "simulation_run_id": simulation_run_id
                }).execute()
            
            logger.info(f"Stored probabilities for {len(probabilities)} drivers")
        except Exception as e:
            logger.error(f"Failed to store probabilities: {e}")
    
    def get_probabilities(
        self,
        race_id: str
    ) -> Optional[Dict[str, Dict[str, float]]]:
        """
        Get stored probabilities for a race
        
        Args:
            race_id: Race UUID
        
        Returns:
            Dict mapping driver_id to probabilities, or None if not found
        """
        try:
            result = self.db.table("outcome_probabilities").select("*").eq(
                "race_id", race_id
            ).execute()
            
            if not result.data:
                return None
            
            probabilities = {}
            for row in result.data:
                driver_id = row["driver_id"]
                probabilities[driver_id] = {
                    "win_prob": row["win_prob"],
                    "podium_prob": row["podium_prob"],
                    "top10_prob": row["top10_prob"]
                }
            
            return probabilities
        except Exception as e:
            logger.error(f"Failed to get probabilities: {e}")
            return None

# Global instance
probability_engine = ProbabilityEngine()

