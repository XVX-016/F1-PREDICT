"""
Adversarial Stress Testing Module
Tests strategy fragility under parameter perturbations.
"""
import numpy as np
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from services.simulation_engine import simulation_engine
from models.domain import SimulationRequest, SimulationResponse
import logging

logger = logging.getLogger(__name__)

@dataclass
class StressResult:
    """Result of a single stress test."""
    perturbation_name: str
    perturbation_value: float
    strategy_flipped: bool
    original_utility: float
    stressed_utility: float
    delta: float

@dataclass
class StressTestReport:
    """Full report from adversarial stress testing."""
    verdict: str  # "Robust", "Sensitive", "Unstable"
    flip_count: int
    total_tests: int
    flip_causes: List[str]
    results: List[StressResult]
    recommendation_valid: bool

class AdversarialStressTester:
    """
    Tests strategy robustness by perturbing simulation parameters
    and checking if the recommended strategy changes.
    """
    
    # Perturbation dimensions and their ranges
    PERTURBATIONS = {
        "tyre_deg_multiplier": [1.0, 1.1, 1.2, 1.3],  # +0%, +10%, +20%, +30%
        "sc_probability": [0.1, 0.2, 0.3, 0.5],        # Various SC probabilities
        "alpha": [0.3, 0.5, 0.8, 1.2],                 # Risk aversion
        "beta": [0.5, 1.0, 1.5, 2.0],                  # DNF aversion
    }
    
    def __init__(self, engine=None):
        self.engine = engine or simulation_engine
    
    def run_stress_test(
        self,
        baseline_request: SimulationRequest,
        baseline_response: SimulationResponse
    ) -> StressTestReport:
        """
        Runs adversarial stress tests against the baseline simulation.
        Checks if the recommended strategy changes under perturbations.
        """
        baseline_strategy = baseline_response.strategy_recommendation.name.split(" | ")[0]
        
        results: List[StressResult] = []
        flip_causes: List[str] = []
        
        for param_name, values in self.PERTURBATIONS.items():
            for value in values:
                # Create perturbed request
                perturbed_params = baseline_request.params.copy()
                perturbed_params[param_name] = value
                
                perturbed_request = SimulationRequest(
                    track_id=baseline_request.track_id,
                    iterations=baseline_request.iterations // 2,  # Reduce for speed
                    seed=baseline_request.seed,
                    use_ml=baseline_request.use_ml,
                    params=perturbed_params,
                    events=baseline_request.events
                )
                
                try:
                    perturbed_response = self.engine.run_simulation(perturbed_request)
                    perturbed_strategy = perturbed_response.strategy_recommendation.name.split(" | ")[0]
                    
                    flipped = baseline_strategy != perturbed_strategy
                    
                    # Simplified utility comparison (using VER win prob as proxy)
                    orig_utility = baseline_response.win_probability.get("VER", 0.0)
                    stressed_utility = perturbed_response.win_probability.get("VER", 0.0)
                    delta = stressed_utility - orig_utility
                    
                    result = StressResult(
                        perturbation_name=param_name,
                        perturbation_value=value,
                        strategy_flipped=flipped,
                        original_utility=orig_utility,
                        stressed_utility=stressed_utility,
                        delta=delta
                    )
                    results.append(result)
                    
                    if flipped:
                        flip_causes.append(f"{param_name}={value}")
                        
                except Exception as e:
                    logger.warning(f"Stress test failed for {param_name}={value}: {e}")
        
        # Compute verdict
        flip_count = sum(1 for r in results if r.strategy_flipped)
        total_tests = len(results)
        
        if flip_count == 0:
            verdict = "Robust"
            recommendation_valid = True
        elif flip_count <= 2:
            verdict = "Sensitive"
            recommendation_valid = True
        else:
            verdict = "Unstable"
            recommendation_valid = flip_count / total_tests < 0.4
        
        return StressTestReport(
            verdict=verdict,
            flip_count=flip_count,
            total_tests=total_tests,
            flip_causes=flip_causes[:3],  # Top 3 causes
            results=results,
            recommendation_valid=recommendation_valid
        )


# Singleton instance
stress_tester = AdversarialStressTester()
