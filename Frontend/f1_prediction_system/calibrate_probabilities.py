#!/usr/bin/env python3
"""
F1 Prediction Model: Probability Calibration Module
Fits per-driver and per-team calibration (Isotonic vs Platt), applies the best,
and writes calibrated outputs + CSV summaries.
"""

import os
import json
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.metrics import brier_score_loss, log_loss
from sklearn.isotonic import IsotonicRegression
from sklearn.linear_model import LogisticRegression
import joblib

# File paths
IN_CSV = "enhanced_monte_carlo_results.csv"
OUT_CAL = "enhanced_monte_carlo_results_calibrated.csv"
OUT_DIR = "calibration_models"
SUM_DRIVER = "driver_calibration_analysis.csv"
SUM_TEAM = "team_calibration_analysis.csv"

# Create output directory
Path(OUT_DIR).mkdir(parents=True, exist_ok=True)

def load_and_prepare_data():
    """Load and prepare data for calibration"""
    print("📊 Loading data for calibration...")
    
    try:
        df = pd.read_csv(IN_CSV)
        print(f"  ✓ Loaded {len(df)} predictions from {IN_CSV}")
    except FileNotFoundError:
        print(f"  ❌ {IN_CSV} not found")
        return None
    
    # Expected columns (rename if needed)
    col_map = {
        "predicted_win_prob": "win_prob",
        "win_probability": "win_prob",
        "driver_name": "driver",
        "constructor": "team",
        "winner": "actual",  # 1 if won, else 0
    }
    
    for k, v in col_map.items():
        if k in df.columns and v not in df.columns:
            df.rename(columns={k: v}, inplace=True)
            print(f"  ✓ Renamed {k} → {v}")
    
    # Check required columns
    required = ["driver", "team", "win_prob"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        print(f"  ❌ Missing required columns: {missing}")
        return None
    
    # Create synthetic actual results for demonstration
    # In real usage, this would come from actual race results
    np.random.seed(42)  # For reproducible demo
    df['actual'] = np.random.choice([0, 1], size=len(df), p=[0.95, 0.05])
    
    # Add team information if missing
    if 'team' not in df.columns:
        df['team'] = df['driver'].map(get_driver_team_mapping())
    
    # Guard rails
    df = df.dropna(subset=["win_prob", "actual", "driver", "team"])
    df["win_prob"] = df["win_prob"].clip(1e-6, 1-1e-6)
    df["actual"] = df["actual"].astype(int).clip(0, 1)
    
    print(f"  ✓ Prepared {len(df)} samples for calibration")
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


def fit_one(group_name, x, y):
    """Fit both calibrators, pick best by Brier (+ tie-break LogLoss)."""
    print(f"    Fitting calibration for {group_name} ({len(x)} samples)")
    
    # Isotonic
    try:
        iso = IsotonicRegression(out_of_bounds="clip").fit(x, y)
        p_iso = iso.predict(x)
        b_iso = brier_score_loss(y, p_iso)
        l_iso = log_loss(y, p_iso)
    except Exception as e:
        print(f"      ⚠️  Isotonic failed: {e}")
        b_iso, l_iso = np.inf, np.inf
        iso = None

    # Platt
    try:
        lr = LogisticRegression(max_iter=200, solver="lbfgs")
        lr.fit(x.reshape(-1, 1), y)
        p_lr = lr.predict_proba(x.reshape(-1, 1))[:, 1]
        b_lr = brier_score_loss(y, p_lr)
        l_lr = log_loss(y, p_lr)
    except Exception as e:
        print(f"      ⚠️  Platt failed: {e}")
        b_lr, l_lr = np.inf, np.inf
        lr = None

    # Pick best method
    if (b_iso < b_lr) or (np.isclose(b_iso, b_lr) and l_iso <= l_lr):
        if iso is not None:
            best = {"method": "isotonic", "brier": b_iso, "logloss": l_iso}
            model = iso
        else:
            best = {"method": "identity", "brier": np.nan, "logloss": np.nan}
            model = None
    else:
        if lr is not None:
            best = {"method": "platt", "brier": b_lr, "logloss": l_lr}
            model = lr
        else:
            best = {"method": "identity", "brier": np.nan, "logloss": np.nan}
            model = None

    allm = {
        "iso": {"brier": b_iso, "logloss": l_iso},
        "platt": {"brier": b_lr, "logloss": l_lr}
    }
    
    return model, best, allm

def apply_model(model, method, x):
    """Apply calibration model to probabilities"""
    if method == "isotonic":
        return model.predict(x)
    elif method == "platt":
        return model.predict_proba(x.reshape(-1, 1))[:, 1]
    else:
        return x  # identity

def calibrate_drivers(df):
    """Fit per-driver calibration models"""
    print("\n🏎️  Fitting per-driver calibration models...")
    
    driver_rows = []
    driver_models = {}
    
    for drv, sub in df.groupby("driver", sort=False):
        print(f"  📊 {drv}")
        x = sub["win_prob"].values
        y = sub["actual"].values
        
        if len(np.unique(y)) < 2:
            # Not enough signal: fall back to identity
            driver_rows.append({
                "driver": drv, "method": "identity", "brier": np.nan, "logloss": np.nan,
                "brier_iso": np.nan, "logloss_iso": np.nan,
                "brier_platt": np.nan, "logloss_platt": np.nan
            })
            driver_models[drv] = ("identity", None)
            continue
            
        model, best, allm = fit_one(drv, x, y)
        
        driver_rows.append({
            "driver": drv, **best,
            "brier_iso": allm["iso"]["brier"],
            "logloss_iso": allm["iso"]["logloss"],
            "brier_platt": allm["platt"]["brier"],
            "logloss_platt": allm["platt"]["logloss"]
        })
        
        if model is not None:
            model_path = f"{OUT_DIR}/driver_{drv.replace(' ', '_')}.joblib"
            joblib.dump(model, model_path)
            driver_models[drv] = (best["method"], model_path)
        else:
            driver_models[drv] = ("identity", None)
    
    # Save driver summary
    driver_summary = pd.DataFrame(driver_rows).sort_values(["method", "brier"], na_position="last")
    driver_summary.to_csv(SUM_DRIVER, index=False)
    print(f"  💾 Driver summary saved to {SUM_DRIVER}")
    
    return driver_models

def calibrate_teams(df):
    """Fit per-team calibration models"""
    print("\n🏁 Fitting per-team calibration models...")
    
    team_rows = []
    team_models = {}
    
    for tm, sub in df.groupby("team", sort=False):
        print(f"  📊 {tm}")
        x = sub["win_prob"].values
        y = sub["actual"].values
        
        if len(np.unique(y)) < 2:
            # Not enough signal: fall back to identity
            team_rows.append({
                "team": tm, "method": "identity", "brier": np.nan, "logloss": np.nan,
                "brier_iso": np.nan, "logloss_iso": np.nan,
                "brier_platt": np.nan, "logloss_platt": np.nan
            })
            team_models[tm] = ("identity", None)
            continue
            
        model, best, allm = fit_one(tm, x, y)
        
        team_rows.append({
            "team": tm, **best,
            "brier_iso": allm["iso"]["brier"],
            "logloss_iso": allm["iso"]["logloss"],
            "brier_platt": allm["platt"]["brier"],
            "logloss_platt": allm["platt"]["logloss"]
        })
        
        if model is not None:
            model_path = f"{OUT_DIR}/team_{tm.replace(' ', '_')}.joblib"
            joblib.dump(model, model_path)
            team_models[tm] = (best["method"], model_path)
        else:
            team_models[tm] = ("identity", None)
    
    # Save team summary
    team_summary = pd.DataFrame(team_rows).sort_values(["method", "brier"], na_position="last")
    team_summary.to_csv(SUM_TEAM, index=False)
    print(f"  💾 Team summary saved to {SUM_TEAM}")
    
    return team_models

def apply_calibration(df, driver_models, team_models):
    """Apply driver then team calibration (driver first, then team)"""
    print("\n🔄 Applying calibration...")
    
    calibrated = df.copy()
    
    # Step 1: Apply driver calibration
    print("  📊 Applying driver-level calibration...")
    drv_cal = np.empty(len(calibrated))
    for i, (p, drv) in enumerate(zip(calibrated["win_prob"].values, calibrated["driver"].values)):
        method, path = driver_models.get(drv, ("identity", None))
        if method == "identity" or path is None:
            drv_cal[i] = p
        else:
            try:
                model = joblib.load(path)
                drv_cal[i] = apply_model(model, method, np.array([p]))
            except Exception as e:
                print(f"    ⚠️  Driver calibration failed for {drv}: {e}")
                drv_cal[i] = p
    
    # Step 2: Apply team calibration to driver-calibrated probabilities
    print("  🏁 Applying team-level calibration...")
    team_cal = np.empty(len(calibrated))
    for i, (p, tm) in enumerate(zip(drv_cal, calibrated["team"].values)):
        method, path = team_models.get(tm, ("identity", None))
        if method == "identity" or path is None:
            team_cal[i] = p
        else:
            try:
                model = joblib.load(path)
                team_cal[i] = apply_model(model, method, np.array([p]))
            except Exception as e:
                print(f"    ⚠️  Team calibration failed for {tm}: {e}")
                team_cal[i] = p
    
    # Store calibrated probabilities
    calibrated["win_prob_calibrated"] = team_cal.clip(1e-6, 1-1e-6)
    
    # Save calibrated results
    calibrated.to_csv(OUT_CAL, index=False)
    print(f"  💾 Calibrated results saved to {OUT_CAL}")
    
    return calibrated

def calculate_overall_metrics(calibrated):
    """Calculate overall pre vs post calibration metrics"""
    print("\n📈 Calculating overall metrics...")
    
    def metrics(y, p):
        return {
            "brier": brier_score_loss(y, p),
            "logloss": log_loss(y, p),
            "mean_pred": p.mean(),
            "mean_actual": y.mean(),
            "bias": p.mean() - y.mean()
        }
    
    pre = metrics(calibrated["actual"].values, calibrated["win_prob"].values)
    post = metrics(calibrated["actual"].values, calibrated["win_prob_calibrated"].values)
    
    # Calculate improvement
    improvement = {
        "brier_improvement": pre["brier"] - post["brier"],
        "logloss_improvement": pre["logloss"] - post["logloss"],
        "bias_improvement": abs(pre["bias"]) - abs(post["bias"])
    }
    
    overall_metrics = {
        "pre": pre,
        "post": post,
        "improvement": improvement
    }
    
    # Save metrics
    metrics_path = f"{OUT_DIR}/overall_metrics.json"
    with open(metrics_path, "w") as f:
        json.dump(overall_metrics, f, indent=2)
    
    print(f"  💾 Overall metrics saved to {metrics_path}")
    
    # Print summary
    print(f"\n📊 Calibration Summary:")
    print(f"  Brier Score: {pre['brier']:.4f} → {post['brier']:.4f} (Δ: {improvement['brier_improvement']:+.4f})")
    print(f"  Log Loss: {pre['logloss']:.4f} → {post['logloss']:.4f} (Δ: {improvement['logloss_improvement']:+.4f})")
    print(f"  Bias: {pre['bias']:+.4f} → {post['bias']:+.4f} (Δ: {improvement['bias_improvement']:+.4f})")
    
    return overall_metrics

def main():
    """Main calibration pipeline"""
    print("🏎️  F1 Prediction Model: Probability Calibration Pipeline")
    print("=" * 70)
    
    # Load and prepare data
    df = load_and_prepare_data()
    if df is None:
        return
    
    print(f"\n📊 Data Summary:")
    print(f"  Total predictions: {len(df)}")
    print(f"  Drivers: {df['driver'].nunique()}")
    print(f"  Teams: {df['team'].nunique()}")
    
    # Fit calibration models
    driver_models = calibrate_drivers(df)
    team_models = calibrate_teams(df)
    
    # Apply calibration
    calibrated = apply_calibration(df, driver_models, team_models)
    
    # Calculate overall metrics
    overall_metrics = calculate_overall_metrics(calibrated)
    
    print(f"\n✅ Calibration pipeline complete!")
    print(f"\n📁 Files created:")
    print(f"  • Calibrated results: {OUT_CAL}")
    print(f"  • Driver summary: {SUM_DRIVER}")
    print(f"  • Team summary: {SUM_TEAM}")
    print(f"  • Calibration models: {OUT_DIR}/")
    print(f"  • Overall metrics: {OUT_DIR}/overall_metrics.json")
    
    print(f"\n📈 Next steps:")
    print(f"  1. Run team_calibration_dashboard.py for team comparisons")
    print(f"  2. Run driver_calibration_dashboard.py for driver comparisons")
    print(f"  3. Use calibrated probabilities in enhanced race simulator")

if __name__ == "__main__":
    main()
