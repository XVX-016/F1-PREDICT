
import os
import sys
import subprocess
import logging

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Round -> 2024 Race Name to use as proxy
MAPPING = {
    1: "Australia",
    2: "China",
    3: "Japan",
    4: "Bahrain",
    5: "Saudi Arabia",
    6: "Miami",
    7: "Imola",
    8: "Monaco",
    9: "Spain",
    10: "Canada",
    11: "Austria",
    12: "Great Britain",
    13: "Belgium",
    14: "Hungary",
    15: "Netherlands",
    16: "Italy",
    17: "Azerbaijan",
    18: "Singapore",
    19: "USA",
    20: "Mexico",
    21: "Brazil",
    22: "Las Vegas",
    23: "Qatar",
    24: "Abu Dhabi"
}

def generate_all_2025():
    ingestion_script = os.path.join(os.path.dirname(__file__), 'replay_ingestion.py')
    
    for round_no, race_name in MAPPING.items():
        race_id = f"{round_no}_2025"
        logger.info(f"Generating telemetry for 2025 Round {round_no}: {race_name} -> {race_id}")
        
        # We ingest 2024 data but save it with 2025 ID
        # The script saves to {race_id}_{code}.json
        try:
            cmd = [
                sys.executable,
                ingestion_script,
                "--year", "2024",
                "--race", race_name
            ]
            
            # Since the script uses the --race arg for the filename, we need to hack it or rename
            # Let's modify replay_ingestion.py to accept an optional --output_id
            
            # Or better, just run it and RENAME the files in replay_cache.
            subprocess.run(cmd, check=True)
            
            # Rename files in replay_cache
            cache_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'replay_cache')
            for f in os.listdir(cache_dir):
                if f.startswith(f"{race_name}_") and f.endswith(".json"):
                    new_name = f.replace(f"{race_name}_", f"{race_id}_")
                    os.rename(os.path.join(cache_dir, f), os.path.join(cache_dir, new_name))
            
            logger.info(f"Successfully generated and mapped {race_id}")
            
        except Exception as e:
            logger.error(f"Failed to generate {race_id}: {e}")

if __name__ == "__main__":
    generate_all_2025()
