
import sys
import os
import time

# Ensure backend in path
sys.path.append(os.getcwd())

try:
    from services.simulation_engine import simulation_engine
    from models.domain import SimulationRequest, LapFrame
    print("Imports successful.")
except Exception as e:
    print(f"Import failed: {e}")
    sys.exit(1)

def test_sim():
    print("Running Manual Simulation Test...")
    req = SimulationRequest(
        track_id="abu_dhabi",
        seed=42,
        iterations=100,
        use_ml=True
    )
    
    start = time.time()
    try:
        res = simulation_engine.run_simulation(req)
        print(f"Simulation completed in {time.time() - start:.2f}s")
    except Exception as e:
        print(f"Simulation crashed: {e}")
        import traceback
        traceback.print_exc()
        return

    print("Win Probs:", res.win_probability)
    print("Robustness:", res.robustness_score)
    print("Pace Dist (VER):", res.pace_distributions.get("VER"))
    
    # Check Invariants
    total_prob = sum(res.win_probability.values())
    print(f"Total Prob: {total_prob}")
    if abs(total_prob - 1.0) > 0.01:
        print("FAIL: Probability conservation")
    else:
        print("PASS: Probability conservation")

    if "p05" in res.pace_distributions["VER"]:
        print("PASS: Distribution metrics present")
    else:
        print("FAIL: Distribution metrics missing")

if __name__ == "__main__":
    test_sim()
