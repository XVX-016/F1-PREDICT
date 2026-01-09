#!/usr/bin/env python3
"""
Sequential Sampling F1 Race Simulator
Implements Sequential Sampling with Exclusion for ranked race outcomes
Moves from independent probabilities to full race order distributions
"""

import pandas as pd
import numpy as np
import joblib
from tqdm import trange
import warnings
from pathlib import Path
warnings.filterwarnings('ignore')

# Configuration
MODEL_FILE = "f1_prediction_model.joblib"
SCALER_FILE = "f1_scaler.joblib"
FEATURE_COLUMNS_FILE = "feature_columns.csv"
DRIVER_TRACK_BASE = "driver_track_baselines.csv"
DRIVER_STATS_FILE = "driver_statistics.csv"
N_TRIALS = 5000
RELIABILITY_BASE = 0.95

class SequentialSamplingSimulator:
    def __init__(self):
        """Initialize the simulator with trained model and data"""
        self.model = None
        self.scaler = None
        self.feature_columns = None
        self.driver_track_baselines = None
        self.driver_stats = None
        self.load_model_and_data()
    
    def load_model_and_data(self):
        """Load the trained model and supporting data"""
        print("Loading model and data...")
        
        try:
            self.model = joblib.load(MODEL_FILE)
            print(f"  Model loaded: {MODEL_FILE}")
        except FileNotFoundError:
            print(f"  {MODEL_FILE} not found. Run train_model.py first.")
            return
        
        try:
            self.scaler = joblib.load(SCALER_FILE)
            print(f"  Scaler loaded: {SCALER_FILE}")
        except FileNotFoundError:
            print(f"  {SCALER_FILE} not found. Run train_model.py first.")
            return
        
        try:
            feature_info = pd.read_csv(FEATURE_COLUMNS_FILE)
            self.feature_columns = feature_info['feature'].tolist()
            print(f"  Feature columns loaded: {len(self.feature_columns)} features")
        except FileNotFoundError:
            print(f"  {FEATURE_COLUMNS_FILE} not found. Run train_model.py first.")
            return
        
        try:
            self.driver_track_baselines = pd.read_csv(DRIVER_TRACK_BASE, index_col=0)
            print(f"  Track baselines loaded: {self.driver_track_baselines.shape}")
        except FileNotFoundError:
            print(f"  {DRIVER_TRACK_BASE} not found. Track-specific features will be disabled.")
            self.driver_track_baselines = None
        
        try:
            self.driver_stats = pd.read_csv(DRIVER_STATS_FILE)
            print(f"  Driver statistics loaded: {len(self.driver_stats)} drivers")
        except FileNotFoundError:
            print(f"  {DRIVER_STATS_FILE} not found. Driver stats will be limited.")
            self.driver_stats = None
    
    def get_track_adjusted_probs(self, base_probs, race_name):
        """Apply track-specific performance adjustments"""
        if self.driver_track_baselines is None or race_name not in self.driver_track_baselines.columns:
            return base_probs
        
        track_multipliers = {}
        for driver in base_probs.index:
            if driver in self.driver_track_baselines.index:
                # Get track-specific performance relative to driver's average
                track_perf = self.driver_track_baselines.loc[driver, race_name]
                avg_perf = self.driver_track_baselines.loc[driver].mean()
                if avg_perf > 0:
                    multiplier = track_perf / avg_perf
                    track_multipliers[driver] = np.clip(multiplier, 0.5, 2.0)  # Limit multiplier range
                else:
                    track_multipliers[driver] = 1.0
            else:
                track_multipliers[driver] = 1.0
        
        # Apply track multipliers
        adjusted_probs = base_probs * pd.Series(track_multipliers)
        return adjusted_probs
    
    def prepare_grid_features(self, grid_df, race_name, weather_info=None):
        """Prepare features for the grid using the trained model"""
        if not all([self.model, self.scaler, self.feature_columns]):
            print("Model or data not loaded properly")
            return None
        
        print(f"Preparing features for {race_name}...")
        
        # Start with basic grid data
        features_df = grid_df.copy()
        
        # Add driver statistics if available
        if self.driver_stats is not None:
            features_df = features_df.merge(self.driver_stats, on='driver', how='left')
        
        # Add track-specific baselines if available
        if self.driver_track_baselines is not None and race_name in self.driver_track_baselines.columns:
            features_df['track_mean_points'] = features_df['driver'].map(
                lambda d: self.driver_track_baselines.loc[d, race_name] 
                if d in self.driver_track_baselines.index else 0
            )
        else:
            features_df['track_mean_points'] = 0
        
        # Fill missing values with defaults
        numeric_columns = features_df.select_dtypes(include=[np.number]).columns
        features_df[numeric_columns] = features_df[numeric_columns].fillna(0)
        
        # Ensure all required features are present
        missing_features = [col for col in self.feature_columns if col not in features_df.columns]
        if missing_features:
            print(f"Warning: Missing features: {missing_features}")
            for feature in missing_features:
                features_df[feature] = 0
        
        # Select only the required features in the correct order
        features_df = features_df[self.feature_columns]
        
        print(f"  Features prepared: {features_df.shape}")
        return features_df
    
    def get_base_win_probabilities(self, features_df, race_name):
        """Get base win probabilities from the trained model"""
        # Scale features
        features_scaled = self.scaler.transform(features_df)
        
        # Get raw predictions (logits)
        raw_predictions = self.model.predict_proba(features_scaled)
        
        # Extract win probabilities (assuming binary classification: win vs not-win)
        if raw_predictions.shape[1] == 2:
            win_probs = raw_predictions[:, 1]  # Probability of winning
        else:
            # If model outputs multiple classes, use the first as win probability
            win_probs = raw_predictions[:, 0]
        
        # Create probability series
        base_probs = pd.Series(win_probs, index=features_df.index)
        
        # Apply track-specific adjustments
        adjusted_probs = self.get_track_adjusted_probs(base_probs, race_name)
        
        return adjusted_probs
    
    def sequential_sampling_race(self, features_df, race_name, weather_info=None):
        """Simulate a single race using sequential sampling with exclusion"""
        drivers = features_df['driver'].tolist()
        
        # Get base win probabilities
        base_probs = self.get_base_win_probabilities(features_df, race_name)
        
        # Initialize race results
        race_order = []
        remaining_drivers = drivers.copy()
        remaining_probs = base_probs.copy()
        
        # Simulate race positions sequentially
        for position in range(1, min(len(drivers) + 1, 21)):  # Max 20 positions
            if len(remaining_drivers) == 0:
                break
            
            # Normalize remaining probabilities
            remaining_probs = remaining_probs / remaining_probs.sum()
            
            # Sample next position using weighted random choice
            next_driver = np.random.choice(remaining_drivers, p=remaining_probs.values)
            
            # Add to race order
            race_order.append({
                'position': position,
                'driver': next_driver,
                'team': features_df.loc[features_df['driver'] == next_driver, 'team'].iloc[0] if 'team' in features_df.columns else 'Unknown'
            })
            
            # Remove selected driver from remaining options
            remaining_drivers.remove(next_driver)
            remaining_probs = remaining_probs.drop(next_driver)
        
        # Handle any remaining drivers (DNFs, etc.)
        for driver in remaining_drivers:
            race_order.append({
                'position': len(race_order) + 1,
                'driver': driver,
                'team': features_df.loc[features_df['driver'] == driver, 'team'].iloc[0] if 'team' in features_df.columns else 'Unknown'
            })
        
        return pd.DataFrame(race_order)
    
    def run_sequential_sampling(self, grid_df, race_name, weather_info=None, n_trials=N_TRIALS):
        """Run sequential sampling simulation for race predictions"""
        print(f"\nRunning Sequential Sampling simulation for {race_name}")
        print(f"  Grid size: {len(grid_df)} drivers")
        print(f"  Trials: {n_trials}")
        
        # Prepare features
        features_df = self.prepare_grid_features(grid_df, race_name, weather_info)
        if features_df is None:
            return None
        
        drivers = features_df['driver'].tolist()
        
        # Initialize counters for ranked outcomes
        position_counts = {driver: np.zeros(20) for driver in drivers}
        wins = {driver: 0 for driver in drivers}
        podiums = {driver: 0 for driver in drivers}
        points = {driver: 0 for driver in drivers}
        
        # Store full race outcomes for analysis
        all_race_outcomes = []
        
        # Run simulations
        for trial in trange(n_trials, desc="Simulating races"):
            race_results = self.sequential_sampling_race(features_df, race_name, weather_info)
            all_race_outcomes.append(race_results)
            
            # Count positions
            for _, row in race_results.iterrows():
                driver = row['driver']
                position = row['position']
                
                if position <= 20:
                    position_counts[driver][position-1] += 1
                
                if position == 1:
                    wins[driver] += 1
                if position <= 3:
                    podiums[driver] += 1
                if position <= 10:
                    points[driver] += 1
        
        # Calculate probabilities and expected positions
        results_summary = []
        for driver in drivers:
            win_prob = wins[driver] / n_trials
            podium_prob = podiums[driver] / n_trials
            points_prob = points[driver] / n_trials
            
            # Expected position
            expected_pos = np.sum(np.arange(1, 21) * position_counts[driver]) / n_trials
            
            # Position distribution
            position_dist = position_counts[driver] / n_trials
            
            results_summary.append({
                'driver': driver,
                'win_prob': win_prob,
                'podium_prob': podium_prob,
                'points_prob': points_prob,
                'expected_position': expected_pos,
                'position_distribution': position_dist
            })
        
        # Create results dataframe
        results_df = pd.DataFrame(results_summary)
        results_df = results_df.sort_values('win_prob', ascending=False).reset_index(drop=True)
        
        # Add race information for evaluation
        results_df['race'] = race_name
        
        # Store full outcomes for detailed analysis
        self.full_race_outcomes = all_race_outcomes
        
        print(f"\nSequential sampling simulation complete!")
        return results_df, features_df
    
    def generate_ranked_odds_table(self, results_df, house_margin=0.05):
        """Convert probabilities to betting odds with ranked outcomes"""
        print(f"\nGenerating betting odds (house margin: {house_margin*100:.1f}%)")
        
        # Adjust probabilities for house margin
        adjusted_probs = results_df['win_prob'] / (1 - house_margin)
        total_prob = adjusted_probs.sum()
        normalized_probs = adjusted_probs / total_prob
        
        # Calculate decimal odds
        decimal_odds = 1 / normalized_probs
        
        # Create odds table
        odds_table = pd.DataFrame({
            'Driver': results_df['driver'],
            'Win Probability (%)': (normalized_probs * 100).round(2),
            'Decimal Odds': decimal_odds.round(2),
            'Podium Probability (%)': (results_df['podium_prob'] * 100).round(2),
            'Expected Position': results_df['expected_position'].round(2)
        })
        
        return odds_table
    
    def analyze_position_distributions(self, results_df):
        """Analyze position distributions for each driver"""
        print("\nAnalyzing position distributions...")
        
        position_analysis = []
        for _, row in results_df.iterrows():
            driver = row['driver']
            position_dist = row['position_distribution']
            
            # Calculate key statistics
            top_5_prob = np.sum(position_dist[:5])  # Positions 1-5
            top_10_prob = np.sum(position_dist[:10])  # Positions 1-10
            bottom_10_prob = np.sum(position_dist[10:])  # Positions 11-20
            
            position_analysis.append({
                'driver': driver,
                'top_5_prob': top_5_prob,
                'top_10_prob': top_10_prob,
                'bottom_10_prob': bottom_10_prob,
                'position_std': np.std(np.arange(1, 21) * position_dist)  # Standard deviation of position
            })
        
        return pd.DataFrame(position_analysis)
    
    def save_ranked_results(self, results_df, race_name, output_file=None):
        """Save ranked simulation results"""
        if output_file is None:
            output_file = f"ranked_simulation_{race_name.replace(' ', '_')}.csv"
        
        results_df.to_csv(output_file, index=False)
        print(f"Ranked results saved to: {output_file}")
        
        # Also save position distributions separately
        dist_file = output_file.replace('.csv', '_distributions.csv')
        position_dists = []
        for _, row in results_df.iterrows():
            driver = row['driver']
            dist = row['position_distribution']
            for pos, prob in enumerate(dist, 1):
                position_dists.append({
                    'driver': driver,
                    'position': pos,
                    'probability': prob
                })
        
        pd.DataFrame(position_dists).to_csv(dist_file, index=False)
        print(f"Position distributions saved to: {dist_file}")
        
        return output_file, dist_file

def main():
    """Example usage of the sequential sampling simulator"""
    print("Sequential Sampling F1 Race Simulator")
    print("=" * 50)
    
    # Initialize simulator
    simulator = SequentialSamplingSimulator()
    
    # Example grid (you would load this from your actual data)
    sample_grid = pd.DataFrame({
        'driver': ['Max Verstappen', 'Charles Leclerc', 'Lewis Hamilton', 'Lando Norris'],
        'team': ['Red Bull', 'Ferrari', 'Mercedes', 'McLaren'],
        'grid_position': [1, 2, 3, 4]
    })
    
    # Run simulation
    results, features = simulator.run_sequential_sampling(sample_grid, "Monaco Grand Prix")
    
    if results is not None:
        print("\nSimulation Results:")
        print(results[['driver', 'win_prob', 'expected_position']])
        
        # Generate odds
        odds = simulator.generate_ranked_odds_table(results)
        print("\nBetting Odds:")
        print(odds)
        
        # Analyze position distributions
        position_analysis = simulator.analyze_position_distributions(results)
        print("\nPosition Analysis:")
        print(position_analysis)
        
        # Save results
        simulator.save_ranked_results(results, "Monaco Grand Prix")

if __name__ == "__main__":
    main()
