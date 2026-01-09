#!/usr/bin/env python3
"""
Monte Carlo F1 Race Simulator
Uses trained ML model and advanced simulation to predict race outcomes
"""

import pandas as pd
import numpy as np
import joblib
from tqdm import trange
import warnings
warnings.filterwarnings('ignore')

# Configuration
MODEL_FILE = "f1_prediction_model.joblib"
SCALER_FILE = "f1_scaler.joblib"
FEATURE_COLUMNS_FILE = "feature_columns.csv"
DRIVER_TRACK_BASE = "driver_track_baselines.csv"
DRIVER_STATS_FILE = "driver_statistics.csv"
N_TRIALS = 5000
RELIABILITY_BASE = 0.95

class F1MonteCarloSimulator:
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
        print("📁 Loading model and data...")
        
        try:
            self.model = joblib.load(MODEL_FILE)
            print(f"  ✓ Model loaded: {MODEL_FILE}")
        except FileNotFoundError:
            print(f"  ❌ {MODEL_FILE} not found. Run train_model.py first.")
            return
        
        try:
            self.scaler = joblib.load(SCALER_FILE)
            print(f"  ✓ Scaler loaded: {SCALER_FILE}")
        except FileNotFoundError:
            print(f"  ❌ {SCALER_FILE} not found. Run train_model.py first.")
            return
        
        try:
            feature_info = pd.read_csv(FEATURE_COLUMNS_FILE)
            self.feature_columns = feature_info['feature'].tolist()
            print(f"  ✓ Feature columns loaded: {len(self.feature_columns)} features")
        except FileNotFoundError:
            print(f"  ❌ {FEATURE_COLUMNS_FILE} not found. Run train_model.py first.")
            return
        
        try:
            self.driver_track_baselines = pd.read_csv(DRIVER_TRACK_BASE, index_col=0)
            print(f"  ✓ Track baselines loaded: {self.driver_track_baselines.shape}")
        except FileNotFoundError:
            print(f"  ⚠️  {DRIVER_TRACK_BASE} not found. Track-specific features will be disabled.")
            self.driver_track_baselines = None
        
        try:
            self.driver_stats = pd.read_csv(DRIVER_STATS_FILE)
            print(f"  ✓ Driver statistics loaded: {len(self.driver_stats)} drivers")
        except FileNotFoundError:
            print(f"  ⚠️  {DRIVER_STATS_FILE} not found. Driver stats will be limited.")
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
    
    def simulate_race_once(self, features_df, race_name, weather_info=None, laps=60):
        """Simulate a single race"""
        drivers = features_df['driver'].tolist()
        
        # Base lap times from driver performance
        base_lap_times = np.full(len(drivers), 100.0)  # Default lap time
        lap_std = np.full(len(drivers), 2.0)  # Default lap std
        
        # Weather effects
        weather_multiplier = 1.0
        if weather_info:
            if weather_info.get('rain', 0) > 0:
                weather_multiplier = 1.08  # Rain increases lap times
                lap_std = lap_std * 1.5    # Rain increases variability
            
            if weather_info.get('temp', 20) > 35:
                weather_multiplier *= 1.05  # High temperature penalty
            elif weather_info.get('temp', 20) < 5:
                weather_multiplier *= 1.03  # Low temperature penalty
        
        # Reliability simulation
        if self.driver_stats is not None:
            # Better performing drivers have slightly better reliability
            mean_points = features_df.get('mean_points_per_race', 0)
            if hasattr(mean_points, 'fillna'):
                mean_points = mean_points.fillna(0)
            reliability = RELIABILITY_BASE + 0.02 * (mean_points / 25)
            reliability = np.clip(reliability, 0.7, 0.995)
        else:
            reliability = np.full(len(drivers), RELIABILITY_BASE)
        
        # Grid advantage (clean air effect)
        grid_advantage = (features_df['grid'].max() - features_df['grid']) * 0.05
        
        # Model probability boost
        model_boost = features_df['win_prob_model'] * (-0.1 * laps)  # High probability drivers get time advantage
        
        # Simulate race
        total_times = []
        finished = []
        
        for i, driver in enumerate(drivers):
            # Reliability check
            if np.random.rand() > reliability[i]:
                total_times.append(1e9)  # DNF
                finished.append(False)
                continue
            
            # Simulate total race time
            mean_time = base_lap_times[i] * laps * weather_multiplier
            std_time = lap_std[i] * np.sqrt(laps)
            
            # Add randomness and apply advantages
            sim_time = np.random.normal(mean_time, std_time)
            sim_time -= grid_advantage.iloc[i] if hasattr(grid_advantage, 'iloc') else grid_advantage[i]
            sim_time += model_boost.iloc[i] if hasattr(model_boost, 'iloc') else model_boost[i]
            
            total_times.append(sim_time)
            finished.append(True)
        
        # Create finishing order
        results = pd.DataFrame({
            'driver': drivers,
            'total_time': total_times,
            'finished': finished
        }).sort_values('total_time').reset_index(drop=True)
        
        return results
    
    def run_monte_carlo(self, grid_df, race_name, weather_info=None, n_trials=N_TRIALS):
        """Run Monte Carlo simulation for race predictions"""
        print(f"\n🎲 Running Monte Carlo simulation for {race_name}")
        print(f"  Grid size: {len(grid_df)} drivers")
        print(f"  Trials: {n_trials}")
        
        # Prepare features
        features_df = self.prepare_grid_features(grid_df, race_name, weather_info)
        if features_df is None:
            return None
        
        drivers = features_df['driver'].tolist()
        
        # Initialize counters
        position_counts = {driver: np.zeros(20) for driver in drivers}
        wins = {driver: 0 for driver in drivers}
        podiums = {driver: 0 for driver in drivers}
        points = {driver: 0 for driver in drivers}
        
        # Run simulations
        for trial in trange(n_trials, desc="Simulating races"):
            results = self.simulate_race_once(features_df, race_name, weather_info)
            
            # Count positions
            for pos, row in enumerate(results.itertuples(), start=1):
                driver = row.driver
                if pos <= 20:
                    position_counts[driver][pos-1] += 1
                
                if pos == 1:
                    wins[driver] += 1
                if pos <= 3:
                    podiums[driver] += 1
                if pos <= 10:
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
        
        print(f"\n✅ Simulation complete!")
        return results_df, features_df
    
    def generate_odds_table(self, results_df, house_margin=0.05):
        """Convert probabilities to betting odds"""
        print(f"\n💰 Generating betting odds (house margin: {house_margin*100:.1f}%)")
        
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
    
    def print_simulation_summary(self, results_df, weather_info=None):
        """Print a summary of simulation results"""
        print(f"\n📊 Simulation Results Summary")
        print("=" * 60)
        
        if weather_info:
            print(f"Weather: {weather_info}")
        
        print(f"\n🏆 Top 10 Win Probabilities:")
        for i, row in results_df.head(10).iterrows():
            print(f"  {i+1:2d}. {row['driver']:<20} {row['win_prob']*100:5.2f}% (P{row['expected_position']:.1f})")
        
        print(f"\n🥉 Podium Probabilities:")
        for i, row in results_df.head(5).iterrows():
            print(f"  {row['driver']:<20} Podium: {row['podium_prob']*100:5.2f}%")
        
        # Calculate model confidence
        top_3_win_prob = results_df.head(3)['win_prob'].sum()
        print(f"\n🎯 Model Confidence: Top 3 combined win probability: {top_3_win_prob*100:.1f}%")

