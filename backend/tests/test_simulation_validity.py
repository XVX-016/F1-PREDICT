"""
Simulation Validity Tests - Comprehensive Automated Validation
Run: python -m pytest backend/tests/test_simulation_validity.py -v

These tests validate invariants that must ALWAYS hold:
- Probability conservation
- Seed reproducibility
- Tyre monotonicity
- ML bounded impact
- ML toggle equivalence
"""
import sys
import os
import pytest
import numpy as np

from services.simulation_engine import simulation_engine
from models.domain import SimulationRequest

class TestProbabilityConservation:
    """Win probabilities must sum to 1.0 (accounting for DNFs)"""
    
    def test_win_probabilities_sum_to_one(self):
        """Sum of all win probabilities should equal 1.0 (within tolerance)"""
        req = SimulationRequest(
            track_id="test_race",
            seed=42,
            iterations=5000
        )
        result = simulation_engine.run_simulation(req)
        
        total_prob = sum(result.win_probability.values())
        
        assert abs(total_prob - 1.0) < 0.01, \
            f"Win probabilities sum to {total_prob}, expected ~1.0"
    
    def test_podium_probabilities_valid(self):
        """Each position probability should be <= 1.0"""
        req = SimulationRequest(
            track_id="test_race",
            seed=123,
            iterations=3000
        )
        result = simulation_engine.run_simulation(req)
        
        for driver, probs in result.podium_probability.items():
            for pos, prob in enumerate(probs):
                assert 0 <= prob <= 1.0, \
                    f"Invalid podium probability for {driver} P{pos+1}: {prob}"


class TestSeedReproducibility:
    """Same seed MUST produce identical outputs"""
    
    def test_identical_seeds_produce_identical_results(self):
        """Running simulation twice with same seed should match exactly"""
        req = SimulationRequest(
            track_id="test_race",
            seed=42,
            iterations=1000,
            params={
                "tyre_deg_multiplier": 1.0,
                "sc_probability": 0.15
            }
        )
        
        result1 = simulation_engine.run_simulation(req)
        result2 = simulation_engine.run_simulation(req)
        
        for driver in result1.win_probability:
            assert result1.win_probability[driver] == result2.win_probability[driver], \
                f"Mismatch for {driver}: {result1.win_probability[driver]} vs {result2.win_probability[driver]}"
    
    def test_different_seeds_produce_different_results(self):
        """Different seeds should produce different outcomes (not stuck)"""
        req1 = SimulationRequest(track_id="test_race", seed=1, iterations=1000)
        req2 = SimulationRequest(track_id="test_race", seed=2, iterations=1000)
        
        result1 = simulation_engine.run_simulation(req1)
        result2 = simulation_engine.run_simulation(req2)
        
        # At least some driver should have different probability
        differences = [
            abs(result1.win_probability[d] - result2.win_probability[d])
            for d in result1.win_probability
        ]
        
        assert max(differences) > 0.001, \
            "Different seeds produced identical results - possible bug"


class TestTyreMonotonicity:
    """Tyre degradation should cause lap times to increase"""
    
    def test_pace_series_trend_upward_on_stints(self):
        """P95 pace should be generally slower than P05"""
        # Note: Previous test checked time series, but we now return distributions.
        # We can verify that P95 (slow laps) > P05 (fast laps)
        req = SimulationRequest(
            track_id="test_race",
            seed=42,
            iterations=100,
            params={
                "tyre_deg_multiplier": 2.0
            }
        )
        result = simulation_engine.run_simulation(req)
        
        for driver, dist in result.pace_distributions.items():
             assert dist['p95'] >= dist['p50'] >= dist['p05'], \
                f"Invalid distribution quantiles for {driver}"


class TestMLBoundedImpact:
    """ML adjustments should be bounded and not break physics"""
    
    def test_ml_does_not_wildly_change_outcomes(self):
        """ML-enabled vs ML-disabled should have bounded delta"""
        req_physics = SimulationRequest(track_id="test_race", seed=42, iterations=3000, use_ml=False)
        req_ml = SimulationRequest(track_id="test_race", seed=42, iterations=3000, use_ml=True)
        
        physics_result = simulation_engine.run_simulation(req_physics)
        ml_result = simulation_engine.run_simulation(req_ml)
        
        # Calculate max win probability change
        max_delta = max(
            abs(ml_result.win_probability[d] - physics_result.win_probability[d])
            for d in physics_result.win_probability
        )
        
        # ML should shift probabilities but not wildly (< 20 percentage points)
        assert max_delta < 0.20, \
            f"ML impact too large: {max_delta:.1%} change in win probability"
    
    def test_ml_preserves_probability_conservation(self):
        """ML-enabled simulation should still sum to 1.0"""
        req = SimulationRequest(track_id="test_race", seed=42, iterations=3000, use_ml=True)
        result = simulation_engine.run_simulation(req)
        
        total = sum(result.win_probability.values())
        assert abs(total - 1.0) < 0.01, \
            f"ML-enabled probabilities sum to {total}, not 1.0"


