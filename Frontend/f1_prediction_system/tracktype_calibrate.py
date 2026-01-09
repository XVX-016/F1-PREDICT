#!/usr/bin/env python3
"""F1 Prediction Model: Track-Type Specific Isotonic Calibration"""
import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.metrics import brier_score_loss, log_loss
from sklearn.isotonic import IsotonicRegression
from sklearn.linear_model import LogisticRegression
import json

# File paths
IN_CSV = "enhanced_monte_carlo_results_ewma_calibrated.csv"  # Use EWMA-calibrated data
OUT_TRACKTYPE = "enhanced_monte_carlo_results_tracktype_calibrated.csv"
TRACKTYPE_MODELS_DIR = "calibration_models/tracktype_calibration"
TRACKTYPE_METRICS = "calibration_models/tracktype_calibration_metrics.json"

# Track type definitions
TRACK_TYPES = {
    'street': ['Monaco', 'Baku', 'Singapore', 'Miami', 'Las Vegas', 'Jeddah'],
    'permanent': ['Silverstone', 'Spa', 'Monza', 'Suzuka', 'Interlagos', 'Red Bull Ring'],
    'hybrid': ['Melbourne', 'Montreal', 'Hungaroring', 'Zandvoort', 'Austin', 'Abu Dhabi']
}

def load_and_prepare_data():
    """Load EWMA-calibrated data and prepare for track-type calibration"""
    print("Loading EWMA-calibrated data for track-type calibration...")
    
    try:
        df = pd.read_csv(IN_CSV)
    except FileNotFoundError:
        print(f"{IN_CSV} not found. Please run EWMA calibration first.")
        return None
    
    # Ensure we have the required columns
    required_cols = ['win_prob_ewma_team', 'actual', 'race']
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        print(f"Missing required columns: {missing_cols}")
        print("Available columns:", df.columns.tolist())
        return None
    
    print(f"Loaded {len(df)} EWMA-calibrated predictions")
    return df

def classify_track_type(circuit_name):
    """Classify circuit into track type"""
    circuit_lower = circuit_name.lower()
    
    for track_type, circuits in TRACK_TYPES.items():
        for circuit in circuits:
            if circuit.lower() in circuit_lower:
                return track_type
    
    # Default classification based on circuit characteristics
    if any(keyword in circuit_lower for keyword in ['street', 'monaco', 'baku', 'singapore']):
        return 'street'
    elif any(keyword in circuit_lower for keyword in ['park', 'circuit', 'ring', 'speedway']):
        return 'permanent'
    else:
        return 'hybrid'

def add_track_type_column(df):
    """Add track type column to dataframe"""
    print("Adding track type classification...")
    
    df_track = df.copy()
    df_track['track_type'] = df_track['race'].apply(classify_track_type)
    
    # Print track type distribution
    track_counts = df_track['track_type'].value_counts()
    print("Track type distribution:")
    for track_type, count in track_counts.items():
        print(f"  {track_type}: {count} races")
    
    return df_track

def fit_tracktype_calibration(df_track, track_type):
    """Fit track-type specific calibration"""
    print(f"\n🔧 Fitting {track_type} track type calibration...")
    
    # Get data for this track type
    track_data = df_track[df_track['track_type'] == track_type].copy()
    
    if len(track_data) < 10:  # Need minimum data points
        print(f"⚠️  Insufficient data for {track_type} tracks ({len(track_data)} samples)")
        return None, "insufficient_data"
    
    # Prepare features and targets
    X = track_data['win_prob_ewma_team'].values.reshape(-1, 1)
    y = track_data['actual'].values
    
    # Try Isotonic Regression first (more flexible for track-specific patterns)
    try:
        iso_model = IsotonicRegression(out_of_bounds='clip')
        iso_model.fit(X.flatten(), y)
        
        # Evaluate isotonic model
        y_pred_iso = iso_model.predict(X.flatten())
        brier_iso = brier_score_loss(y, y_pred_iso)
        logloss_iso = log_loss(y, y_pred_iso)
        
        # Try Platt scaling (logistic regression)
        platt_model = LogisticRegression(penalty=None, solver='lbfgs')
        platt_model.fit(X, y)
        
        y_pred_platt = platt_model.predict_proba(X)[:, 1]
        brier_platt = brier_score_loss(y, y_pred_platt)
        logloss_platt = log_loss(y, y_pred_platt)
        
        # Choose better model
        if brier_iso < brier_platt:
            model = iso_model
            method = "isotonic"
            metrics = {"brier": brier_iso, "logloss": logloss_iso}
        else:
            model = platt_model
            method = "platt"
            metrics = {"brier": brier_platt, "logloss": logloss_platt}
        
        print(f"✅ {track_type} tracks - {method} (Brier: {metrics['brier']:.6f})")
        return model, method
        
    except Exception as e:
        print(f"❌ Error fitting {track_type} tracks - {str(e)}")
        return None, "error"

def apply_tracktype_calibration(df_track, tracktype_models):
    """Apply track-type specific calibration to probabilities"""
    print("Applying track-type calibration...")
    
    df_cal = df_track.copy()
    df_cal['win_prob_tracktype_calibrated'] = df_cal['win_prob_ewma_team'].copy()
    
    for track_type, (model, method) in tracktype_models.items():
        if model is None:
            continue
            
        # Get indices for this track type
        track_mask = df_cal['track_type'] == track_type
        
        if method == "isotonic":
            # Isotonic regression
            probs = df_cal.loc[track_mask, 'win_prob_ewma_team'].values
            probs_cal = model.predict(probs)
            df_cal.loc[track_mask, 'win_prob_tracktype_calibrated'] = probs_cal
        else:
            # Platt scaling
            probs = df_cal.loc[track_mask, 'win_prob_ewma_team'].values.reshape(-1, 1)
            probs_cal = model.predict_proba(probs)[:, 1]
            df_cal.loc[track_mask, 'win_prob_tracktype_calibrated'] = probs_cal
    
    # Renormalize to ensure probabilities sum to 1 per race
    race_groups = df_cal.groupby('race')
    df_cal['win_prob_tracktype_calibrated'] = race_groups['win_prob_tracktype_calibrated'].transform(
        lambda x: x / x.sum()
    )
    
    return df_cal