def main():
    """Main function to demonstrate the simulator"""
    print("🏎️  F1 2025 Monte Carlo Race Simulator")
    print("=" * 60)
    
    # Initialize simulator
    simulator = F1MonteCarloSimulator()
    
    if not all([simulator.model, simulator.scaler, simulator.feature_columns]):
        print("❌ Cannot proceed without model and data")
        return
    
    # Example: Create a sample grid for demonstration
    print("\n📋 Creating sample grid for demonstration...")
    
    # Use all 20 drivers from 2025 F1 season
    try:
        # Load actual 2025 driver standings to get the full grid
        driver_standings = pd.read_csv("2025_driver_standings.csv")
        sample_drivers = driver_standings['driver'].tolist()
        constructors = driver_standings['constructor'].tolist()
        
        # Create grid based on current championship standings
        grid_df = pd.DataFrame({
            'driver': sample_drivers,
            'grid': range(1, len(sample_drivers) + 1),
            'constructor': constructors
        })
        print(f"  ✓ Loaded {len(sample_drivers)} drivers from 2025 standings")
    except FileNotFoundError:
        print("  ⚠️  2025_driver_standings.csv not found, using sample drivers")
        # Fallback to sample drivers if file not found
        sample_drivers = [
            "Lando Norris", "Oscar Piastri", "Max Verstappen", "Charles Leclerc",
            "George Russell", "Lewis Hamilton", "Carlos Sainz", "Fernando Alonso",
            "Lance Stroll", "Pierre Gasly", "Esteban Ocon", "Valtteri Bottas",
            "Zhou Guanyu", "Nico Hulkenberg", "Kevin Magnussen", "Yuki Tsunoda",
            "Daniel Ricciardo", "Alexander Albon", "Logan Sargeant", "Oliver Bearman"
        ]
        
        grid_df = pd.DataFrame({
            'driver': sample_drivers,
            'grid': range(1, len(sample_drivers) + 1),
            'constructor': ['McLaren', 'McLaren', 'Red Bull', 'Ferrari', 
                           'Mercedes', 'Mercedes', 'Ferrari', 'Aston Martin',
                           'Aston Martin', 'Alpine', 'Alpine', 'Kick Sauber',
                           'Kick Sauber', 'Haas', 'Haas', 'Racing Bulls',
                           'Racing Bulls', 'Williams', 'Williams', 'Ferrari']
        })
    
    # Example weather conditions
    weather_info = {
        'temp': 22,      # 22°C
        'rain': 0,       # 0% rain chance
        'wind': 15       # 15 km/h wind
    }
    
    # Run simulation
    race_name = "Monaco Grand Prix"
    results_df, features_df = simulator.run_monte_carlo(grid_df, race_name, weather_info, n_trials=2000)
    
    if results_df is not None:
        # Print summary
        simulator.print_simulation_summary(results_df, weather_info)
        
        # Generate odds table
        odds_table = simulator.generate_odds_table(results_df)
        print(f"\n{odds_table.to_string(index=False)}")
        
        # Save results
        results_df.to_csv("monte_carlo_results.csv", index=False)
        odds_table.to_csv("betting_odds.csv", index=False)
        print(f"\n💾 Results saved to monte_carlo_results.csv and betting_odds.csv")
    
    print("\n✅ Simulation demonstration complete!")

if __name__ == "__main__":
    main()
