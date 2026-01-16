import os
import sys
import json
import logging
import pandas as pd
import lightgbm as lgb
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import List, Dict

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from database.supabase_client import get_db
from ml.features.feature_engineering import FeatureEngineer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ARTIFACT_DIR = Path("backend/ml/artifacts/models")
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

class ModelTrainer:
    def __init__(self):
        self.supabase = get_db()
        self.fe = FeatureEngineer()
        self.model_version = f"lgbm_v{datetime.utcnow().strftime('%Y%m%d_%H%M')}"
        
    def load_training_data(self) -> pd.DataFrame:
        """
        Loads training data (real telemetry + target pace deltas).
        For V1, generating realistic synthetic data based on physics bounds
        until enough real telemetry is ingested.
        """
        logger.info("Generating realistic training set...")
        data = []
        drivers = ["VER", "NOR", "LEC", "HAM", "SAI", "RUS", "ALO", "PIA"]
        
        for _ in range(500): # 500 samples
            driver = np.random.choice(drivers)
            
            # Base physics
            long_run = 90000 + np.random.normal(0, 1000)
            deg_rate = 0.05 + np.random.normal(0, 0.01)
            consistency = 150 + np.random.exponential(50)
            grid = np.random.randint(1, 21)
            form = np.random.randint(0, 26)
            
            # Target generation (Physics equation + noise)
            # This ensures the model learns physics-compliant relationships initially
            target_delta = (
                (grid * 50) # Grid penalty
                - (form * 10) # Form bonus
                + (deg_rate * 1000) # excessive deg penalty
                + np.random.normal(0, 200) # Aleatoric uncertainty
            )
            
            data.append({
                "driver_id": driver,
                "avg_long_run_pace_ms": long_run,
                "tire_deg_rate": deg_rate,
                "sector_consistency": consistency,
                "clean_air_delta": -150.0,
                "recent_form": form,
                "grid_position": grid,
                "target_pace_delta": target_delta
            })
            
        return pd.DataFrame(data)

    def train(self):
        df = self.load_training_data()
        
        features = [
            "avg_long_run_pace_ms", "tire_deg_rate", 
            "sector_consistency", "clean_air_delta", 
            "recent_form", "grid_position"
        ]
        target = "target_pace_delta"
        
        X = df[features]
        y = df[target]
        
        # Train LGBM
        train_data = lgb.Dataset(X, label=y)
        params = {
            "objective": "regression",
            "metric": "rmse",
            "learning_rate": 0.05,
            "num_leaves": 31,
            "verbose": -1
        }
        
        logger.info(f"Training {self.model_version}...")
        model = lgb.train(params, train_data, num_boost_round=500)
        
        # Save locally
        model_path = ARTIFACT_DIR / f"{self.model_version}.txt"
        model.save_model(str(model_path))
        logger.info(f"Model saved to {model_path}")
        
        # Generate predictions for Current Race (Simulated Live Data)
        current_grid = self.load_training_data().iloc[:20] # Mock current grid
        preds = model.predict(current_grid[features])
        
        self.persist_predictions(current_grid, preds)
        
    def persist_predictions(self, df: pd.DataFrame, preds: np.ndarray):
        """
        Saves predictions to Supabase `pace_deltas` table.
        """
        logger.info("Persisting predictions to Supabase...")
        records = []
        race_id = "00000000-0000-0000-0000-000000000000" # Placeholder for live race
        
        for idx, row in df.iterrows():
            records.append({
                "race_id": race_id,
                "driver_id": row['driver_id'],
                "lap_number": 0, # Base delta applied to all laps for now
                "predicted_delta_ms": float(preds[idx]),
                "model_version": self.model_version
            })
            
        try:
            # Upsert into supabase
            # self.supabase.table("pace_deltas").upsert(records).execute()
            logger.info(f"Would upsert {len(records)} records to Supabase (Mocked for safety).")
        except Exception as e:
            logger.error(f"Failed to persist: {e}")

if __name__ == "__main__":
    trainer = ModelTrainer()
    trainer.train()
