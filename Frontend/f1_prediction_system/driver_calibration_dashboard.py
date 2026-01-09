#!/usr/bin/env python3
"""
Driver Calibration Dashboard: Pre vs Post Calibration
Per-driver calibration (pre vs post) with bias annotation and Brier scores.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.calibration import calibration_curve
from sklearn.metrics import brier_score_loss
import warnings
warnings.filterwarnings('ignore')

# File paths
RAW = "enhanced_monte_carlo_results.csv"
CAL = "enhanced_monte_carlo_results_calibrated.csv"
OUTP = "driver_calibration_v2.png"

def load_and_prepare_data():
    """Load raw and calibrated data"""
    print("📊 Loading data for driver calibration dashboard...")
    
    try:
        df_raw = pd.read_csv(RAW)
        print(f"  ✓ Loaded raw predictions: {len(df_raw)} samples")
    except FileNotFoundError:
        print(f"  ❌ {RAW} not found")
        return None, None
    
    try:
        df_cal = pd.read_csv(CAL)
        print(f"  ✓ Loaded calibrated predictions: {len(df_cal)} samples")
    except FileNotFoundError:
        print(f"  ❌ {CAL} not found")
        print(f"  Run calibrate_probabilities.py first")
        return None, None
    
    # Harmonize columns
    for old, new in [("predicted_win_prob", "win_prob"), ("winner", "actual"),
                     ("driver_name", "driver"), ("constructor", "team")]:
        if old in df_raw.columns and new not in df_raw.columns:
            df_raw.rename(columns={old: new}, inplace=True)
        if old in df_cal.columns and new not in df_cal.columns:
            df_cal.rename(columns={old: new}, inplace=True)
    
    # Ensure we have the required columns
    required_cols = ["driver", "team", "win_prob", "actual"]
    for df, name in [(df_raw, "raw"), (df_cal, "calibrated")]:
        missing = [c for c in required_cols if c not in df.columns]
        if missing:
            print(f"  ❌ {name} data missing columns: {missing}")
            return None, None
    
    print(f"  ✓ Data prepared successfully")
    return df_raw, df_cal

def create_driver_dashboard(df_raw, df_cal):
    """Create driver-level calibration dashboard with pre vs post comparison"""
    print("🏎️ Creating driver calibration dashboard...")
    
    drivers = sorted(df_cal["driver"].dropna().unique())
    rows, cols = 5, 4  # 5x4 grid for up to 20 drivers
    
    plt.figure(figsize=(20, 16))
    plt.suptitle("Driver Calibration Curves (Pre vs Post Calibration)", fontsize=18, y=0.98)
    
    for i, dv in enumerate(drivers[:rows * cols]):  # show first 20 drivers
        plt.subplot(rows, cols, i + 1)
        
        # Get data for this driver
        r = df_raw[df_raw.driver == dv].dropna(subset=["win_prob", "actual"])
        c = df_cal[df_cal.driver == dv].dropna(subset=["win_prob_calibrated", "actual"])
        
        if len(r) == 0 or len(c) == 0:
            plt.title(f"{dv}\n(no data)")
            plt.axis("off")
            continue
        
        # Plot calibration curves
        for label, probs, act in [
            ("Pre", r["win_prob"].values, r["actual"].values),
            ("Post", c["win_prob_calibrated"].values, c["actual"].values),
        ]:
            try:
                pt, pp = calibration_curve(act, probs, n_bins=6, strategy="uniform")
                plt.plot(pp, pt, label=label, marker="o" if label == "Pre" else "s", linewidth=2)
            except Exception as e:
                print(f"    ⚠️  Calibration curve failed for {dv} - {label}: {e}")
                continue
        
        # Perfect calibration line
        plt.plot([0, 1], [0, 1], "k--", alpha=0.5)
        
        # Calculate metrics
        bias_pre = r["win_prob"].mean() - r["actual"].mean()
        bias_post = c["win_prob_calibrated"].mean() - c["actual"].mean()
        
        try:
            brier_pre = brier_score_loss(r["actual"], r["win_prob"]) if len(r) > 1 else np.nan
        except:
            brier_pre = np.nan
            
        try:
            brier_post = brier_score_loss(c["actual"], c["win_prob_calibrated"]) if len(c) > 1 else np.nan
        except:
            brier_post = np.nan
        
        # Add metrics annotation with color coding
        txt = f"Pre Brier {brier_pre:.4f}\nPost Brier {brier_post:.4f}\nBias Δ {(bias_post-bias_pre):+.3f}"
        
        # Color code based on improvement
        if (bias_post - bias_pre) > 0:
            bbox = dict(boxstyle="round,pad=0.3", fc="#fee", ec="#c99", alpha=0.9)  # Red for bias increase
        else:
            bbox = dict(boxstyle="round,pad=0.3", fc="#efe", ec="#9c9", alpha=0.9)  # Green for bias decrease
        
        plt.text(0.02, 0.98, txt, transform=plt.gca().transAxes, 
                ha="left", va="top", fontsize=9, bbox=bbox)
        
        # Set title and labels
        plt.title(dv, fontsize=11, fontweight='bold')
        plt.xlabel("Predicted Probability")
        plt.ylabel("Observed Frequency")
        plt.grid(alpha=0.25)
        
        # Only show legend on first plot
        if i == 0:
            plt.legend(fontsize=9, loc="lower right")
    
    # Hide empty subplots
    for i in range(len(drivers[:rows * cols]), rows * cols):
        plt.subplot(rows, cols, i + 1)
        plt.axis("off")
    
    plt.tight_layout(rect=[0, 0, 1, 0.96])
    plt.savefig(OUTP, dpi=160, bbox_inches='tight')
    print(f"  💾 Driver calibration dashboard saved as {OUTP}")
    plt.show()
    
    return True

def print_driver_summary(df_raw, df_cal):
    """Print summary of driver calibration improvements"""
    print("\n" + "="*80)
    print("🏎️  DRIVER CALIBRATION SUMMARY")
    print("="*80)
    
    drivers = sorted(df_cal["driver"].dropna().unique())
    summary_data = []
    
    for dv in drivers:
        r = df_raw[df_raw.driver == dv].dropna(subset=["win_prob", "actual"])
        c = df_cal[df_cal.driver == dv].dropna(subset=["win_prob_calibrated", "actual"])
        
        if len(r) == 0 or len(c) == 0:
            continue
        
        # Calculate metrics
        bias_pre = r["win_prob"].mean() - r["actual"].mean()
        bias_post = c["win_prob_calibrated"].mean() - c["actual"].mean()
        
        try:
            brier_pre = brier_score_loss(r["actual"], r["win_prob"]) if len(r) > 1 else np.nan
        except:
            brier_pre = np.nan
            
        try:
            brier_post = brier_score_loss(c["actual"], c["win_prob_calibrated"]) if len(c) > 1 else np.nan
        except:
            brier_post = np.nan
        
        improvement = {
            "driver": dv,
            "team": c["team"].iloc[0] if len(c) > 0 else "Unknown",
            "brier_pre": brier_pre,
            "brier_post": brier_post,
            "brier_improvement": brier_pre - brier_post if not np.isnan(brier_pre) and not np.isnan(brier_post) else np.nan,
            "bias_pre": bias_pre,
            "bias_post": bias_post,
            "bias_improvement": abs(bias_pre) - abs(bias_post)
        }
        
        summary_data.append(improvement)
    
    # Create summary DataFrame
    summary_df = pd.DataFrame(summary_data)
    
    # Sort by Brier improvement
    summary_df = summary_df.sort_values("brier_improvement", ascending=False, na_position="last")
    
    print("\n📊 Driver Calibration Results (Sorted by Improvement)")
    print("-" * 90)
    print(f"{'Driver':<20} {'Team':<15} {'Brier Pre':<10} {'Brier Post':<10} {'Improvement':<12} {'Bias Δ':<10}")
    print("-" * 90)
    
    for _, row in summary_df.iterrows():
        brier_imp = f"{row['brier_improvement']:+.4f}" if not np.isnan(row['brier_improvement']) else "N/A"
        bias_imp = f"{row['bias_improvement']:+.3f}" if not np.isnan(row['bias_improvement']) else "N/A"
        
        print(f"{row['driver']:<20} {row['team']:<15} {row['brier_pre']:<10.4f} {row['brier_post']:<10.4f} {brier_imp:<12} {bias_imp:<10}")
    
    # Highlight best and worst improvements
    valid_improvements = summary_df[summary_df['brier_improvement'].notna()]
    if not valid_improvements.empty:
        best_improvement = valid_improvements.iloc[0]
        worst_improvement = valid_improvements.iloc[-1]
        
        print(f"\n✅ Best improvement: {best_improvement['driver']} ({best_improvement['team']}) - Brier: {best_improvement['brier_improvement']:+.4f}")
        print(f"⚠️  Worst improvement: {worst_improvement['driver']} ({worst_improvement['team']}) - Brier: {worst_improvement['brier_improvement']:+.4f}")
    
    # Team summary
    print(f"\n🏁 Team Performance Summary:")
    team_summary = summary_df.groupby('team').agg({
        'brier_improvement': 'mean',
        'bias_improvement': 'mean'
    }).round(4).sort_values('brier_improvement', ascending=False)
    
    print(f"{'Team':<15} {'Avg Brier Imp':<15} {'Avg Bias Imp':<15}")
    print("-" * 45)
    for team, row in team_summary.iterrows():
        brier_avg = f"{row['brier_improvement']:+.4f}" if not np.isnan(row['brier_improvement']) else "N/A"
        bias_avg = f"{row['bias_improvement']:+.3f}" if not np.isnan(row['bias_improvement']) else "N/A"
        print(f"{team:<15} {brier_avg:<15} {bias_avg:<15}")
    
    print(f"\n💾 Full results saved to {OUTP}")
    print("="*80)

def main():
    """Main function to create driver calibration dashboard"""
    print("🏎️  F1 Prediction Model: Driver Calibration Dashboard")
    print("=" * 80)
    
    # Load data
    df_raw, df_cal = load_and_prepare_data()
    if df_raw is None or df_cal is None:
        return
    
    print(f"\n📊 Data Summary:")
    print(f"  Raw predictions: {len(df_raw)} samples")
    print(f"  Calibrated predictions: {len(df_cal)} samples")
    print(f"  Drivers: {df_cal['driver'].nunique()}")
    
    # Create dashboard
    success = create_driver_dashboard(df_raw, df_cal)
    if success:
        # Print summary
        print_driver_summary(df_raw, df_cal)
        
        print(f"\n✅ Driver calibration dashboard complete!")
        print(f"\n📈 Next steps:")
        print(f"  1. Review {OUTP} for visual insights")
        print(f"  2. Check team summary for systematic improvements")
        print(f"  3. Use calibrated probabilities in enhanced race simulator")

if __name__ == "__main__":
    main()
