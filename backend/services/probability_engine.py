"""
Probability Engine - Core Orchestrator
Combines simulation and calibration into production-ready probabilities.
"""
import logging
from typing import Dict, List, Any, Optional
from simulation.monte_carlo import MonteCarloEngine
from calibration.apply_isotonic import calibrate_probabilities, IsotonicCalibrator
from database.supabase_client import get_db

logger = logging.getLogger(__name__)

class ProbabilityEngine:
    def __init__(self):
        self.db = get_db()

    def get_probabilities(self, race_id: str) -> Optional[List[Dict]]:
        """
        Fetch stored probabilities for a race.
        """
        try:
            res = self.db.table("outcome_probabilities")\
                .select("*, drivers(name, constructor_id)")\
                .eq("race_id", race_id)\
                .execute()
            
            return res.data if res.data else None
        except Exception as e:
            logger.error(f"Failed to fetch probabilities: {e}")
            return None

    def run_full_pipeline(self, race_id: str):
        """
        Runs the full simulation -> calibration pipeline for a race.
        """
        from simulation.monte_carlo import run_monte_carlo
        
        # 1. Run raw simulation
        raw_results = run_monte_carlo(race_id)
        if not raw_results:
            return None
            
        # 2. Apply calibration
        calibrated_results = calibrate_probabilities(raw_results)
        
        # 3. Store calibrated results (upsert)
        for res in calibrated_results:
            self.db.table("outcome_probabilities").upsert(res).execute()
            
        return calibrated_results

# Global instance
probability_engine = ProbabilityEngine()
