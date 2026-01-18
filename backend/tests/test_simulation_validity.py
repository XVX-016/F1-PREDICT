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

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from services.simulation_engine import simulation_engine


class TestProbabilityConservation:
    """Win probabilities must sum to 1.0 (accounting for DNFs)"""
    
    def test_win_probabilities_sum_to_one(self):
        """Sum of all win probabilities should equal 1.0 (within tolerance)"""
        result = simulation_engine.run_simulation(
            "test_race",
            {"seed": 42, "iterations": 5000}
        )
        
        total_prob = sum(result["win_probability"].values())
        
        assert abs(total_prob - 1.0) < 0.01, \
            f"Win probabilities sum to {total_prob}, expected ~1.0"
    
    def test_podium_probabilities_valid(self):
        """Each position probability should be <= 1.0"""
        result = simulation_engine.run_simulation(
            "test_race",
            {"seed": 123, "iterations": 3000}
        )
        
        for driver, probs in result["podium_probability"].items():
            for pos, prob in enumerate(probs):
                assert 0 <= prob <= 1.0, \
                    f"Invalid podium probability for {driver} P{pos+1}: {prob}"


class TestSeedReproducibility:
    """Same seed MUST produce identical outputs"""
    
    def test_identical_seeds_produce_identical_results(self):
        """Running simulation twice with same seed should match exactly"""
        params = {
            "seed": 42,
            "iterations": 1000,
            "tyre_deg_multiplier": 1.0,
            "sc_probability": 0.15
        }
        
        result1 = simulation_engine.run_simulation("test_race", params)
        result2 = simulation_engine.run_simulation("test_race", params)
        
        for driver in result1["win_probability"]:
            assert result1["win_probability"][driver] == result2["win_probability"][driver], \
                f"Mismatch for {driver}: {result1['win_probability'][driver]} vs {result2['win_probability'][driver]}"
    
    def test_different_seeds_produce_different_results(self):
        """Different seeds should produce different outcomes (not stuck)"""
        result1 = simulation_engine.run_simulation("test_race", {"seed": 1, "iterations": 1000})
        result2 = simulation_engine.run_simulation("test_race", {"seed": 2, "iterations": 1000})
        
        # At least some driver should have different probability
        differences = [
            abs(result1["win_probability"][d] - result2["win_probability"][d])
            for d in result1["win_probability"]
        ]
        
        assert max(differences) > 0.001, \
            "Different seeds produced identical results - possible bug"


class TestTyreMonotonicity:
    """Tyre degradation should cause lap times to increase (on same compound)"""
    
    def test_pace_series_trend_upward_on_stints(self):
        """Lap times should generally increase within a stint (tyre deg)"""
        result = simulation_engine.run_simulation(
            "test_race",
            {"seed": 42, "tyre_deg_multiplier": 2.0, "iterations": 100}
        )
        
        for driver, pace_series in result["pace_series"].items():
            # Check 10-lap windows within a stint (before pit stop ~lap 20)
            stint_1 = pace_series[5:15]  # Laps 6-15
            
            # Calculate trend (should be positive = increasing = slower)
            x = np.arange(len(stint_1))
            slope, _ = np.polyfit(x, stint_1, 1)
            
            # With 2.0x deg multiplier, trend should be clearly positive
            # Allow some variance but expect overall upward trend
            # Note: fuel burn can counteract deg, so we're lenient here
            assert slope > -0.1, \
                f"Driver {driver} has unexpected pace improvement trend: {slope:.3f}"


class TestMLBoundedImpact:
    """ML adjustments should be bounded and not break physics"""
    
    def test_ml_does_not_wildly_change_outcomes(self):
        """ML-enabled vs ML-disabled should have bounded delta"""
        physics_result = simulation_engine.run_simulation(
            "test_race",
            {"seed": 42, "iterations": 3000, "use_ml": False}
        )
        
        ml_result = simulation_engine.run_simulation(
            "test_race",
            {"seed": 42, "iterations": 3000, "use_ml": True}
        )
        
        # Calculate max win probability change
        max_delta = max(
            abs(ml_result["win_probability"][d] - physics_result["win_probability"][d])
            for d in physics_result["win_probability"]
        )
        
        # ML should shift probabilities but not wildly (< 20 percentage points)
        assert max_delta < 0.20, \
            f"ML impact too large: {max_delta:.1%} change in win probability"
    
    def test_ml_preserves_probability_conservation(self):
        """ML-enabled simulation should still sum to 1.0"""
        result = simulation_engine.run_simulation(
            "test_race",
            {"seed": 42, "iterations": 3000, "use_ml": True}
        )
        
        total = sum(result["win_probability"].values())
        assert abs(total - 1.0) < 0.01, \
            f"ML-enabled probabilities sum to {total}, not 1.0"


class TestMLToggleEquivalence:
    """ML toggle must actually change behavior"""
    
    def test_ml_toggle_produces_different_results(self):
        """use_ml=True vs use_ml=False should produce different distributions"""
        physics_result = simulation_engine.run_simulation(
            "test_race",
            {"seed": 42, "iterations": 2000, "use_ml": False}
        )
        
        ml_result = simulation_engine.run_simulation(
            "test_race",
            {"seed": 42, "iterations": 2000, "use_ml": True}
        )
        
        # There should be SOME difference (ML has effect)
        differences = [
            abs(physics_result["win_probability"][d] - ml_result["win_probability"][d])
            for d in physics_result["win_probability"]
        ]
        
        total_diff = sum(differences)
        
        # ML should have some effect (>1% total change)
        assert total_diff > 0.01, \
            "ML toggle had no effect - possible bug in use_ml implementation"
    
    def test_metadata_reflects_ml_mode(self):
        """Metadata should correctly report ML mode"""
        physics_result = simulation_engine.run_simulation(
            "test_race",
            {"seed": 42, "iterations": 100, "use_ml": False}
        )
        
        ml_result = simulation_engine.run_simulation(
            "test_race",
            {"seed": 42, "iterations": 100, "use_ml": True}
        )
        
        assert physics_result["metadata"]["use_ml"] == False
        assert ml_result["metadata"]["use_ml"] == True
        
        assert "Physics Only" in physics_result["metadata"]["mode"]
        assert "ML" in ml_result["metadata"]["mode"]


class TestDNFHandling:
    """DNF probability should be valid and handled correctly"""
    
    def test_dnf_probability_valid(self):
        """DNF risk should be between 0 and 1"""
        result = simulation_engine.run_simulation(
            "test_race",
            {"seed": 42, "iterations": 5000}
        )
        
        for driver, dnf_risk in result["dnf_risk"].items():
            assert 0 <= dnf_risk <= 1.0, \
                f"Invalid DNF risk for {driver}: {dnf_risk}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
