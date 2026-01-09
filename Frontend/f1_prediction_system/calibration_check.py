#!/usr/bin/env python3
"""F1 Prediction Model: Comprehensive Calibration Check & Evaluation"""
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from sklearn.metrics import brier_score_loss, log_loss
from sklearn.calibration import calibration_curve
import json
import warnings
warnings.filterwarnings('ignore')

# File paths
FILES = {
    'original': 'enhanced_monte_carlo_results.csv',
    'temp_scaled': 'enhanced_monte_carlo_results_temp_scaled.csv',
    'ewma_calibrated': 'enhanced_monte_carlo_results_ewma_calibrated.csv',
    'tracktype_calibrated': 'enhanced_monte_carlo_results_tracktype_calibrated.csv'
}

METRICS_FILES = {
    'temp_scaling': 'calibration_models/temp_scaling_metrics.json',
    'ewma_calibration': 'calibration_models/ewma_calibration_metrics.json',
    'tracktype_calibration': 'calibration_models/tracktype_calibration_metrics.json'
}

OUTPUT_DIR = "calibration_analysis"
OUTPUT_PNG = f"{OUTPUT_DIR}/calibration_progress_dashboard.png"

def load_all_data():
    """Load all calibration stages data"""
    print("📊 Loading all calibration stages data...")
    
    data = {}
    for stage, filepath in FILES.items():
        try:
            data[stage] = pd.read_csv(filepath)
            print(f"✅ {stage}: {len(data[stage])} predictions")
        except FileNotFoundError:
            print(f"⚠️  {stage}: {filepath} not found")
            data[stage] = None
    
    return data

def load_metrics():
    """Load all calibration metrics"""
    print("\n📈 Loading calibration metrics...")
    
    metrics = {}
    for stage, filepath in METRICS_FILES.items():
        try:
            with open(filepath, 'r') as f:
                metrics[stage] = json.load(f)
            print(f"✅ {stage}: metrics loaded")
        except FileNotFoundError:
            print(f"⚠️  {stage}: {filepath} not found")
            metrics[stage] = None
    
    return metrics

def calculate_stage_metrics(data):
    """Calculate metrics for each calibration stage"""
    print("\n🔍 Calculating stage-by-stage metrics...")
    
    stage_metrics = {}
    
    for stage, df in data.items():
        if df is None:
            continue
            
        if 'actual' not in df.columns:
            print(f"⚠️  {stage}: missing 'actual' column")
            continue
            
        # Determine which probability column to use
        if stage == 'original':
            prob_col = 'win_prob'
        elif stage == 'temp_scaled':
            prob_col = 'win_prob_temp_scaled'
        elif stage == 'ewma_calibrated':
            prob_col = 'win_prob_ewma_team'
        elif stage == 'tracktype_calibrated':
            prob_col = 'win_prob_tracktype_calibrated'
        else:
            continue
            
        if prob_col not in df.columns:
            print(f"⚠️  {stage}: missing '{prob_col}' column")
            continue
            
        # Calculate metrics
        brier = brier_score_loss(df['actual'], df[prob_col])
        logloss = log_loss(df['actual'], df[prob_col])
        
        # Calculate bias (average prediction - average actual)
        bias = df[prob_col].mean() - df['actual'].mean()
        
        stage_metrics[stage] = {
            'brier_score': brier,
            'log_loss': logloss,
            'bias': bias,
            'prob_column': prob_col,
            'sample_count': len(df)
        }
        
        print(f"  {stage}: Brier={brier:.6f}, LogLoss={logloss:.6f}, Bias={bias:+.4f}")
    
    return stage_metrics

