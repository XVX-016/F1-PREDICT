"""
Monte Carlo Simulation Engine - Phase 3
Simulates races using driver pace deltas + stochastic factors.
"""
import numpy as np
import pandas as pd
import logging
from typing import Dict, List, Any, Optional
from database.supabase_client import get_db
from simulation.race_simulator import RaceSimulator

logger = logging.getLogger(__name__)

class MonteCarloEngine:
    def __init__(self, n_simulations: int = 5000):
        self.n_simulations = n_simulations
        self.simulator = RaceSimulator()
        self.db = get_db()

    def run_monte_carlo(self, race_id: str):
        """
        Main entry point for Phase 3: Run 5000 simulations and store probabilities.
        """
        logger.info(f"🎲 Running {self.n_simulations} Monte Carlo simulations for race {race_id}")
        
        # 1. Fetch Inputs
        # Get pace deltas (from Phase 2)
        pace_res = self.db.table("pace_deltas").select("driver_id, pace_delta_ms").eq("race_id", race_id).execute()
        if not pace_res.data:
            logger.error(f"❌ No pace deltas found for race {race_id}")
            return
            
        # Get telemetry features (for variance)
        tele_res = self.db.table("telemetry_features").select("driver_id, sector_consistency").eq("race_id", race_id).execute()
        tele_map = {d["driver_id"]: d["sector_consistency"] for d in tele_res.data}

        # Build Driver Profiles
        driver_profiles = {}
        for row in pace_res.data:
            d_id = row["driver_id"]
            driver_profiles[d_id] = {
                "base_lap_ms": 90000,  # Generic base, deltas are relative
                "pace_delta_ms": row["pace_delta_ms"],
                "variance_ms": tele_map.get(d_id, 150.0),
                "dnf_prob": 0.05  # Standard baseline
            }

        if not driver_profiles:
            return

        # 2. Execute Simulations
        wins = {d: 0 for d in driver_profiles}
        podiums = {d: 0 for d in driver_profiles}
        top10s = {d: 0 for d in driver_profiles}

        for i in range(self.n_simulations):
            # Simulate
            race_times = self.simulator.simulate_race(driver_profiles, total_laps=57)
            positions = self.simulator.calculate_finishing_positions(race_times)
            
            for d_id, pos in positions.items():
                if pos == 1: wins[d_id] += 1
                if pos <= 3: podiums[d_id] += 1
                if pos <= 10: top10s[d_id] += 1

        # 3. Aggregate Probabilities
        results = []
        for d_id in driver_profiles:
            results.append({
                "race_id": race_id,
                "driver_id": d_id,
                "win_prob": wins[d_id] / self.n_simulations,
                "podium_prob": podiums[d_id] / self.n_simulations,
                "top10_prob": top10s[d_id] / self.n_simulations
            })

        # 4. Store in Supabase
        self._store_probabilities(results)
        
        logger.info(f"✅ Simulation complete for {len(results)} drivers")
        return results

    def _store_probabilities(self, results: List[Dict]):
        for res in results:
            try:
                self.db.table("outcome_probabilities").upsert(res).execute()
            except Exception as e:
                logger.error(f"Failed to store probability for {res['driver_id']}: {e}")

# Global wrapper
def run_monte_carlo(race_id: str, n_simulations: int = 5000):
    engine = MonteCarloEngine(n_simulations)
    return engine.run_monte_carlo(race_id)
