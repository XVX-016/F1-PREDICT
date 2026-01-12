"""
Pace Delta ML Model - LightGBM regression
Target: pace_delta_ms = driver_avg_lap - session_mean_lap
Predicts relative pace deltas for use in Monte Carlo simulations.
"""
import lightgbm as lgb
import pandas as pd
import numpy as np
import logging
import os
import joblib
from typing import Dict, List, Any, Optional
from database.supabase_client import get_db

logger = logging.getLogger(__name__)

class PaceModel:
    def __init__(self, model_path: str = "models/pace_model.joblib"):
        self.model = None
        self.model_path = model_path
        self.db = get_db()
        self.features = [
            "avg_long_run_pace_ms",
            "tire_deg_rate",
            "sector_consistency",
            "clean_air_delta",
            "recent_form_ewma",
            "grid_position"  # Grid position is a strong proxy for pace
        ]

    def train_on_history(self, races_count: int = 20):
        """
        Phase 2: Train on recent historical data from Supabase.
        """
        logger.info(f"🚂 Training pace model on last {races_count} races...")
        
        # 1. Fetch data from Supabase
        # We need telemetry_features joined with some target (e.g. actual race lap times)
        # For simplicity in this rehaul, we'll use the telemetry pace itself as a baseline
        # and calculate deltas relative to session mean.
        
        try:
            res = self.db.table("telemetry_features")\
                .select("*, races(season, round)")\
                .order("created_at", desc=True)\
                .limit(races_count * 20)\
                .execute()
            
            if not res.data:
                logger.warning("No data found for training")
                return
                
            df = pd.DataFrame(res.data)
            
            # Calculate target: pace_delta_ms = avg_pace - session_mean_pace
            df["session_mean"] = df.groupby("race_id")["avg_long_run_pace_ms"].transform("mean")
            df["pace_delta_ms"] = df["avg_long_run_pace_ms"] - df["session_mean"]
            
            # 2. Train LightGBM
            X = df[self.features]
            y = df["pace_delta_ms"]
            
            train_data = lgb.Dataset(X, label=y)
            params = {
                "objective": "regression",
                "metric": "rmse",
                "boosting_type": "gbdt",
                "learning_rate": 0.05,
                "num_leaves": 15,
                "verbose": -1
            }
            
            self.model = lgb.train(params, train_data, num_boost_round=100)
            
            # 3. Save model
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            joblib.dump(self.model, self.model_path)
            logger.info(f"✅ Model trained and saved to {self.model_path}")
            
        except Exception as e:
            logger.error(f"❌ Training failed: {e}")

    def predict_for_race(self, race_id: str) -> pd.DataFrame:
        """
        Predict pace deltas for a specific race and store in Supabase.
        """
        if not self.model:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
            else:
                logger.error("No model found. Train first.")
                return pd.DataFrame()

        # Fetch features for this race
        res = self.db.table("telemetry_features").select("*").eq("race_id", race_id).execute()
        if not res.data:
            return pd.DataFrame()
            
        df = pd.DataFrame(res.data)
        
        # Ensure all features exist (handle missing recent_form)
        for f in self.features:
            if f not in df.columns:
                df[f] = 0.0 if "ewma" in f else 10.0 # Default grid pos 10
                
        df["predicted_pace_delta_ms"] = self.model.predict(df[self.features])
        
        # Store in pace_deltas table
        self._store_predictions(race_id, df)
        
        return df

    def _store_predictions(self, race_id: str, df: pd.DataFrame):
        for _, row in df.iterrows():
            try:
                self.db.table("pace_deltas").upsert({
                    "race_id": race_id,
                    "driver_id": row["driver_id"],
                    "pace_delta_ms": row["predicted_pace_delta_ms"]
                }).execute()
            except Exception as e:
                logger.error(f"Failed to store pace delta for {row['driver_id']}: {e}")

# Global wrapper
def predict_pace(race_id: str) -> pd.DataFrame:
    model = PaceModel()
    return model.predict_for_race(race_id)