def create_calibration_curves(data, stage_metrics):
    """Create calibration curves for all stages"""
    print("\n📊 Creating calibration curves...")
    
    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    fig.suptitle('F1 Prediction Model: Calibration Progress Dashboard', fontsize=16, fontweight='bold')
    
    stages = ['original', 'temp_scaled', 'ewma_calibrated', 'tracktype_calibrated']
    colors = ['red', 'orange', 'blue', 'green']
    
    for idx, (stage, color) in enumerate(zip(stages, colors)):
        if stage not in data or data[stage] is None:
            continue
            
        df = data[stage]
        prob_col = stage_metrics[stage]['prob_column']
        
        if prob_col not in df.columns:
            continue
            
        # Calculate calibration curve
        fraction_of_positives, mean_predicted_value = calibration_curve(
            df['actual'], df[prob_col], n_bins=10
        )
        
        # Plot calibration curve
        row, col = idx // 2, idx % 2
        ax = axes[row, col]
        
        # Perfect calibration line
        ax.plot([0, 1], [0, 1], 'k--', alpha=0.5, label='Perfect Calibration')
        
        # Actual calibration curve
        ax.plot(mean_predicted_value, fraction_of_positives, 'o-', color=color, 
                linewidth=2, markersize=8, label=f'{stage.replace("_", " ").title()}')
        
        # Add metrics text
        metrics = stage_metrics[stage]
        ax.text(0.05, 0.95, f'Brier: {metrics["brier_score"]:.4f}\nLogLoss: {metrics["log_loss"]:.4f}\nBias: {metrics["bias"]:+.4f}',
                transform=ax.transAxes, verticalalignment='top',
                bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
        
        ax.set_xlabel('Mean Predicted Probability')
        ax.set_ylabel('Fraction of Positives')
        ax.set_title(f'{stage.replace("_", " ").title()} Calibration')
        ax.legend()
        ax.grid(True, alpha=0.3)
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
    
    plt.tight_layout()
    return fig

def create_metrics_progression(stage_metrics):
    """Create metrics progression chart"""
    print("\n📈 Creating metrics progression chart...")
    
    fig, (ax1, ax2, ax3) = plt.subplots(1, 3, figsize=(18, 6))
    fig.suptitle('Calibration Metrics Progression', fontsize=16, fontweight='bold')
    
    stages = list(stage_metrics.keys())
    brier_scores = [stage_metrics[stage]['brier_score'] for stage in stages]
    log_losses = [stage_metrics[stage]['log_loss'] for stage in stages]
    biases = [stage_metrics[stage]['bias'] for stage in stages]
    
    # Brier Score progression
    ax1.plot(stages, brier_scores, 'o-', color='red', linewidth=2, markersize=8)
    ax1.set_title('Brier Score Progression')
    ax1.set_ylabel('Brier Score (Lower is Better)')
    ax1.grid(True, alpha=0.3)
    ax1.tick_params(axis='x', rotation=45)
    
    # Log Loss progression
    ax2.plot(stages, log_losses, 'o-', color='blue', linewidth=2, markersize=8)
    ax2.set_title('Log Loss Progression')
    ax2.set_ylabel('Log Loss (Lower is Better)')
    ax2.grid(True, alpha=0.3)
    ax2.tick_params(axis='x', rotation=45)
    
    # Bias progression
    ax3.plot(stages, biases, 'o-', color='green', linewidth=2, markersize=8)
    ax3.axhline(y=0, color='black', linestyle='--', alpha=0.5)
    ax3.set_title('Bias Progression')
    ax3.set_ylabel('Bias (Closer to 0 is Better)')
    ax3.grid(True, alpha=0.3)
    ax3.tick_params(axis='x', rotation=45)
    
    plt.tight_layout()
    return fig

def create_improvement_summary(stage_metrics):
    """Create improvement summary table"""
    print("\n📋 Creating improvement summary...")
    
    if len(stage_metrics) < 2:
        print("⚠️  Need at least 2 stages for improvement calculation")
        return None
    
    stages = list(stage_metrics.keys())
    improvements = {}
    
    for i in range(1, len(stages)):
        current_stage = stages[i]
        previous_stage = stages[i-1]
        
        current_brier = stage_metrics[current_stage]['brier_score']
        previous_brier = stage_metrics[previous_stage]['brier_score']
        
        brier_improvement = (previous_brier - current_brier) / previous_brier * 100
        
        improvements[f"{previous_stage}_to_{current_stage}"] = {
            'brier_before': previous_brier,
            'brier_after': current_brier,
            'brier_improvement_pct': brier_improvement,
            'stage_name': f"{previous_stage.replace('_', ' ').title()} → {current_stage.replace('_', ' ').title()}"
        }
    
    return improvements

def print_improvement_summary(improvements):
    """Print improvement summary"""
    print("\n" + "="*80)
    print("🎯 CALIBRATION IMPROVEMENT SUMMARY")
    print("="*80)
    
    if not improvements:
        print("No improvements to calculate")
        return
    
    for step, metrics in improvements.items():
        print(f"\n{metrics['stage_name']}:")
        print(f"  Brier Score: {metrics['brier_before']:.6f} → {metrics['brier_after']:.6f}")
        print(f"  Improvement: {metrics['brier_improvement_pct']:+.1f}%")
        
        if metrics['brier_improvement_pct'] > 0:
            print(f"  ✅ POSITIVE improvement")
        else:
            print(f"  ❌ NEGATIVE change")
    
    # Overall improvement
    first_stage = list(improvements.keys())[0].split('_to_')[0]
    last_stage = list(improvements.keys())[-1].split('_to_')[1]
    
    first_brier = improvements[list(improvements.keys())[0]]['brier_before']
    last_brier = improvements[list(improvements.keys())[-1]]['brier_after']
    
    overall_improvement = (first_brier - last_brier) / first_brier * 100
    
    print(f"\n🎯 OVERALL IMPROVEMENT ({first_stage.replace('_', ' ').title()} → {last_stage.replace('_', ' ').title()}):")
    print(f"  Brier Score: {first_brier:.6f} → {last_brier:.6f}")
    print(f"  Total Improvement: {overall_improvement:+.1f}%")
    
    if overall_improvement > 0:
        print(f"  🏆 EXCELLENT: Model calibration significantly improved!")
    elif overall_improvement > -5:
        print(f"  ✅ GOOD: Model calibration maintained or slightly improved")
    else:
        print(f"  ⚠️  CAUTION: Model calibration may have degraded")

def save_dashboard(fig_calibration, fig_progression):
    """Save the calibration dashboard"""
    print(f"\n💾 Saving calibration dashboard...")
    
    Path(OUTPUT_DIR).mkdir(exist_ok=True)
    
    # Save calibration curves
    fig_calibration.savefig(f"{OUTPUT_DIR}/calibration_curves.png", dpi=300, bbox_inches='tight')
    print(f"  Saved calibration curves: {OUTPUT_DIR}/calibration_curves.png")
    
    # Save progression chart
    fig_progression.savefig(f"{OUTPUT_DIR}/metrics_progression.png", dpi=300, bbox_inches='tight')
    print(f"  Saved metrics progression: {OUTPUT_DIR}/metrics_progression.png")
    
    # Save combined dashboard
    fig_calibration.savefig(OUTPUT_PNG, dpi=300, bbox_inches='tight')
    print(f"  Saved combined dashboard: {OUTPUT_PNG}")

def main():
    """Main calibration check pipeline"""
    print("F1 Prediction Model: Comprehensive Calibration Check")
    print("=" * 70)
    
    # Load all data
    data = load_all_data()
    
    # Load metrics
    metrics = load_metrics()
    
    # Calculate stage metrics
    stage_metrics = calculate_stage_metrics(data)
    
    if not stage_metrics:
        print("❌ No valid data found for analysis")
        return
    
    # Create improvement summary
    improvements = create_improvement_summary(stage_metrics)
    
    # Print improvement summary
    print_improvement_summary(improvements)
    
    # Create visualizations
    print("\n🎨 Creating visualizations...")
    
    # Calibration curves
    fig_calibration = create_calibration_curves(data, stage_metrics)
    
    # Metrics progression
    fig_progression = create_metrics_progression(stage_metrics)
    
    # Save dashboard
    save_dashboard(fig_calibration, fig_progression)
    
    print("\n✅ Calibration check completed successfully!")
    print(f"📊 Dashboard saved to: {OUTPUT_DIR}/")
    print(f"🎯 Key insights:")
    
    # Print key insights
    if improvements:
        best_step = max(improvements.items(), key=lambda x: x[1]['brier_improvement_pct'])
        print(f"  🏆 Best improvement: {best_step[1]['stage_name']} ({best_step[1]['brier_improvement_pct']:+.1f}%)")
        
        if best_step[1]['brier_improvement_pct'] > 10:
            print(f"  🚀 Excellent calibration improvement!")
        elif best_step[1]['brier_improvement_pct'] > 5:
            print(f"  ✅ Good calibration improvement")
        else:
            print(f"  📈 Modest calibration improvement")

if __name__ == "__main__":
    main()
