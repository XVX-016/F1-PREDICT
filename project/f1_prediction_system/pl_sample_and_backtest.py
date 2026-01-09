#!/usr/bin/env python3
"""
Plackett-Luce Model Sampling and Backtesting
Implements PL model for full race ranking predictions with backtesting
"""

import pandas as pd
import numpy as np
import joblib
from pathlib import Path
import json
from sklearn.metrics import mean_squared_error, mean_absolute_error
import matplotlib.pyplot as plt
import seaborn as sns
from scipy.stats import spearmanr, kendalltau

# File paths
PAIRWISE_FILE = "pairwise_comparisons.csv"
BT_MODEL_FILE = "bradley_terry_models/bt_model.joblib"
BT_SCALER_FILE = "bradley_terry_models/bt_scaler.joblib"
RACE_RESULTS_FILE = "2025_race_results.csv"
OUTPUT_DIR = "plackett_luce_models"
PL_MODEL_FILE = f"{OUTPUT_DIR}/pl_model.joblib"
BACKTEST_RESULTS_FILE = f"{OUTPUT_DIR}/backtest_results.json"

class PlackettLuceModel:
    def __init__(self, bt_model, bt_scaler, drivers, additional_features):
        """Initialize Plackett-Luce model with Bradley-Terry base"""
        self.bt_model = bt_model
        self.bt_scaler = bt_scaler
        self.drivers = drivers
        self.additional_features = additional_features
        
        # Extract driver strengths from BT model
        self.driver_strengths = self._extract_driver_strengths()
        
    def _extract_driver_strengths(self):
        """Extract driver strength parameters from BT model"""
        driver_coeffs = self.bt_model.coef_[0][:len(self.drivers)]
        return dict(zip(self.drivers, driver_coeffs))
    
    def get_driver_strength(self, driver, context_features=None):
        """Get driver strength with optional context adjustment"""
        base_strength = self.driver_strengths.get(driver, 0.0)
        
        if context_features is not None and len(self.additional_features) > 0:
            # Apply context adjustment (simplified)
            context_adjustment = np.mean(context_features) * 0.1  # Small adjustment
            return base_strength + context_adjustment
        
        return base_strength
    
    def sample_ranking(self, available_drivers, context_features=None, temperature=1.0):
        """Sample a complete ranking using Plackett-Luce model"""
        if not available_drivers:
            return []
        
        # Get strengths for available drivers
        strengths = {}
        for driver in available_drivers:
            strength = self.get_driver_strength(driver, context_features)
            strengths[driver] = strength
        
        # Apply temperature scaling
        if temperature != 1.0:
            for driver in strengths:
                strengths[driver] /= temperature
        
        # Convert to probabilities using softmax
        strength_values = np.array(list(strengths.values()))
        logits = strength_values - np.max(strength_values)  # Numerical stability
        exp_strengths = np.exp(logits)
        probs = exp_strengths / np.sum(exp_strengths)
        
        # Sample ranking sequentially
        ranking = []
        remaining_drivers = available_drivers.copy()
        remaining_probs = probs.copy()
        
        for position in range(len(available_drivers)):
            if len(remaining_drivers) == 0:
                break
            
            # Sample next position
            next_idx = np.random.choice(len(remaining_drivers), p=remaining_probs)
            next_driver = remaining_drivers[next_idx]
            
            ranking.append({
                'position': position + 1,
                'driver': next_driver,
                'strength': strengths[next_driver]
            })
            
            # Remove selected driver and update probabilities
            remaining_drivers.pop(next_idx)
            remaining_probs = np.delete(remaining_probs, next_idx)
            
            # Renormalize remaining probabilities
            if len(remaining_probs) > 0:
                remaining_probs = remaining_probs / np.sum(remaining_probs)
        
        return ranking
    
    def sample_multiple_rankings(self, available_drivers, n_samples=1000, context_features=None, temperature=1.0):
        """Sample multiple rankings for Monte Carlo estimation"""
        all_rankings = []
        
        for _ in range(n_samples):
            ranking = self.sample_ranking(available_drivers, context_features, temperature)
            all_rankings.append(ranking)
        
        return all_rankings
    
    def estimate_position_probabilities(self, available_drivers, n_samples=1000, context_features=None, temperature=1.0):
        """Estimate position probabilities for each driver"""
        rankings = self.sample_multiple_rankings(available_drivers, n_samples, context_features, temperature)
        
        # Initialize counters
        position_counts = {driver: np.zeros(len(available_drivers)) for driver in available_drivers}
        
        # Count positions
        for ranking in rankings:
            for item in ranking:
                driver = item['driver']
                position = item['position'] - 1  # 0-indexed
                if position < len(available_drivers):
                    position_counts[driver][position] += 1
        
        # Convert to probabilities
        position_probs = {}
        for driver in available_drivers:
            position_probs[driver] = position_counts[driver] / n_samples
        
        return position_probs
    
    def predict_race_outcome(self, grid_drivers, context_features=None, n_samples=1000, temperature=1.0):
        """Predict complete race outcome"""
        print(f"Predicting race outcome for {len(grid_drivers)} drivers...")
        
        # Estimate position probabilities
        position_probs = self.estimate_position_probabilities(
            grid_drivers, n_samples, context_features, temperature
        )
        
        # Calculate expected positions and other metrics
        results = []
        for driver in grid_drivers:
            probs = position_probs[driver]
            
            # Expected position
            expected_pos = np.sum(np.arange(1, len(grid_drivers) + 1) * probs)
            
            # Win probability
            win_prob = probs[0] if len(probs) > 0 else 0
            
            # Podium probability
            podium_prob = np.sum(probs[:3]) if len(probs) >= 3 else np.sum(probs)
            
            # Points probability (top 10)
            points_prob = np.sum(probs[:10]) if len(probs) >= 10 else np.sum(probs)
            
            results.append({
                'driver': driver,
                'win_prob': win_prob,
                'podium_prob': podium_prob,
                'points_prob': points_prob,
                'expected_position': expected_pos,
                'position_distribution': probs
            })
        
        # Sort by win probability
        results.sort(key=lambda x: x['win_prob'], reverse=True)
        
        return pd.DataFrame(results)

