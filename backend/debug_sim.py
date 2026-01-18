import sys
import os

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from services.simulation_engine import simulation_engine
from models.domain import SimulationRequest

def debug_sim():
    print("Initializing debug simulation...")
    req = SimulationRequest(
        track_id="abu_dhabi",
        tyre_deg_multiplier=1.0,
        sc_probability=0.18,
        strategy_aggression="balanced",
        weather_scenario="dry",
        use_ml=True,
        iterations=10
    )
    
    try:
        print("Running simulation...")
        results = simulation_engine.run_simulation(req)
        print("Simulation successful!")
        print(f"Metadata: {results.metadata}")
        print(f"VER Win Prob: {results.win_probability.get('VER', 0)}")
    except Exception as e:
        print(f"Simulation failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_sim()