def calibrate_all_track_types(df_track):
    """Fit calibration for all track types"""
    print("\n🔧 Fitting track-type specific calibration...")
    
    tracktype_models = {}
    tracktype_methods = {}
    
    for track_type in TRACK_TYPES.keys():
        model, method = fit_tracktype_calibration(df_track, track_type)
        tracktype_models[track_type] = (model, method)
        tracktype_methods[track_type] = method
    
    return tracktype_models, tracktype_methods

def calculate_tracktype_metrics(df_orig, df_tracktype):
    """Calculate track-type specific improvement metrics"""
    print("\n📊 Calculating track-type calibration metrics...")
    
    # Before track-type calibration (after EWMA calibration)
    brier_before = brier_score_loss(df_orig['actual'], df_orig['win_prob_ewma_team'])
    logloss_before = log_loss(df_orig['actual'], df_orig['win_prob_ewma_team'])
    
    # After track-type calibration
    brier_after = brier_score_loss(df_tracktype['actual'], df_tracktype['win_prob_tracktype_calibrated'])
    logloss_after = log_loss(df_tracktype['actual'], df_tracktype['win_prob_tracktype_calibrated'])
    
    # Calculate improvements
    brier_improvement = (brier_before - brier_after) / brier_before * 100
    logloss_improvement = (logloss_before - logloss_after) / logloss_before * 100
    
    # Track-type specific metrics
    tracktype_metrics = {}
    for track_type in TRACK_TYPES.keys():
        track_mask = df_tracktype['track_type'] == track_type
        if track_mask.sum() > 0:
            track_brier_before = brier_score_loss(
                df_orig.loc[track_mask, 'actual'], 
                df_orig.loc[track_mask, 'win_prob_ewma_team']
            )
            track_brier_after = brier_score_loss(
                df_tracktype.loc[track_mask, 'actual'], 
                df_tracktype.loc[track_mask, 'win_prob_tracktype_calibrated']
            )
            track_improvement = (track_brier_before - track_brier_after) / track_brier_before * 100
            
            tracktype_metrics[track_type] = {
                'brier_before': float(track_brier_before),
                'brier_after': float(track_brier_after),
                'improvement_pct': float(track_improvement),
                'race_count': int(track_mask.sum())
            }
    
    metrics = {
        'tracktype_calibration': {
            'overall': {
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
            },
            'by_track_type': tracktype_metrics
        }
    }
    
    print(f"Track-Type Calibration Results:")
    print(f"  Overall:")
    print(f"    Brier: {brier_before:.6f} → {brier_after:.6f} ({brier_improvement:+.1f}%)")
    print(f"    LogLoss: {logloss_before:.6f} → {logloss_after:.6f} ({logloss_improvement:+.1f}%)")
    
    print(f"  By Track Type:")
    for track_type, track_metrics in tracktype_metrics.items():
        print(f"    {track_type.title()}: {track_metrics['brier_before']:.6f} → {track_metrics['brier_after']:.6f} ({track_metrics['improvement_pct']:+.1f}%) [{track_metrics['race_count']} races]")
    
    return metrics

def save_results(df_tracktype, tracktype_models, metrics):
    """Save track-type calibrated results and models"""
    print("\n💾 Saving track-type calibration results...")
    
    # Save track-type calibrated data
    df_tracktype.to_csv(OUT_TRACKTYPE, index=False)
    print(f"Saved track-type calibrated data to: {OUT_TRACKTYPE}")
    
    # Save calibration models
    Path(TRACKTYPE_MODELS_DIR).mkdir(parents=True, exist_ok=True)
    
    # Save track-type models
    for track_type, (model, method) in tracktype_models.items():
        if model is not None:
            model_path = f"{TRACKTYPE_MODELS_DIR}/{track_type}_{method}.joblib"
            joblib.dump(model, model_path)
            print(f"Saved {track_type} model: {model_path}")
    
    # Save metrics
    with open(TRACKTYPE_METRICS, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"Saved metrics to: {TRACKTYPE_METRICS}")

def main():
    """Main track-type calibration pipeline"""
    print("🚀 F1 Prediction Model: Track-Type Specific Calibration")
    print("=" * 60)
    
    # Load data
    df = load_and_prepare_data()
    if df is None:
        print("❌ Failed to load data. Exiting.")
        return
    
    # Add track type classification
    df_track = add_track_type_column(df)
    
    # Fit track-type calibration
    tracktype_models, tracktype_methods = calibrate_all_track_types(df_track)
    
    # Apply track-type calibration
    df_tracktype = apply_tracktype_calibration(df_track, tracktype_models)
    
    # Calculate metrics
    metrics = calculate_tracktype_metrics(df_track, df_tracktype)
    
    # Save results
    save_results(df_tracktype, tracktype_models, metrics)
    
    print("\n✅ Track-type specific calibration completed successfully!")
    print(f"💾 Results saved to: {OUT_TRACKTYPE}")

if __name__ == "__main__":
    main()