def load_models_and_data():
    """Load Bradley-Terry model and race data"""
    print("Loading models and data...")
    
    try:
        bt_model = joblib.load(BT_MODEL_FILE)
        print(f"  Bradley-Terry model loaded: {BT_MODEL_FILE}")
    except FileNotFoundError:
        print(f"  {BT_MODEL_FILE} not found. Run fit_bt_model.py first.")
        return None, None, None, None
    
    try:
        bt_scaler = joblib.load(BT_SCALER_FILE)
        print(f"  BT scaler loaded: {BT_SCALER_FILE}")
    except FileNotFoundError:
        print(f"  {BT_SCALER_FILE} not found. Using no scaling.")
        bt_scaler = None
    
    try:
        pairwise_df = pd.read_csv(PAIRWISE_FILE)
        print(f"  Pairwise data loaded: {len(pairwise_df)} comparisons")
    except FileNotFoundError:
        print(f"  {PAIRWISE_FILE} not found. Run build_pairwise_dataset.py first.")
        return None, None, None, None
    
    try:
        race_results = pd.read_csv(RACE_RESULTS_FILE)
        print(f"  Race results loaded: {len(race_results)} records")
    except FileNotFoundError:
        print(f"  {RACE_RESULTS_FILE} not found.")
        race_results = None
    
    # Extract unique drivers and features
    drivers = sorted(list(set(pairwise_df['winner'].unique()) | set(pairwise_df['loser'].unique())))
    
    # Identify additional features (excluding basic pairwise features)
    basic_features = ['race', 'winner', 'loser', 'winner_team', 'loser_team', 
                     'winner_position', 'loser_position', 'margin', 'same_team']
    additional_features = [col for col in pairwise_df.columns if col not in basic_features]
    
    print(f"  Drivers: {len(drivers)}")
    print(f"  Additional features: {len(additional_features)}")
    
    return bt_model, bt_scaler, drivers, additional_features, race_results

def create_context_features(race_name, pairwise_df, additional_features):
    """Create context features for a specific race"""
    if race_name not in pairwise_df['race'].values:
        return None
    
    race_data = pairwise_df[pairwise_df['race'] == race_name]
    
    context = []
    for feature in additional_features:
        if feature in race_data.columns:
            # Only process numeric features
            if pd.api.types.is_numeric_dtype(race_data[feature]):
                value = race_data[feature].mean()
                if pd.notna(value):
                    context.append(value)
                else:
                    context.append(0.0)
            else:
                context.append(0.0)
        else:
            context.append(0.0)
    
    return np.array(context)

