
import sys
import os

print("CWD:", os.getcwd())
print("Sys Path:", sys.path)

try:
    import services.simulation_engine
    print("Import 'services.simulation_engine' SUCCESS")
except Exception as e:
    print("Import 'services.simulation_engine' FAILED:", e)

try:
    from engine.simulation.simulator import RaceSimulator
    print("Import 'engine.simulation.simulator' SUCCESS")
except Exception as e:
    print("Import 'engine.simulation.simulator' FAILED:", e)

try:
    from models.domain import LapFrame
    print("Import 'models.domain' SUCCESS")
except Exception as e:
    print("Import 'models.domain' FAILED:", e)
