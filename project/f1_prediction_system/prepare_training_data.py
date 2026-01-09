#!/usr/bin/env python3
"""
Prepare Recency-Weighted Training Data for F1 Prediction Model
Creates features including track-specific performance, recent form, and weather impact
"""

import pandas as pd
import numpy as np
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Configuration
RACES_CSV = "2025_race_results.csv"
QUALI_CSV = "2025_qualifying_results.csv"
DRIVER_STANDINGS_CSV = "2025_driver_standings.csv"
OUTPUT_CSV = "training_data_weighted.csv"
EWMA_ALPHA = 0.4  # Recency weight for EWMA (higher = more weight to recent races)

def load_data():
    """Load all CSV data files"""
    print("📁 Loading data files...")
    
    try:
        race_df = pd.read_csv(RACES_CSV)
        print(f"  ✓ Race results: {len(race_df)} records")
    except FileNotFoundError:
        print(f"  ❌ {RACES_CSV} not found. Run fetch_2025_f1_data.py first.")
        return None, None, None
    
    try:
        quali_df = pd.read_csv(QUALI_CSV)
        print(f"  ✓ Qualifying results: {len(quali_df)} records")
    except FileNotFoundError:
        print(f"  ❌ {QUALI_CSV} not found. Run fetch_2025_f1_data.py first.")
        return None, None, None
    
    try:
        driver_standings = pd.read_csv(DRIVER_STANDINGS_CSV)
        print(f"  ✓ Driver standings: {len(driver_standings)} drivers")
    except FileNotFoundError:
        print(f"  ❌ {DRIVER_STANDINGS_CSV} not found. Run fetch_2025_f1_data.py first.")
        return None, None, None
    
    return race_df, quali_df, driver_standings

def clean_and_prepare_data(race_df, quali_df, driver_standings):
    """Clean and prepare data for feature engineering"""
    print("\n🧹 Cleaning and preparing data...")
    
    # Clean driver names
    race_df['driver'] = race_df['driver'].str.strip()
    quali_df['driver'] = quali_df['driver'].str.strip()
    driver_standings['driver'] = driver_standings['driver'].str.strip()
    
    # Merge qualifying with race results
    print("  Merging qualifying and race data...")
    df = race_df.merge(
        quali_df[["round", "driver", "qualyPosition"]], 
        on=["round", "driver"], 
        how="left"
    )
    
    # Fill missing qualifying positions with grid position
    df['qualyPosition'] = df['qualyPosition'].fillna(df['grid'])
    
    # Calculate qualifying vs grid difference
    df['grid_diff'] = df['grid'] - df['qualyPosition']
    
    # Add driver standings data (rename points to avoid conflict)
    driver_standings_renamed = driver_standings.rename(columns={
        'points': 'total_points',
        'wins': 'total_wins',
        'podiums': 'total_podiums'
    })
    
    df = df.merge(
        driver_standings_renamed[['driver', 'total_points', 'total_wins', 'total_podiums']], 
        on='driver', 
        how='left'
    )
    
    print(f"  ✓ Merged dataset: {len(df)} records")
    return df

def calculate_recency_weights(df):
    """Calculate recency-weighted features using EWMA"""
    print("\n⚖️  Calculating recency weights...")
    
    # Sort by driver and round for proper EWMA calculation
    df = df.sort_values(['driver', 'round'])
    
    # Calculate EWMA for points per race
    def compute_ewma_points(group):
        group = group.copy()
        group['ewma_points'] = group['points'].ewm(alpha=EWMA_ALPHA, adjust=False).mean()
        return group
    
    df = df.groupby('driver', group_keys=False).apply(compute_ewma_points)
    
    # Calculate EWMA for positions (lower is better, so invert)
    def compute_ewma_position(group):
        group = group.copy()
        # Invert position (1st = 20 points, 20th = 1 point) for better EWMA
        group['position_inverted'] = 21 - group['position']
        group['ewma_position'] = group['position_inverted'].ewm(alpha=EWMA_ALPHA, adjust=False).mean()
        return group
    
    df = df.groupby('driver', group_keys=False).apply(compute_ewma_position)
    
    # Get latest EWMA values per driver
    latest_ewma = df.groupby('driver').tail(1)[['driver', 'ewma_points', 'ewma_position']]
    
    print(f"  ✓ Calculated EWMA for {len(latest_ewma)} drivers")
    return df, latest_ewma

def calculate_track_performance(df):
    """Calculate track-specific performance metrics"""
    print("\n🏁 Calculating track-specific performance...")
    
    # Per-track baseline performance
    track_baseline = df.groupby(['driver', 'raceName']).agg({
        'points': ['mean', 'std', 'count'],
        'position': ['mean', 'std'],
        'grid': 'mean',
        'qualyPosition': 'mean'
    }).reset_index()
    
    # Flatten column names
    track_baseline.columns = [
        'driver', 'raceName', 'track_mean_points', 'track_std_points', 'track_races',
        'track_mean_position', 'track_std_position', 'track_mean_grid', 'track_mean_quali'
    ]
    
    # Calculate track consistency (lower std = more consistent)
    track_baseline['track_consistency'] = 1 / (1 + track_baseline['track_std_position'])
    
    # Track-specific qualifying performance
    track_baseline['track_quali_performance'] = 21 - track_baseline['track_mean_quali']
    
    print(f"  ✓ Track performance for {len(track_baseline)} driver-track combinations")
    return track_baseline

