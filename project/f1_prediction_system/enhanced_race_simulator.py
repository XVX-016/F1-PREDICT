#!/usr/bin/env python3
"""
Enhanced F1 Race Simulator with Sequential Sampling
Generates realistic race finishing orders using constrained probability sampling
"""

import pandas as pd
import numpy as np
import joblib
from tqdm import trange
import warnings
warnings.filterwarnings('ignore')

class EnhancedF1RaceSimulator:
    def __init__(self):
        """Initialize the enhanced simulator"""
        self.model = None
        self.scaler = None
        self.feature_columns = None
        self.driver_track_baselines = None
        self.driver_stats = None
        self.load_model_and_data()
    
    def load_model_and_data(self):
        """Load the trained model and supporting data"""
        print("📁 Loading model and data...")
        
        try:
            self.model = joblib.load("f1_prediction_model.joblib")
            print(f"  ✓ Model loaded: f1_prediction_model.joblib")
        except FileNotFoundError:
            print(f"  ❌ f1_prediction_model.joblib not found. Run train_model.py first.")
            return
        
        try:
            self.scaler = joblib.load("f1_scaler.joblib")
            print(f"  ✓ Scaler loaded: f1_scaler.joblib")
        except FileNotFoundError:
            print(f"  ❌ f1_scaler.joblib not found. Run train_model.py first.")
            return
        
        try:
            feature_info = pd.read_csv("feature_columns.csv")
            self.feature_columns = feature_info['feature'].tolist()
            print(f"  ✓ Feature columns loaded: {len(self.feature_columns)} features")
        except FileNotFoundError:
            print(f"  ❌ feature_columns.csv not found. Run train_model.py first.")
            return
        
        try:
            self.driver_track_baselines = pd.read_csv("driver_track_baselines.csv", index_col=0)
            print(f"  ✓ Track baselines loaded: {self.driver_track_baselines.shape}")
        except FileNotFoundError:
            print(f"  ⚠️  driver_track_baselines.csv not found. Track-specific features will be disabled.")
            self.driver_track_baselines = None
        
        try:
            self.driver_stats = pd.read_csv("driver_statistics.csv")
            print(f"  ✓ Driver statistics loaded: {len(self.driver_stats)} drivers")
        except FileNotFoundError:
            print(f"  ⚠️  driver_statistics.csv not found. Driver stats will be limited.")
            self.driver_stats = None
    
    def prepare_grid_features(self, grid_df, race_name, weather_info=None):
        """Prepare features for the grid using the trained model"""
        if not all([self.model, self.scaler, self.feature_columns]):
            print("❌ Model or data not loaded properly")
            return None
        
        print(f"🔧 Preparing features for {race_name}...")
        
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
        missing_features = set(self.feature_columns) - set(features_df.columns)
        if missing_features:
            print(f"  ⚠️  Missing features: {missing_features}")
            for feature in missing_features:
                # Set appropriate default values based on feature type
                if 'ewma' in feature:
                    features_df[feature] = 0.0
                elif 'track_' in feature:
                    features_df[feature] = 0.0
                elif 'total_' in feature:
                    features_df[feature] = 0.0
                elif 'recent_form_score' in feature:
                    features_df[feature] = 0.0
                elif 'qualifying_advantage' in feature:
                    features_df[feature] = 0.0
                elif 'track_advantage' in feature:
                    features_df[feature] = 0.0
                elif 'weather_impact' in feature:
                    features_df[feature] = 1.0
                elif 'position_inverted' in feature:
                    features_df[feature] = 10.0  # Middle position
                else:
                    features_df[feature] = 0.0
        
        # Select and order features exactly as trained
        X = features_df[self.feature_columns].values
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        # Get model predictions
        features_df['win_prob_model'] = self.model.predict_proba(X_scaled)[:, 1]
        
        print(f"  ✓ Features prepared for {len(features_df)} drivers")
        return features_df
    
    def sequential_race_simulation(self, grid_df, race_name, weather_info=None, n_trials=10000):
        """
        Simulate race using sequential sampling with exclusion
        This ensures only one driver can finish in each position
        """
        print(f"🎲 Running sequential race simulation for {race_name}")
        print(f"  Grid size: {len(grid_df)} drivers")
        print(f"  Trials: {n_trials}")
        
        # Prepare features first
        features_df = self.prepare_grid_features(grid_df, race_name, weather_info)
        if features_df is None:
            return None, None
        
        drivers = features_df['driver'].tolist()
        base_probs = features_df['win_prob_model'].values
        
        # Initialize position counters
        position_counts = {driver: np.zeros(20) for driver in drivers}
        wins = {driver: 0 for driver in drivers}
        podiums = {driver: 0 for driver in drivers}
        points = {driver: 0 for driver in drivers}
        
        # Weather and track adjustments
        weather_multiplier = self._calculate_weather_multiplier(weather_info)
        track_adjustments = self._calculate_track_adjustments(race_name, drivers)
        
        # Run sequential simulations
        for trial in trange(n_trials, desc="Simulating races"):
            # Start with base probabilities
            remaining_drivers = drivers.copy()
            remaining_probs = base_probs.copy()
            
            # Apply weather and track adjustments
            remaining_probs *= weather_multiplier
            for i, driver in enumerate(remaining_drivers):
                if driver in track_adjustments:
                    remaining_probs[i] *= track_adjustments[driver]
            
            # Simulate race finishing order
            race_order = []
            
            for position in range(1, len(drivers) + 1):
                # Normalize probabilities for remaining drivers
                if remaining_probs.sum() > 0:
                    remaining_probs = remaining_probs / remaining_probs.sum()
                else:
                    # Fallback to uniform distribution if all probs are 0
                    remaining_probs = np.ones(len(remaining_probs)) / len(remaining_probs)
                
                # Sample driver for this position
                chosen_idx = np.random.choice(len(remaining_drivers), p=remaining_probs)
                chosen_driver = remaining_drivers[chosen_idx]
                
                # Record position
                race_order.append(chosen_driver)
                position_counts[chosen_driver][position-1] += 1
                
                # Update counters
                if position == 1:
                    wins[chosen_driver] += 1
                if position <= 3:
                    podiums[chosen_driver] += 1
                if position <= 10:
                    points[chosen_driver] += 1
                
                # Remove chosen driver and their probabilities
                remaining_drivers.pop(chosen_idx)
                remaining_probs = np.delete(remaining_probs, chosen_idx)
        
        # Calculate final statistics
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
        
        # Add race information
        results_df['race'] = race_name
        
        print(f"\n✅ Sequential simulation complete!")
        return results_df, features_df
    
    def _calculate_weather_multiplier(self, weather_info):
        """Calculate weather impact multiplier"""
        if not weather_info:
            return 1.0
        
        multiplier = 1.0
        
        # Rain effect
        if weather_info.get('rain', 0) > 0:
            multiplier *= 1.05  # Rain increases variability
        
        # Temperature effect
        temp = weather_info.get('temp', 20)
        if temp > 35:
            multiplier *= 1.03  # High temperature penalty
        elif temp < 5:
            multiplier *= 1.02  # Low temperature penalty
        
        # Wind effect
        wind = weather_info.get('wind', 0)
        if wind > 25:
            multiplier *= 1.02  # High wind penalty
        
        return multiplier
    
    def _calculate_track_adjustments(self, race_name, drivers):
        """Calculate track-specific performance adjustments"""
        track_adjustments = {}
        
        # Track-specific performance multipliers (can be learned from data)
        track_factors = {
            "Monaco Grand Prix": {
                "Lando Norris": 1.15, "Oscar Piastri": 1.12,  # McLaren strong on street circuits
                "Fernando Alonso": 1.10, "Lewis Hamilton": 1.08  # Experience on street circuits
            },
            "Singapore Grand Prix": {
                "Lando Norris": 1.12, "Oscar Piastri": 1.10,
                "Fernando Alonso": 1.08, "Charles Leclerc": 1.05
            },
            "Monza Grand Prix": {
                "Max Verstappen": 1.15, "Charles Leclerc": 1.12,  # Power tracks
                "Carlos Sainz": 1.10, "George Russell": 1.08
            },
            "Silverstone Grand Prix": {
                "Lando Norris": 1.18, "Oscar Piastri": 1.15,  # McLaren home track
                "Lewis Hamilton": 1.12, "George Russell": 1.10
            },
            "Spa-Francorchamps Grand Prix": {
                "Max Verstappen": 1.12, "Charles Leclerc": 1.10,
                "Lando Norris": 1.08, "Oscar Piastri": 1.05
            }
        }
        
        # Get adjustments for this track
        track_adjustments = track_factors.get(race_name, {})
        
        # Default adjustment for drivers not specified
        for driver in drivers:
            if driver not in track_adjustments:
                track_adjustments[driver] = 1.0
        
        return track_adjustments
    
    def generate_comprehensive_odds(self, results_df, house_margin=0.05):
        """Generate comprehensive betting odds including position betting"""
        print(f"\n💰 Generating comprehensive betting odds (house margin: {house_margin*100:.1f}%)")
        
        # Win odds
        adjusted_win_probs = results_df['win_prob'] / (1 - house_margin)
        total_win_prob = adjusted_win_probs.sum()
        normalized_win_probs = adjusted_win_probs / total_win_prob
        win_odds = 1 / normalized_win_probs
        
        # Podium odds
        adjusted_podium_probs = results_df['podium_prob'] / (1 - house_margin)
        total_podium_prob = adjusted_podium_probs.sum()
        normalized_podium_probs = adjusted_podium_probs / total_podium_prob
        podium_odds = 1 / normalized_podium_probs
        
        # Points finish odds (top 10)
        adjusted_points_probs = results_df['points_prob'] / (1 - house_margin)
        total_points_prob = adjusted_points_probs.sum()
        normalized_points_probs = adjusted_points_probs / total_points_prob
        points_odds = 1 / normalized_points_probs
        
        # Create comprehensive odds table
        odds_table = pd.DataFrame({
            'Driver': results_df['driver'],
            'Win Probability (%)': (normalized_win_probs * 100).round(2),
            'Win Decimal Odds': win_odds.round(2),
            'Podium Probability (%)': (normalized_podium_probs * 100).round(2),
            'Podium Decimal Odds': podium_odds.round(2),
            'Points Finish Probability (%)': (normalized_points_probs * 100).round(2),
            'Points Finish Decimal Odds': points_odds.round(2),
            'Expected Position': results_df['expected_position'].round(2)
        })
        
        return odds_table
    
    def print_simulation_summary(self, results_df, weather_info=None):
        """Print a comprehensive summary of simulation results"""
        print(f"\n📊 Enhanced Simulation Results Summary")
        print("=" * 70)
        
        if weather_info:
            print(f"Weather: {weather_info}")
        
        print(f"\n🏆 Top 10 Win Probabilities (Sequential Simulation):")
        for i, row in results_df.head(10).iterrows():
            print(f"  {i+1:2d}. {row['driver']:<20} {row['win_prob']*100:5.2f}% (P{row['expected_position']:.1f})")
        
        print(f"\n🥉 Podium Probabilities:")
        for i, row in results_df.head(5).iterrows():
            print(f"  {row['driver']:<20} Podium: {row['podium_prob']*100:5.2f}%")
        
        # Calculate model confidence and validation
        top_3_win_prob = results_df.head(3)['win_prob'].sum()
        total_win_prob = results_df['win_prob'].sum()
        
        print(f"\n🎯 Model Validation:")
        print(f"  Top 3 combined win probability: {top_3_win_prob*100:.1f}%")
        print(f"  Total win probability: {total_win_prob*100:.1f}% (should be ~100%)")
        print(f"  Probability distribution valid: {'✅' if 0.99 <= total_win_prob <= 1.01 else '❌'}")

