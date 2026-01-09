#!/usr/bin/env python3
"""F1 Prediction Model: EWMA-Weighted Per-Group Isotonic Calibration"""
import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.metrics import brier_score_loss, log_loss
from sklearn.isotonic import IsotonicRegression
from sklearn.linear_model import LogisticRegression
import json

# File paths
IN_CSV = "enhanced_monte_carlo_results_temp_scaled.csv"  # Use temp-scaled data
OUT_EWMA = "enhanced_monte_carlo_results_ewma_calibrated.csv"
EWMA_MODELS_DIR = "calibration_models/ewma_calibration"
EWMA_METRICS = "calibration_models/ewma_calibration_metrics.json"

def load_and_prepare_data():
    """Load temperature-scaled data and prepare for EWMA calibration"""
    print("Loading temperature-scaled data for EWMA calibration...")
    
    try:
        df = pd.read_csv(IN_CSV)
    except FileNotFoundError:
        print(f"{IN_CSV} not found. Please run temperature scaling first.")
        return None
    
    # Ensure we have the required columns
    required_cols = ['win_prob_temp_scaled', 'actual', 'driver', 'team', 'race']
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        print(f"Missing required columns: {missing_cols}")
        print("Available columns:", df.columns.tolist())
        return None
    
    print(f"Loaded {len(df)} temperature-scaled predictions")
    return df

def get_driver_team_mapping():
    """Get mapping of drivers to teams for 2025 season"""
    return {
        'Max Verstappen': 'Red Bull Racing',
        'Yuki Tsunoda': 'Red Bull Racing',

        'Charles Leclerc': 'Ferrari',
        'Lewis Hamilton': 'Ferrari',

        'George Russell': 'Mercedes',
        'Andrea Kimi Antonelli': 'Mercedes',

        'Lando Norris': 'McLaren',
        'Oscar Piastri': 'McLaren',

        'Fernando Alonso': 'Aston Martin',
        'Lance Stroll': 'Aston Martin',

        'Pierre Gasly': 'Alpine',
        'Franco Colapinto': 'Alpine',

        'Esteban Ocon': 'Haas',
        'Oliver Bearman': 'Haas',

        'Liam Lawson': 'Racing Bulls',
        'Isack Hadjar': 'Racing Bulls',

        'Alexander Albon': 'Williams',
        'Carlos Sainz': 'Williams',

        'Nico Hulkenberg': 'Kick Sauber',
        'Gabriel Bortoleto': 'Kick Sauber'
    }


def calculate_ewma_weights(df, alpha=0.3):
    """Calculate EWMA weights for recent races"""
    print(f"Calculating EWMA weights with alpha={alpha}...")
    
    # Sort by race to ensure chronological order
    df_sorted = df.sort_values('race').copy()
    
    # Calculate EWMA weights
    # More recent races get higher weights
    races = df_sorted['race'].unique()
    n_races = len(races)
    
    # Create weight mapping: recent races get higher weights
    weights = {}
    for i, race in enumerate(races):
        # Exponential decay: recent races get higher weights
        weight = alpha * (1 - alpha) ** (n_races - 1 - i)
        weights[race] = weight
    
    # Normalize weights to sum to 1
    total_weight = sum(weights.values())
    weights = {k: v / total_weight for k, v in weights.items()}
    
    # Add weights to dataframe
    df_sorted['ewma_weight'] = df_sorted['race'].map(weights)
    
    print(f"EWMA weights calculated for {n_races} races")
    print(f"Weight range: {min(weights.values()):.4f} - {max(weights.values()):.4f}")
    
    return df_sorted

