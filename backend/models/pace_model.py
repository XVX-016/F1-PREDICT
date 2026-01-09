"""
Pace Delta ML Model - LightGBM regression
Target: pace_delta_ms = driver_avg_lap - session_mean_lap
NO winner/position prediction - only relative pace
"""
import lightgbm as lgb
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
import logging
import os
import json
from datetime import datetime

logger = logging.getLogger(__name__)

class PaceModel:
    """
    ML model that predicts ONLY relative pace deltas
    Never predicts winners or positions
    """
    
    def __init__(self, model_path: Optional[str] = None):
        self.model = None
        self.model_path = model_path or "models/pace_model.txt"
        self.features = [
            "qualifying_delta_to_pole",
            "avg_long_run_pace_ms",
            "tire_deg_rate",
            "sector_consistency",
            "recent_form_ewma",
            "track_downforce_index"
        ]
        self.model_version = "1.0.0"
        
    def train(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        validation_split: float = 0.2
    ) -> Dict[str, Any]:
        """
        Train the pace delta model
        
        Args:
            X: Feature dataframe
            y: Target series (pace_delta_ms)
            validation_split: Validation split ratio
        
        Returns:
            Training metrics
        """
        from sklearn.model_selection import train_test_split
        
        # Ensure we have the right features
        X = X[self.features]
        
        # Split data
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=validation_split, shuffle=False  # Time series split
        )
        
        # Create LightGBM dataset
        train_data = lgb.Dataset(X_train, label=y_train)
        val_data = lgb.Dataset(X_val, label=y_val, reference=train_data)
        
        # Model parameters
        params = {
            "objective": "regression_l1",  # L1 loss (Huber)
            "metric": "mae",
            "boosting_type": "gbdt",
            "num_leaves": 31,
            "learning_rate": 0.03,
            "feature_fraction": 0.8,
            "bagging_fraction": 0.8,
            "bagging_freq": 5,
            "verbose": -1
        }
        
        # Train model
        self.model = lgb.train(
            params,
            train_data,
            valid_sets=[val_data],
            num_boost_round=500,
            callbacks=[lgb.early_stopping(50), lgb.log_evaluation(100)]
        )
        
        # Evaluate
        train_pred = self.model.predict(X_train)
        val_pred = self.model.predict(X_val)
        
        train_mae = np.mean(np.abs(train_pred - y_train))
        val_mae = np.mean(np.abs(val_pred - y_val))
        
        metrics = {
            "train_mae": float(train_mae),
            "val_mae": float(val_mae),
            "model_version": self.model_version
        }
        
        logger.info(f"Model trained - Train MAE: {train_mae:.2f}ms, Val MAE: {val_mae:.2f}ms")
        
        # Save model
        self.save()
        
        return metrics
    
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Predict pace deltas
        
        Args:
            X: Feature dataframe
        
        Returns:
            Array of pace_delta_ms predictions
        """
        if self.model is None:
            raise ValueError("Model not trained or loaded")
        
        # Ensure we have the right features
        X = X[self.features]
        
        predictions = self.model.predict(X)
        return predictions
    
    def save(self, path: Optional[str] = None):
        """Save model to file"""
        if self.model is None:
            raise ValueError("No model to save")
        
        save_path = path or self.model_path
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        
        self.model.save_model(save_path)
        logger.info(f"Model saved to {save_path}")
    
    def load(self, path: Optional[str] = None):
        """Load model from file"""
        load_path = path or self.model_path
        
        if not os.path.exists(load_path):
            raise FileNotFoundError(f"Model file not found: {load_path}")
        
        self.model = lgb.Booster(model_file=load_path)
        logger.info(f"Model loaded from {load_path}")
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance"""
        if self.model is None:
            raise ValueError("Model not loaded")
        
        importance = self.model.feature_importance(importance_type='gain')
        feature_importance = dict(zip(self.features, importance))
        
        return feature_importance

# Global instance
pace_model = PaceModel()