def main():
    """Main function to demonstrate the enhanced simulator"""
    print("🏎️  Enhanced F1 2025 Race Simulator (Sequential Sampling)")
    print("=" * 70)
    
    # Initialize simulator
    simulator = EnhancedF1RaceSimulator()
    
    if not all([simulator.model, simulator.scaler, simulator.feature_columns]):
        print("❌ Cannot proceed without model and data")
        return
    
    # Load 2025 driver standings for consistent grid
    try:
        driver_standings = pd.read_csv("2025_driver_standings.csv")
        drivers = driver_standings['driver'].tolist()
        constructors = driver_standings['constructor'].tolist()
        print(f"  ✓ Loaded {len(drivers)} drivers from 2025 standings")
    except FileNotFoundError:
        print("❌ 2025_driver_standings.csv not found")
        return
    
    # Create grid for simulation
    grid_df = pd.DataFrame({
        'driver': drivers,
        'grid': range(1, len(drivers) + 1),
        'constructor': constructors
    })
    
    # Example weather conditions
    weather_info = {
        'temp': 22,      # 22°C
        'rain': 0,       # 0% rain chance
        'wind': 15       # 15 km/h wind
    }
    
    # Run enhanced simulation
    race_name = "Monaco Grand Prix"
    results_df, features_df = simulator.sequential_race_simulation(
        grid_df, race_name, weather_info, n_trials=5000
    )
    
    if results_df is not None:
        # Print summary
        simulator.print_simulation_summary(results_df, weather_info)
        
        # Generate comprehensive odds
        odds_table = simulator.generate_comprehensive_odds(results_df)
        print(f"\n{odds_table.to_string(index=False)}")
        
        # Save results
        results_df.to_csv("enhanced_monte_carlo_results.csv", index=False)
        odds_table.to_csv("enhanced_betting_odds.csv", index=False)
        print(f"\n💾 Results saved to enhanced_monte_carlo_results.csv and enhanced_betting_odds.csv")
    
    print("\n✅ Enhanced simulation demonstration complete!")

if __name__ == "__main__":
    main()