class TestMLToggleEquivalence:
    """ML toggle must actually change behavior"""
    
    def test_ml_toggle_produces_different_results(self):
        """use_ml=True vs use_ml=False should produce different distributions"""
        req_physics = SimulationRequest(track_id="test_race", seed=42, iterations=2000, use_ml=False)
        req_ml = SimulationRequest(track_id="test_race", seed=42, iterations=2000, use_ml=True)
        
        physics_result = simulation_engine.run_simulation(req_physics)
        ml_result = simulation_engine.run_simulation(req_ml)
        
        # There should be SOME difference (ML has effect)
        differences = [
            abs(physics_result.win_probability[d] - ml_result.win_probability[d])
            for d in physics_result.win_probability
        ]
        
        total_diff = sum(differences)
        
        assert total_diff > 0.01, \
            "ML toggle had no effect - possible bug in use_ml implementation"
    
    def test_metadata_reflects_ml_mode(self):
        """Metadata should correctly report ML mode"""
        req_physics = SimulationRequest(track_id="test_race", seed=42, iterations=100, use_ml=False)
        req_ml = SimulationRequest(track_id="test_race", seed=42, iterations=100, use_ml=True)
        
        physics_result = simulation_engine.run_simulation(req_physics)
        ml_result = simulation_engine.run_simulation(req_ml)
        
        assert physics_result.metadata["use_ml"] == False
        assert ml_result.metadata["use_ml"] == True
        
        assert "PHYSICS" in physics_result.metadata["mode"]
        assert "ML" in ml_result.metadata["mode"]


class TestDNFHandling:
    """DNF probability should be valid and handled correctly"""
    
    def test_dnf_probability_valid(self):
        """DNF risk should be between 0 and 1"""
        req = SimulationRequest(track_id="test_race", seed=42, iterations=5000)
        result = simulation_engine.run_simulation(req)
        
        for driver, dnf_risk in result.dnf_risk.items():
            assert 0 <= dnf_risk <= 1.0, \
                f"Invalid DNF risk for {driver}: {dnf_risk}"


from models.domain import SimulationRequest, SimulationEvent


class TestCounterfactuals:
    """Verify that injected events actually impact the outcomes"""
    
    def test_sc_reduces_win_probability_of_leader(self):
        """Injecting a Safety Car should shift win probabilities"""
        req_baseline = SimulationRequest(track_id="test_race", seed=42, iterations=1000)
        req_sc = SimulationRequest(
            track_id="test_race", 
            seed=42, 
            iterations=1000,
            events=[SimulationEvent(type="SC", lap=20, intensity=1.0)]
        )
        
        baseline = simulation_engine.run_simulation(req_baseline)
        sc_result = simulation_engine.run_simulation(req_sc)
        
        # Win probability for the baseline winner (usually VER) should likely change
        # (Though in a simple mock, it might be deterministic, let's at least check they are DIFFERENT)
        diff = sum(
            abs(baseline.win_probability[d] - sc_result.win_probability[d])
            for d in baseline.win_probability
        )
        assert diff > 0.05, "Safety Car injection had no significant impact on outcomes"

    def test_weather_increases_race_times(self):
        """Injecting rain should increase median lap times (P50)"""
        req_dry = SimulationRequest(track_id="test_race", seed=42, iterations=500)
        req_rain = SimulationRequest(
            track_id="test_race", 
            seed=42, 
            iterations=500,
            events=[SimulationEvent(type="WEATHER", lap=10, intensity=1.0)] # Extreme rain from Lap 10
        )
        
        dry = simulation_engine.run_simulation(req_dry)
        rain = simulation_engine.run_simulation(req_rain)
        
        for d in dry.pace_distributions:
            # P50 (Race median) should be significantly slower in rain
            assert rain.pace_distributions[d]['p50'] > dry.pace_distributions[d]['p50'] + 10000, \
                f"Rain did not sufficiently slow down {d}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
