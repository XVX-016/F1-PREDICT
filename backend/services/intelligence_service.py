import logging
import random
from collections import defaultdict
from datetime import datetime
from typing import Dict, Any, List, Optional
from models.domain import SimulationTraceArtifact, IntelligenceAnalysis
from data.driver_priors import get_driver_prior
from services.baseline_service import baseline_service

logger = logging.getLogger(__name__)

class IntelligenceService:
    """
    Transforms internal simulation artifacts or deterministic priors 
    into public intelligence analysis. Enforces the 'Inference vs Execution' boundary.
    """
    
    def __init__(self):
        self.model_version = "v3.0.1-inference"

    def generate_analysis(self, race_id: str, driver_ids: List[str]) -> IntelligenceAnalysis:
        """
        Generates an analytical intelligence report without running a full sandbox simulation.
        Anchored in deterministic baselines + probabilistic priors.
        """
        try:
            # 1. Estimate podium probabilities via Monte Carlo on priors
            podium_probs = self.estimate_podium_probabilities(driver_ids)
            
            # 2. Get baseline pace deltas
            baseline_summary = baseline_service.compute_expected_race_order(race_id, driver_ids)
            pace_dist = {
                b["driver_id"]: {"p05": b["delta"] - b["uncertainty"], "p50": b["delta"], "p95": b["delta"] + b["uncertainty"]}
                for b in baseline_summary
            }
            
            # 3. Simple win probability (P1 likelihood from podium MC)
            win_probs = {d: probs[0] for d, probs in podium_probs.items()}
            
            # 4. Map robustness (based on consistency priors)
            robustness = {d: get_driver_prior(d).consistency_score for d in driver_ids}
            
            return IntelligenceAnalysis(
                race_id=race_id,
                model_version=self.model_version,
                generated_at=datetime.utcnow().isoformat(),
                win_probability=win_probs,
                podium_probability=podium_probs,
                pace_distributions=pace_dist,
                robustness_score=robustness,
                mode="INFERENCE_ONLY",
                explanation="Inference over deterministic physics baseline with bounded residual correction. Zero-Sim Analytical Mode."
            )
        except Exception as e:
            logger.error(f"Inference-only intelligence generation failed: {e}")
            raise

    def estimate_podium_probabilities(self, driver_ids: List[str], samples: int = 5000) -> Dict[str, List[float]]:
        """
        Defensible podium estimation using Monte Carlo sampling over driver priors.
        Returns {driver_id: [P1, P2, P3]}
        """
        counts = defaultdict(lambda: [0, 0, 0])
        
        for _ in range(samples):
            # Sample lap times from priors
            sampled_times = {}
            for d_id in driver_ids:
                prior = get_driver_prior(d_id)
                # Sample a "race performance factor"
                sampled_times[d_id] = prior.pace_delta_mean + random.gauss(0, prior.pace_delta_std)
            
            # Rank drivers by sampled performance (lower is better/faster)
            sorted_drivers = sorted(sampled_times.keys(), key=lambda x: sampled_times[x])
            
            # Count finishes
            for i in range(min(3, len(sorted_drivers))):
                counts[sorted_drivers[i]][i] += 1
                
        # Convert to probabilities
        probs = {}
        for d_id in driver_ids:
            p1 = counts[d_id][0] / samples
            p2 = counts[d_id][1] / samples
            p3 = counts[d_id][2] / samples
            probs[d_id] = [p1, p2, p3]
            
        return probs

    def process_artifact(self, race_id: str, artifact: SimulationTraceArtifact) -> IntelligenceAnalysis:
        """
        Converts a raw simulation artifact into a UI-safe IntelligenceAnalysis.
        """
        try:
            return IntelligenceAnalysis(
                race_id=race_id,
                model_version=self.model_version,
                generated_at=datetime.utcnow().isoformat(),
                win_probability=artifact.win_probability,
                podium_probability=artifact.podium_probability,
                pace_distributions=artifact.pace_distributions,
                robustness_score=artifact.robustness_score,
                mode=artifact.metadata.get("mode", "PHYSICS_ML_HYBRID"),
                explanation="Inference over deterministic physics baseline with bounded residual correction."
            )
        except Exception as e:
            logger.error(f"Intelligence processing failed: {e}")
            raise

# Singleton instance
intelligence_service = IntelligenceService()
