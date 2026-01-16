import os
import json
import hashlib
from datetime import datetime
from pathlib import Path
import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.metrics import mean_squared_error, mean_absolute_error

# In a real scenario, we'd import build_features and use FastF1 to load data.
# For this implementation, we'll implement a mock trainer that saves a versioned model.

ARTIFACT_DIR = Path("ml/artifacts")
MODEL_DIR = ARTIFACT_DIR / "models"
REPORT_DIR = ARTIFACT_DIR / "reports"

MODEL_VERSION = f"lgbm_v{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

def train_model(X: pd.DataFrame, y: pd.Series):
    """
    Trains a LightGBM regressor for pace delta prediction.
    """
    params = {
        "objective": "regression",
        "metric": "rmse",
        "learning_rate": 0.05,
        "num_leaves": 31,
        "feature_fraction": 0.8,
        "verbosity": -1,
    }
    
    # Simple split (In reality, use race-blocked split)
    split = int(len(X) * 0.8)
    X_train, X_val = X.iloc[:split], X.iloc[split:]
    y_train, y_val = y.iloc[:split], y.iloc[split:]
    
    train_data = lgb.Dataset(X_train, label=y_train)
    val_data = lgb.Dataset(X_val, label=y_val)
    
    model = lgb.train(
        params,
        train_data,
        valid_sets=[val_data],
        num_boost_round=1000,
        callbacks=[lgb.early_stopping(stopping_rounds=50)]
    )
    
    # Save Model
    model_path = MODEL_DIR / f"{MODEL_VERSION}.txt"
    model.save_model(str(model_path))
    
    # Metrics
    preds = model.predict(X_val)
    rmse = mean_squared_error(y_val, preds, squared=False)
    mae = mean_absolute_error(y_val, preds)
    
    # Export Metadata
    metadata = {
        "model_version": MODEL_VERSION,
        "trained_at": datetime.utcnow().isoformat(),
        "rmse": float(rmse),
        "mae": float(mae),
        "features": list(X.columns),
        "n_samples": len(X)
    }
    
    with open(REPORT_DIR / f"{MODEL_VERSION}_meta.json", "w") as f:
        json.dump(metadata, f, indent=2)
        
    print(f"✅ Trained {MODEL_VERSION}. RMSE: {rmse:.2f}ms")
    return model, metadata

if __name__ == "__main__":
    # Mock data for demonstration
    data = []
    for _ in range(200):
        data.append({
            "avg_long_run_pace_ms": 90000 + np.random.normal(0, 1000),
            "tyre_deg_rate": 0.03 + np.random.normal(0, 0.01),
            "sector_consistency": 150 + np.random.normal(0, 20),
            "clean_air_delta": np.random.normal(0, 50),
            "grid_position": np.random.randint(1, 21),
            "target": np.random.normal(0, 500) # The pace delta to predict
        })
    df = pd.DataFrame(data)
    X = df.drop(columns=["target"])
    y = df["target"]
    
    train_model(X, y)
