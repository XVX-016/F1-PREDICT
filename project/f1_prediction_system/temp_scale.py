#!/usr/bin/env python3
"""F1 Prediction Model: Global Temperature Scaling Calibration"""
import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.metrics import brier_score_loss, log_loss
from sklearn.linear_model import LogisticRegression
import json

# File paths
IN_CSV = "enhanced_monte_carlo_results.csv"
OUT_TEMP = "enhanced_monte_carlo_results_temp_scaled.csv"
TEMP_MODEL = "calibration_models/temperature_scaling.joblib"
TEMP_METRICS = "calibration_models/temp_scaling_metrics.json"

def load_and_prepare_data():
    """Load data and prepare for temperature scaling"""
    print("Loading data for temperature scaling...")
    df = pd.read_csv(IN_CSV)
    
    # Ensure we have the required columns
    required_cols = ['win_prob', 'actual']
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        print(f"Missing required columns: {missing_cols}")
        print("Available columns:", df.columns.tolist())
        return None
    
    print(f"Loaded {len(df)} predictions")
    return df

def fit_temperature_scaling(df):
    """Fit global temperature scaling using Logistic Regression"""
    print("Fitting global temperature scaling...")
    
    # Prepare features (logits of probabilities)
    # Add small epsilon to avoid log(0) or log(1)
    eps = 1e-10
    probs = np.clip(df['win_prob'].values, eps, 1 - eps)
    
    # Convert to logits
    logits = np.log(probs / (1 - probs))
    logits = logits.reshape(-1, 1)
    
    # Prepare target (actual outcomes)
    y = df['actual'].values
    
    # Fit logistic regression for temperature scaling
    # This learns the optimal temperature parameter
    temp_model = LogisticRegression(penalty=None, solver='lbfgs')
    temp_model.fit(logits, y)
    
    # Extract temperature parameter
    # Temperature = 1 / coefficient
    temperature = 1.0 / temp_model.coef_[0][0]
    
    print(f"Optimal temperature: {temperature:.4f}")
    
    return temp_model, temperature

def apply_temperature_scaling(df, temp_model):
    """Apply temperature scaling to probabilities"""
    print("Applying temperature scaling...")
    
    # Get original probabilities
    probs = df['win_prob'].values
    
    # Convert to logits
    eps = 1e-10
    probs_clipped = np.clip(probs, eps, 1 - eps)
    logits = np.log(probs_clipped / (1 - probs_clipped))
    
    # Apply temperature scaling using the fitted model
    logits_scaled = temp_model.predict_proba(logits.reshape(-1, 1))[:, 1]
    
    # Convert back to probabilities
    probs_scaled = 1 / (1 + np.exp(-logits_scaled))
    
    # Add scaled probabilities to dataframe
    df_temp = df.copy()
    df_temp['win_prob_temp_scaled'] = probs_scaled
    
    # Renormalize to ensure probabilities sum to 1 per race
    race_groups = df_temp.groupby('race')
    df_temp['win_prob_temp_scaled'] = race_groups['win_prob_temp_scaled'].transform(
        lambda x: x / x.sum()
    )
    
    return df_temp

def calculate_metrics(df_orig, df_temp):
    """Calculate improvement metrics"""
    print("Calculating improvement metrics...")
    
    # Before temperature scaling
    brier_before = brier_score_loss(df_orig['actual'], df_orig['win_prob'])
    logloss_before = log_loss(df_orig['actual'], df_orig['win_prob'])
    
    # After temperature scaling
    brier_after = brier_score_loss(df_temp['actual'], df_temp['win_prob_temp_scaled'])
    logloss_after = log_loss(df_temp['actual'], df_temp['win_prob_temp_scaled'])
    
    # Calculate improvements
    brier_improvement = (brier_before - brier_after) / brier_before * 100
    logloss_improvement = (logloss_before - logloss_after) / logloss_before * 100
    
    metrics = {
        'temperature_scaling': {
            'brier_score': {
                'before': brier_before,
                'after': brier_after,
                'improvement_pct': brier_improvement
            },
            'log_loss': {
                'before': logloss_before,
                'after': logloss_after,
                'improvement_pct': logloss_improvement
            }
        }
    }
    
    print(f"Temperature Scaling Results:")
    print(f"  Brier Score: {brier_before:.6f} → {brier_after:.6f} ({brier_improvement:+.1f}%)")
    print(f"  Log Loss: {logloss_before:.6f} → {logloss_after:.6f} ({logloss_improvement:+.1f}%)")
    
    return metrics

def save_results(df_temp, temp_model, metrics):
    """Save temperature-scaled results and model"""
    print("Saving temperature scaling results...")
    
    # Save temperature-scaled data
    df_temp.to_csv(OUT_TEMP, index=False)
    print(f"Saved temperature-scaled data to: {OUT_TEMP}")
    
    # Save temperature scaling model
    Path("calibration_models").mkdir(exist_ok=True)
    joblib.dump(temp_model, TEMP_MODEL)
    print(f"Saved temperature scaling model to: {TEMP_MODEL}")
    
    # Save metrics
    with open(TEMP_METRICS, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"Saved metrics to: {TEMP_METRICS}")

def main():
    """Main temperature scaling pipeline"""
    print("F1 Prediction Model: Global Temperature Scaling")
    print("=" * 60)
    
    # Load data
    df = load_and_prepare_data()
    if df is None:
        print("Failed to load data. Exiting.")
        return
    
    # Fit temperature scaling
    temp_model, temperature = fit_temperature_scaling(df)
    
    # Apply temperature scaling
    df_temp = apply_temperature_scaling(df, temp_model)
    
    # Calculate improvements
    metrics = calculate_metrics(df, df_temp)
    
    # Save results
    save_results(df_temp, temp_model, metrics)
    
    print("\nTemperature scaling completed successfully!")
    print(f"Temperature parameter: {temperature:.4f}")
    print(f"Results saved to: {OUT_TEMP}")

if __name__ == "__main__":
    main()
