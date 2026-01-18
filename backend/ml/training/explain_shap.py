import shap
import lightgbm as lgb
import pandas as pd
import numpy as np
import json
from pathlib import Path

# Paths follow the user's recommended structure
ARTIFACT_DIR = Path("ml/artifacts")
SHAP_DIR = ARTIFACT_DIR / "shap"
SHAP_DIR.mkdir(exist_ok=True, parents=True)

def compute_shap_summary(model_path: str, X_sample: pd.DataFrame, model_version: str):
    """
    Computes and saves SHAP global importance for a model version.
    """
    model = lgb.Booster(model_file=model_path)
    
    # Use TreeExplainer for LightGBM
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_sample)
    
    # Calculate mean absolute SHAP values for global importance
    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    
    shap_summary = []
    for feature, importance in zip(X_sample.columns, mean_abs_shap):
        shap_summary.append({
            "feature": feature,
            "importance": float(importance)
        })
        
    # Sort by importance
    shap_summary.sort(key=lambda x: x["importance"], reverse=True)
    
    # Save as artifact
    output_path = SHAP_DIR / f"{model_version}_shap.json"
    with open(output_path, "w") as f:
        json.dump(shap_summary, f, indent=2)
        
    print(f"✅ Saved SHAP summary to {output_path}")
    return shap_summary

if __name__ == "__main__":
    # Example usage with mock data
    model_version = "lgbm_v20240117_000000" # Placeholder
    # Assuming a model was just trained and saved
    model_file = f"ml/artifacts/models/{model_version}.txt"
    
    if os.path.exists(model_file):
        X_mock = pd.DataFrame({
            "avg_long_run_pace_ms": [90000, 91000],
            "tyre_deg_rate": [0.03, 0.04],
            "sector_consistency": [150, 160],
            "clean_air_delta": [0, -10],
            "grid_position": [1, 5]
        })
        compute_shap_summary(model_file, X_mock, model_version)