def backtest_pl_model(pl_model, race_results, pairwise_df, additional_features):
    """Backtest Plackett-Luce model on historical races"""
    print("Backtesting Plackett-Luce model...")
    
    if race_results is None:
        print("  No race results available for backtesting")
        return None
    
    backtest_results = []
    
    # Group by race
    for race_name, race_group in race_results.groupby('raceName'):
        print(f"  Backtesting {race_name}...")
        
        # Get grid drivers for this race
        grid_drivers = race_group['driver'].tolist()
        
        # Create context features
        context_features = create_context_features(race_name, pairwise_df, additional_features)
        
        # Predict race outcome
        predictions = pl_model.predict_race_outcome(
            grid_drivers, context_features, n_samples=1000, temperature=1.0
        )
        
        # Get actual results
        actual_results = race_group.sort_values('position')[['driver', 'position']].reset_index(drop=True)
        
        # Calculate prediction errors
        for _, pred_row in predictions.iterrows():
            driver = pred_row['driver']
            pred_pos = pred_row['expected_position']
            
            # Find actual position
            actual_row = actual_results[actual_results['driver'] == driver]
            if len(actual_row) > 0:
                actual_pos = actual_row.iloc[0]['position']
                
                # Calculate errors
                abs_error = abs(pred_pos - actual_pos)
                squared_error = (pred_pos - actual_pos) ** 2
                
                backtest_results.append({
                    'race': race_name,
                    'driver': driver,
                    'predicted_position': pred_pos,
                    'actual_position': actual_pos,
                    'absolute_error': abs_error,
                    'squared_error': squared_error,
                    'win_prob': pred_row['win_prob'],
                    'podium_prob': pred_row['podium_prob']
                })
    
    if not backtest_results:
        print("  No backtest results generated")
        return None
    
    backtest_df = pd.DataFrame(backtest_results)
    
    # Calculate overall metrics
    mae = mean_absolute_error(backtest_df['actual_position'], backtest_df['predicted_position'])
    mse = mean_squared_error(backtest_df['actual_position'], backtest_df['predicted_position'])
    rmse = np.sqrt(mse)
    
    # Calculate correlation between predicted and actual positions
    correlation = backtest_df['predicted_position'].corr(backtest_df['actual_position'])
    
    # Calculate Spearman and Kendall correlations
    spearman_corr, spearman_p = spearmanr(backtest_df['predicted_position'], backtest_df['actual_position'])
    kendall_corr, kendall_p = kendalltau(backtest_df['predicted_position'], backtest_df['actual_position'])
    
    metrics = {
        'mae': mae,
        'mse': mse,
        'rmse': rmse,
        'correlation': correlation,
        'spearman_correlation': spearman_corr,
        'spearman_p_value': spearman_p,
        'kendall_correlation': kendall_corr,
        'kendall_p_value': kendall_p,
        'total_predictions': len(backtest_df),
        'races_covered': backtest_df['race'].nunique()
    }
    
    print(f"  Backtest completed:")
    print(f"    MAE: {mae:.3f}")
    print(f"    RMSE: {rmse:.3f}")
    print(f"    Correlation: {correlation:.3f}")
    print(f"    Spearman: {spearman_corr:.3f}")
    print(f"    Kendall: {kendall_corr:.3f}")
    
    return backtest_df, metrics

def save_pl_results(pl_model, backtest_df, metrics, output_dir):
    """Save Plackett-Luce model results"""
    print("Saving Plackett-Luce model results...")
    
    # Create output directory
    Path(output_dir).mkdir(exist_ok=True)
    
    # Save model
    joblib.dump(pl_model, PL_MODEL_FILE)
    
    # Save backtest results
    if backtest_df is not None:
        backtest_df.to_csv(f"{output_dir}/backtest_results.csv", index=False)
    
    # Save metrics
    with open(BACKTEST_RESULTS_FILE, 'w') as f:
        json.dump(metrics, f, indent=2)
    
    print(f"  Model saved to: {PL_MODEL_FILE}")
    if backtest_df is not None:
        print(f"  Backtest results saved to: {output_dir}/backtest_results.csv")
    print(f"  Metrics saved to: {BACKTEST_RESULTS_FILE}")