def fit_ewma_calibration(df_weighted, group_col, group_name):
    """Fit EWMA-weighted calibration for a specific group"""
    
    # Get data for this group
    group_data = df_weighted[df_weighted[group_col] == group_name].copy()
    
    if len(group_data) < 5:  # Need minimum data points
        print(f"⚠️  Insufficient data for {group_col}: {group_name} ({len(group_data)} samples)")
        return None, "insufficient_data"
    
    # Prepare features and targets with weights
    X = group_data['win_prob_temp_scaled'].values.reshape(-1, 1)
    y = group_data['actual'].values
    weights = group_data['ewma_weight'].values
    
    # Try Isotonic Regression first (more flexible)
    try:
        iso_model = IsotonicRegression(out_of_bounds='clip')
        iso_model.fit(X.flatten(), y, sample_weight=weights)
        
        # Evaluate isotonic model
        y_pred_iso = iso_model.predict(X.flatten())
        brier_iso = brier_score_loss(y, y_pred_iso, sample_weight=weights)
        logloss_iso = log_loss(y, y_pred_iso, sample_weight=weights)
        
        # Try Platt scaling (logistic regression)
        platt_model = LogisticRegression(penalty='none', solver='lbfgs')
        platt_model.fit(X, y, sample_weight=weights)
        
        y_pred_platt = platt_model.predict_proba(X)[:, 1]
        brier_platt = brier_score_loss(y, y_pred_platt, sample_weight=weights)
        logloss_platt = log_loss(y, y_pred_platt, sample_weight=weights)
        
        # Choose better model
        if brier_iso < brier_platt:
            model = iso_model
            method = "isotonic"
            metrics = {"brier": brier_iso, "logloss": logloss_iso}
        else:
            model = platt_model
            method = "platt"
            metrics = {"brier": brier_platt, "logloss": logloss_platt}
        
        print(f"✅ {group_col}: {group_name} - {method} (Brier: {metrics['brier']:.6f})")
        return model, method
        
    except Exception as e:
        print(f"❌ Error fitting {group_col}: {group_name} - {str(e)}")
        return None, "error"

def apply_ewma_calibration(df, calibration_models, group_col):
    """Apply EWMA-weighted calibration to probabilities"""
    print(f"Applying EWMA calibration for {group_col}...")
    
    df_cal = df.copy()
    df_cal[f'win_prob_ewma_{group_col}'] = df_cal['win_prob_temp_scaled'].copy()
    
    for group_name, (model, method) in calibration_models.items():
        if model is None:
            continue
            
        # Get indices for this group
        group_mask = df_cal[group_col] == group_name
        
        if method == "isotonic":
            # Isotonic regression
            probs = df_cal.loc[group_mask, 'win_prob_temp_scaled'].values
            probs_cal = model.predict(probs)
            df_cal.loc[group_mask, f'win_prob_ewma_{group_col}'] = probs_cal
        else:
            # Platt scaling
            probs = df_cal.loc[group_mask, 'win_prob_temp_scaled'].values.reshape(-1, 1)
            probs_cal = model.predict_proba(probs)[:, 1]
            df_cal.loc[group_mask, f'win_prob_ewma_{group_col}'] = probs_cal
    
    # Renormalize to ensure probabilities sum to 1 per race
    race_groups = df_cal.groupby('race')
    df_cal[f'win_prob_ewma_{group_col}'] = race_groups[f'win_prob_ewma_{group_col}'].transform(
        lambda x: x / x.sum()
    )
    
    return df_cal

def calibrate_drivers_ewma(df_weighted):
    """Fit EWMA-weighted calibration for each driver"""
    print("\n🔧 Fitting EWMA-weighted driver calibration...")
    
    driver_models = {}
    driver_methods = {}
    
    drivers = df_weighted['driver'].unique()
    
    for driver in drivers:
        model, method = fit_ewma_calibration(df_weighted, 'driver', driver)
        driver_models[driver] = (model, method)
        driver_methods[driver] = method
    
    return driver_models, driver_methods

def calibrate_teams_ewma(df_weighted):
    """Fit EWMA-weighted calibration for each team"""
    print("\n🔧 Fitting EWMA-weighted team calibration...")
    
    team_models = {}
    team_methods = {}
    
    teams = df_weighted['team'].unique()
    
    for team in teams:
        model, method = fit_ewma_calibration(df_weighted, 'team', team)
        team_models[team] = (model, method)
        team_methods[team] = method
    
    return team_models, team_methods

