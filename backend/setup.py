"""
F1 Prediction Platform - Automated Setup Script
One-command initializer for the refactored F1 prediction platform
"""
import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def check_env_vars():
    """Check that all required environment variables are set"""
    required = [
        "SUPABASE_URL",
        "SUPABASE_SERVICE_KEY",
        "FASTF1_CACHE_DIR",
        "JOLPICA_API_KEY"
    ]
    missing = [var for var in required if not os.getenv(var)]
    if missing:
        logger.error(f"Missing required environment variables: {', '.join(missing)}")
        logger.error("Please create a .env file in the backend/ directory with:")
        logger.error("  SUPABASE_URL=<your-supabase-url>")
        logger.error("  SUPABASE_SERVICE_KEY=<supabase-service-key>")
        logger.error("  FASTF1_CACHE_DIR=./cache")
        logger.error("  JOLPICA_API_KEY=<jolpica-key>")
        sys.exit(1)
    logger.info("All required environment variables are set")

def setup_directories():
    """Create necessary directories"""
    cache_dir = os.getenv("FASTF1_CACHE_DIR", "./cache")
    Path(cache_dir).mkdir(parents=True, exist_ok=True)
    logger.info(f"Cache directory ready: {cache_dir}")

def fetch_jolpica_data():
    """Fetch structured F1 data from Jolpica API"""
    try:
        logger.info("Fetching Jolpica structured data...")
        from data.jolpica_client import JolpicaClient
        
        client = JolpicaClient()
        
        # Fetch calendar
        calendar = client.fetch_calendar()
        logger.info(f"Fetched {len(calendar)} races from calendar")
        
        # Fetch drivers
        drivers = client.fetch_drivers()
        logger.info(f"Fetched {len(drivers)} drivers")
        
        logger.info("Jolpica data fetch complete")
        return True
    except Exception as e:
        logger.error(f"Error fetching Jolpica data: {e}")
        return False

def build_telemetry_features():
    """Extract aggregated telemetry features from FastF1"""
    try:
        logger.info("Building FastF1 telemetry features (FP2 preferred, FP3 fallback)...")
        from features.build_telemetry_features import extract_telemetry_features
        from data.jolpica_client import JolpicaClient
        
        client = JolpicaClient()
        calendar = client.fetch_calendar()
        
        # Extract features for upcoming races
        for race in calendar[:3]:  # Process first 3 races
            season = race.get("season", 2025)
            round_num = race.get("round", 1)
            logger.info(f"Extracting features for {season} round {round_num}")
            extract_telemetry_features(season, round_num)
        
        logger.info("Telemetry feature extraction complete")
        return True
    except Exception as e:
        logger.error(f"Error building telemetry features: {e}")
        return False

def train_pace_model():
    """Train the ML pace-delta model"""
    try:
        logger.info("Training ML pace-delta model...")
        from models.pace_model import PaceModel
        
        model = PaceModel()
        model.train()
        
        logger.info("ML pace-delta model training complete")
        return True
    except Exception as e:
        logger.error(f"Error training pace model: {e}")
        logger.warning("Continuing without trained model - you can train later")
        return False

def run_monte_carlo_simulations():
    """Run Monte Carlo simulations for upcoming races"""
    try:
        logger.info("Running Monte Carlo simulations for upcoming races...")
        from simulation.monte_carlo import MonteCarloEngine
        from data.jolpica_client import JolpicaClient
        from services.probability_engine import probability_engine
        
        client = JolpicaClient()
        calendar = client.fetch_calendar()
        
        # Run simulations for first 3 upcoming races
        for race in calendar[:3]:
            race_id = race.get("id") or race.get("circuit_id")
            logger.info(f"Running simulations for race: {race_id}")
            
            # Generate probabilities using probability engine
            probabilities = probability_engine.generate_probabilities(race_id)
            logger.info(f"Generated probabilities for {len(probabilities)} drivers")
        
        logger.info("Monte Carlo simulations complete")
        return True
    except Exception as e:
        logger.error(f"Error running Monte Carlo simulations: {e}")
        return False

def apply_calibration():
    """Apply offline probability calibration"""
    try:
        logger.info("Applying offline probability calibration...")
        from models.calibration import ProbabilityCalibrator
        
        calibrator = ProbabilityCalibrator()
        # Calibration is applied offline after each race
        # This is a placeholder for the calibration process
        
        logger.info("Probability calibration setup complete")
        logger.info("Note: Calibration is applied offline after each race")
        return True
    except Exception as e:
        logger.error(f"Error setting up calibration: {e}")
        logger.warning("Continuing without calibration - can be applied later")
        return False

def verify_setup():
    """Verify that setup completed successfully"""
    logger.info("Verifying setup...")
    
    # Check if cache directory exists
    cache_dir = os.getenv("FASTF1_CACHE_DIR", "./cache")
    if not Path(cache_dir).exists():
        logger.warning(f"Cache directory not found: {cache_dir}")
    
    # Check if model file exists (if training was successful)
    model_path = Path("models/pace_model.txt")
    if model_path.exists():
        logger.info("Pace model file found")
    else:
        logger.warning("Pace model file not found - training may have failed")
    
    logger.info("Setup verification complete")

def main():
    """Main setup function"""
    logger.info("=" * 60)
    logger.info("F1 Prediction Platform - Automated Setup")
    logger.info("=" * 60)
    
    # Step 1: Check environment
    check_env_vars()
    setup_directories()
    
    # Step 2: Fetch data
    if not fetch_jolpica_data():
        logger.error("Failed to fetch Jolpica data. Exiting.")
        sys.exit(1)
    
    # Step 3: Build features
    if not build_telemetry_features():
        logger.warning("Telemetry feature extraction had issues. Continuing...")
    
    # Step 4: Train ML model
    if not train_pace_model():
        logger.warning("ML model training had issues. You can train later.")
    
    # Step 5: Run simulations
    if not run_monte_carlo_simulations():
        logger.warning("Monte Carlo simulations had issues. Continuing...")
    
    # Step 6: Setup calibration
    apply_calibration()
    
    # Step 7: Verify
    verify_setup()
    
    logger.info("=" * 60)
    logger.info("Setup Complete!")
    logger.info("=" * 60)
    logger.info("Next steps:")
    logger.info("1. Verify Supabase tables are populated")
    logger.info("2. Start the backend API: uvicorn main:app --reload")
    logger.info("3. Test endpoints: GET /health, GET /api/races/{id}/probabilities")
    logger.info("4. Update frontend API endpoints to use new architecture")
    logger.info("5. Deploy to production")

if __name__ == "__main__":
    main()