def create_comparison_visualizations(backtest_df, metrics, output_dir):
    """Create visualizations comparing PL predictions with actual results"""
    print("Creating comparison visualizations...")
    
    if backtest_df is None:
        print("  No backtest data for visualizations")
        return
    
    # Set up plotting style
    plt.style.use('default')
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    fig.suptitle('Plackett-Luce Model Backtest Results', fontsize=16)
    
    # 1. Predicted vs Actual Positions
    ax1 = axes[0, 0]
    ax1.scatter(backtest_df['actual_position'], backtest_df['predicted_position'], alpha=0.6)
    ax1.plot([1, 20], [1, 20], 'r--', alpha=0.8, label='Perfect Prediction')
    ax1.set_xlabel('Actual Position')
    ax1.set_ylabel('Predicted Position')
    ax1.set_title('Predicted vs Actual Positions')
    ax1.legend()
    ax1.grid(True, alpha=0.3)
    
    # 2. Prediction Error Distribution
    ax2 = axes[0, 1]
    ax2.hist(backtest_df['absolute_error'], bins=20, alpha=0.7, edgecolor='black')
    ax2.axvline(metrics['mae'], color='red', linestyle='--', label=f'MAE: {metrics["mae"]:.2f}')
    ax2.set_xlabel('Absolute Prediction Error')
    ax2.set_ylabel('Frequency')
    ax2.set_title('Prediction Error Distribution')
    ax2.legend()
    ax2.grid(True, alpha=0.3)
    
    # 3. Win Probability vs Actual Performance
    ax3 = axes[1, 0]
    # Group by win probability bins
    backtest_df['win_prob_bin'] = pd.cut(backtest_df['win_prob'], bins=10)
    win_prob_performance = backtest_df.groupby('win_prob_bin')['actual_position'].mean()
    win_prob_performance.plot(kind='bar', ax=ax3, alpha=0.7)
    ax3.set_xlabel('Win Probability Bin')
    ax3.set_ylabel('Average Actual Position')
    ax3.set_title('Win Probability vs Actual Performance')
    ax3.tick_params(axis='x', rotation=45)
    ax3.grid(True, alpha=0.3)
    
    # 4. Race-by-Race Performance
    ax4 = axes[1, 1]
    race_performance = backtest_df.groupby('race')['absolute_error'].mean().sort_values()
    race_performance.plot(kind='bar', ax=ax4, alpha=0.7)
    ax4.set_xlabel('Race')
    ax4.set_ylabel('Average Absolute Error')
    ax4.set_title('Race-by-Race Prediction Performance')
    ax4.tick_params(axis='x', rotation=45)
    ax4.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(f"{output_dir}/pl_backtest_analysis.png", dpi=300, bbox_inches='tight')
    print(f"  Visualizations saved to: {output_dir}/pl_backtest_analysis.png")

def main():
    """Main pipeline for Plackett-Luce model sampling and backtesting"""
    print("Plackett-Luce Model Sampling and Backtesting")
    print("=" * 60)
    
    # Load models and data
    bt_model, bt_scaler, drivers, additional_features, race_results = load_models_and_data()
    if bt_model is None:
        print("Failed to load required data. Exiting.")
        return
    
    # Initialize Plackett-Luce model
    print("Initializing Plackett-Luce model...")
    pl_model = PlackettLuceModel(bt_model, bt_scaler, drivers, additional_features)
    
    # Example prediction
    print("\nExample race prediction:")
    sample_drivers = ['Max Verstappen', 'Lewis Hamilton', 'Charles Leclerc', 'Lando Norris']
    sample_context = np.zeros(len(additional_features)) if additional_features else None
    
    prediction = pl_model.predict_race_outcome(sample_drivers, sample_context, n_samples=1000)
    print(prediction[['driver', 'win_prob', 'expected_position']].head())
    
    # Load pairwise data for backtesting
    try:
        pairwise_df = pd.read_csv("pairwise_comparisons.csv")
        print(f"Loaded pairwise data for backtesting: {len(pairwise_df)} comparisons")
    except FileNotFoundError:
        print("Warning: pairwise_comparisons.csv not found. Skipping backtesting.")
        pairwise_df = None
    
    # Backtest model
    if pairwise_df is not None:
        backtest_df, metrics = backtest_pl_model(pl_model, race_results, pairwise_df, additional_features)
    else:
        backtest_df, metrics = None, None
    
    # Save results
    save_pl_results(pl_model, backtest_df, metrics, OUTPUT_DIR)
    
    # Create visualizations
    if backtest_df is not None:
        create_comparison_visualizations(backtest_df, metrics, OUTPUT_DIR)
    
    print("\nPlackett-Luce model implementation completed!")
    if metrics:
        print(f"Model performance: MAE={metrics['mae']:.3f}, RMSE={metrics['rmse']:.3f}")

if __name__ == "__main__":
    main()