def calculate_overall_metrics(df_orig, df_ewma):
    """Calculate overall improvement metrics"""
    print("\n📊 Calculating overall EWMA calibration metrics...")
    
    # Before EWMA calibration (after temperature scaling)
    brier_before = brier_score_loss(df_orig['actual'], df_orig['win_prob_temp_scaled'])
    logloss_before = log_loss(df_orig['actual'], df_orig['win_prob_temp_scaled'])
    
    # After driver EWMA calibration
    brier_after_driver = brier_score_loss(df_ewma['actual'], df_ewma['win_prob_ewma_driver'])
    logloss_after_driver = log_loss(df_ewma['actual'], df_ewma['win_prob_ewma_driver'])
    
    # After team EWMA calibration
    brier_after_team = brier_score_loss(df_ewma['actual'], df_ewma['win_prob_ewma_team'])
    logloss_after_team = log_loss(df_ewma['actual'], df_ewma['win_prob_ewma_team'])
    
    # Calculate improvements
    driver_brier_improvement = (brier_before - brier_after_driver) / brier_before * 100
    driver_logloss_improvement = (logloss_before - logloss_after_driver) / logloss_before * 100
    
    team_brier_improvement = (brier_before - brier_after_team) / brier_before * 100
    team_logloss_improvement = (logloss_before - logloss_after_team) / logloss_before * 100
    
    metrics = {
        'ewma_calibration': {
            'driver_level': {
                'brier_score': {
                    'before': brier_before,
                    'after': brier_after_driver,
                    'improvement_pct': driver_brier_improvement
                },
                'log_loss': {
                    'before': logloss_before,
                    'after': logloss_after_driver,
                    'improvement_pct': driver_logloss_improvement
                }
            },
            'team_level': {
                'brier_score': {
                    'before': brier_before,
                    'after': brier_after_team,
                    'improvement_pct': team_brier_improvement
                },
                'log_loss': {
                    'before': logloss_before,
                    'after': logloss_after_team,
                    'improvement_pct': team_logloss_improvement
                }
            }
        }
    }
    
    print(f"EWMA Calibration Results:")
    print(f"  Driver Level:")
    print(f"    Brier: {brier_before:.6f} → {brier_after_driver:.6f} ({driver_brier_improvement:+.1f}%)")
    print(f"    LogLoss: {logloss_before:.6f} → {logloss_after_driver:.6f} ({driver_logloss_improvement:+.1f}%)")
    print(f"  Team Level:")
    print(f"    Brier: {brier_before:.6f} → {brier_after_team:.6f} ({team_brier_improvement:+.1f}%)")
    print(f"    LogLoss: {logloss_before:.6f} → {logloss_after_team:.6f} ({team_logloss_improvement:+.1f}%)")
    
    return metrics

def save_results(df_ewma, driver_models, team_models, metrics):
    """Save EWMA-calibrated results and models"""
    print("\n💾 Saving EWMA calibration results...")
    
    # Save EWMA-calibrated data
    df_ewma.to_csv(OUT_EWMA, index=False)
    print(f"Saved EWMA-calibrated data to: {OUT_EWMA}")
    
    # Save calibration models
    Path(EWMA_MODELS_DIR).mkdir(parents=True, exist_ok=True)
    
    # Save driver models
    for driver, (model, method) in driver_models.items():
        if model is not None:
            safe_name = driver.replace(' ', '_').lower()
            model_path = f"{EWMA_MODELS_DIR}/driver_{safe_name}_{method}.joblib"
            joblib.dump(model, model_path)
            print(f"Saved driver model: {model_path}")
    
    # Save team models
    for team, (model, method) in team_models.items():
        if model is not None:
            safe_name = team.replace(' ', '_').lower()
            model_path = f"{EWMA_MODELS_DIR}/team_{safe_name}_{method}.joblib"
            joblib.dump(model, model_path)
            print(f"Saved team model: {model_path}")
    
    # Save metrics
    with open(EWMA_METRICS, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"Saved metrics to: {EWMA_METRICS}")

def main():
    """Main EWMA calibration pipeline"""
    print("🚀 F1 Prediction Model: EWMA-Weighted Per-Group Calibration")
    print("=" * 70)
    
    # Load data
    df = load_and_prepare_data()
    if df is None:
        print("❌ Failed to load data. Exiting.")
        return
    
    # Calculate EWMA weights
    df_weighted = calculate_ewma_weights(df, alpha=0.3)
    
    # Fit driver calibration
    driver_models, driver_methods = calibrate_drivers_ewma(df_weighted)
    
    # Apply driver calibration
    df_driver_cal = apply_ewma_calibration(df_weighted, driver_models, 'driver')
    
    # Fit team calibration
    team_models, team_methods = calibrate_teams_ewma(df_weighted)
    
    # Apply team calibration
    df_team_cal = apply_ewma_calibration(df_driver_cal, team_models, 'team')
    
    # Calculate overall metrics
    metrics = calculate_overall_metrics(df_weighted, df_team_cal)
    
    # Save results
    save_results(df_team_cal, driver_models, team_models, metrics)
    
    print("\n✅ EWMA-weighted calibration completed successfully!")
    print(f"💾 Results saved to: {OUT_EWMA}")

if __name__ == "__main__":
    main()