def calculate_driver_stats(df):
    """Calculate overall driver statistics"""
    print("\n👤 Calculating driver statistics...")
    
    driver_stats = df.groupby('driver').agg({
        'round': 'nunique',  # Number of races
        'points': ['mean', 'std', 'sum'],
        'position': ['mean', 'std', 'min', 'max'],
        'grid': ['mean', 'std'],
        'qualyPosition': ['mean', 'std'],
        'grid_diff': ['mean', 'std'],
        'total_wins': 'first',
        'total_podiums': 'first'
    }).reset_index()
    
    # Flatten column names
    driver_stats.columns = [
        'driver', 'races_completed', 'mean_points_per_race', 'std_points_per_race', 'total_points',
        'mean_position', 'std_position', 'best_position', 'worst_position',
        'mean_grid', 'std_grid', 'mean_quali_position', 'std_quali_position',
        'mean_grid_diff', 'std_grid_diff', 'total_wins', 'total_podiums'
    ]
    
    # Calculate consistency metrics
    driver_stats['position_consistency'] = 1 / (1 + driver_stats['std_position'])
    driver_stats['quali_consistency'] = 1 / (1 + driver_stats['std_quali_position'])
    driver_stats['grid_consistency'] = 1 / (1 + driver_stats['std_grid'])
    
    # Calculate performance ratios
    driver_stats['win_rate'] = driver_stats['total_wins'] / driver_stats['races_completed']
    driver_stats['podium_rate'] = driver_stats['total_podiums'] / driver_stats['races_completed']
    
    print(f"  ✓ Statistics for {len(driver_stats)} drivers")
    return driver_stats

def create_final_features(df, latest_ewma, track_baseline, driver_stats):
    """Create final feature dataset for training"""
    print("\n🔧 Creating final features...")
    
    # Start with the main dataset
    features = df.copy()
    
    # Add EWMA features - merge with the full dataframe that has EWMA values
    features = df  # Use the dataframe with EWMA values already calculated
    
    # Add track-specific features
    features = features.merge(track_baseline, on=['driver', 'raceName'], how='left')
    
    # Add driver statistics
    features = features.merge(driver_stats, on='driver', how='left')
    
    # Fill missing values
    numeric_columns = features.select_dtypes(include=[np.number]).columns
    features[numeric_columns] = features[numeric_columns].fillna(0)
    
    # Create additional derived features
    features['recent_form_score'] = features['ewma_points'] * features['ewma_position']
    features['track_advantage'] = features['track_mean_points'] - features['mean_points_per_race']
    features['qualifying_advantage'] = features['track_quali_performance'] - features['mean_quali_position']
    
    # Weather impact placeholder (can be enhanced with actual weather data)
    features['weather_impact'] = 1.0  # Neutral weather
    
    # Create target variable for win prediction
    features['is_winner'] = (features['position'] == 1).astype(int)
    features['is_podium'] = (features['position'] <= 3).astype(int)
    features['is_points'] = (features['position'] <= 10).astype(int)
    
    print(f"  ✓ Final features dataset: {len(features)} records, {len(features.columns)} columns")
    return features

def save_training_data(features, track_baseline, driver_stats):
    """Save all training data files"""
    print("\n💾 Saving training data...")
    
    # Save main features dataset
    features.to_csv(OUTPUT_CSV, index=False)
    print(f"  ✓ Main features: {OUTPUT_CSV}")
    
    # Save track baseline data
    track_baseline.to_csv("driver_track_baselines.csv", index=False)
    print(f"  ✓ Track baselines: driver_track_baselines.csv")
    
    # Save driver statistics
    driver_stats.to_csv("driver_statistics.csv", index=False)
    print(f"  ✓ Driver statistics: driver_statistics.csv")
    
    # Save feature summary
    feature_summary = pd.DataFrame({
        'feature': features.columns,
        'type': features.dtypes,
        'non_null_count': features.count(),
        'null_count': features.isnull().sum()
    })
    feature_summary.to_csv("feature_summary.csv", index=False)
    print(f"  ✓ Feature summary: feature_summary.csv")

def main():
    """Main function to prepare training data"""
    print("🏎️  F1 2025 Training Data Preparation")
    print("=" * 50)
    
    # Load data
    race_df, quali_df, driver_standings = load_data()
    if race_df is None:
        return
    
    # Clean and prepare data
    df = clean_and_prepare_data(race_df, quali_df, driver_standings)
    
    # Calculate recency weights
    df, latest_ewma = calculate_recency_weights(df)
    
    # Calculate track performance
    track_baseline = calculate_track_performance(df)
    
    # Calculate driver statistics
    driver_stats = calculate_driver_stats(df)
    
    # Create final features
    features = create_final_features(df, latest_ewma, track_baseline, driver_stats)
    
    # Save all data
    save_training_data(features, track_baseline, driver_stats)
    
    print("\n" + "=" * 50)
    print("📊 Training Data Summary:")
    print(f"  Total Records: {len(features)}")
    print(f"  Total Features: {len(features.columns)}")
    print(f"  Drivers: {features['driver'].nunique()}")
    print(f"  Races: {features['round'].nunique()}")
    print(f"  Winners: {features['is_winner'].sum()}")
    print(f"  Podium Finishes: {features['is_podium'].sum()}")
    
    print("\n✅ Training data preparation complete!")
    print("\nNext steps:")
    print("  1. Review feature_summary.csv for data quality")
    print("  2. Run train_model.py to train the prediction model")
    print("  3. Use monte_carlo_simulator.py for race predictions")

if __name__ == "__main__":
    main()
