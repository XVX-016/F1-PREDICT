#!/usr/bin/env python3
"""
Build Pairwise Comparison Dataset for Bradley-Terry Model
Converts race results into head-to-head driver comparisons
"""

import pandas as pd
import numpy as np
from pathlib import Path
import json

# File paths
RACE_RESULTS_FILE = "2025_race_results.csv"
QUALIFYING_RESULTS_FILE = "2025_qualifying_results.csv"
DRIVER_STATS_FILE = "driver_statistics.csv"
OUTPUT_FILE = "pairwise_comparisons.csv"
METADATA_FILE = "pairwise_dataset_metadata.json"

def load_race_data():
    """Load race and qualifying results"""
    print("Loading race data...")
    
    try:
        race_results = pd.read_csv(RACE_RESULTS_FILE)
        print(f"  Race results loaded: {len(race_results)} records")
    except FileNotFoundError:
        print(f"  {RACE_RESULTS_FILE} not found")
        return None, None
    
    try:
        qualifying_results = pd.read_csv(QUALIFYING_RESULTS_FILE)
        print(f"  Qualifying results loaded: {len(qualifying_results)} records")
    except FileNotFoundError:
        print(f"  {QUALIFYING_RESULTS_FILE} not found")
        qualifying_results = None
    
    return race_results, qualifying_results

def create_pairwise_comparisons(race_results, qualifying_results=None):
    """Create pairwise driver comparisons from race results"""
    print("Creating pairwise comparisons...")
    
    pairwise_data = []
    
    # Group by race
    for race_name, race_group in race_results.groupby('raceName'):
        print(f"  Processing {race_name}...")
        
        # Sort by finishing position
        race_group = race_group.sort_values('position').reset_index(drop=True)
        
        # Create all pairwise comparisons
        for i in range(len(race_group)):
            for j in range(i + 1, len(race_group)):
                driver1 = race_group.iloc[i]
                driver2 = race_group.iloc[j]
                
                # Determine winner (lower position wins)
                if driver1['position'] < driver2['position']:
                    winner = driver1['driver']
                    loser = driver2['driver']
                    winner_pos = driver1['position']
                    loser_pos = driver2['position']
                    winner_team = driver1['constructor']
                    loser_team = driver2['constructor']
                else:
                    winner = driver2['driver']
                    loser = driver1['driver']
                    winner_pos = driver2['position']
                    loser_pos = driver1['position']
                    winner_team = driver2['constructor']
                    loser_team = driver1['constructor']
                
                # Calculate margin of victory (position difference)
                margin = abs(driver1['position'] - driver2['position'])
                
                # Add qualifying context if available
                qualifying_context = {}
                if qualifying_results is not None:
                    quali_race = qualifying_results[qualifying_results['raceName'] == race_name]
                    if len(quali_race) > 0:
                        quali_race = quali_race.sort_values('qualyPosition').reset_index(drop=True)
                        
                        # Find qualifying positions
                        winner_quali = quali_race[quali_race['driver'] == winner]
                        loser_quali = quali_race[quali_race['driver'] == loser]
                        
                        if len(winner_quali) > 0 and len(loser_quali) > 0:
                            winner_quali_pos = winner_quali.iloc[0]['qualyPosition']
                            loser_quali_pos = loser_quali.iloc[0]['qualyPosition']
                            quali_margin = abs(winner_quali_pos - loser_quali_pos)
                            
                            qualifying_context = {
                                'winner_quali_position': winner_quali_pos,
                                'loser_quali_position': loser_quali_pos,
                                'quali_margin': quali_margin,
                                'grid_advantage': winner_quali_pos < loser_quali_pos
                            }
                
                # Create comparison record
                comparison = {
                    'race': race_name,
                    'winner': winner,
                    'loser': loser,
                    'winner_team': winner_team,
                    'loser_team': loser_team,
                    'winner_position': winner_pos,
                    'loser_position': loser_pos,
                    'margin': margin,
                    'same_team': winner_team == loser_team,
                    'top_10_finish': winner_pos <= 10 and loser_pos <= 10,
                    'podium_finish': winner_pos <= 3 or loser_pos <= 3
                }
                
                # Add qualifying context
                comparison.update(qualifying_context)
                
                pairwise_data.append(comparison)
    
    print(f"  Created {len(pairwise_data)} pairwise comparisons")
    return pd.DataFrame(pairwise_data)

def add_driver_statistics(pairwise_df, driver_stats):
    """Add driver statistics to pairwise comparisons"""
    print("Adding driver statistics...")
    
    if driver_stats is None:
        print("  No driver statistics available")
        return pairwise_df
    
    # Merge winner stats
    pairwise_df = pairwise_df.merge(
        driver_stats, 
        left_on='winner', 
        right_on='driver', 
        how='left',
        suffixes=('', '_winner')
    )
    
    # Merge loser stats
    pairwise_df = pairwise_df.merge(
        driver_stats, 
        left_on='loser', 
        right_on='driver', 
        how='left',
        suffixes=('_winner', '_loser')
    )
    
    # Calculate relative statistics
    numeric_cols = driver_stats.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        if col != 'driver':
            pairwise_df[f'{col}_diff'] = (
                pairwise_df[f'{col}_winner'] - pairwise_df[f'{col}_loser']
            )
    
    print(f"  Added statistics for {len(numeric_cols)} features")
    return pairwise_df

def create_race_features(pairwise_df):
    """Create race-specific features for pairwise comparisons"""
    print("Creating race-specific features...")
    
    # Race-level statistics
    race_stats = pairwise_df.groupby('race').agg({
        'margin': ['mean', 'std', 'min', 'max'],
        'same_team': 'sum',
        'top_10_finish': 'sum',
        'podium_finish': 'sum'
    }).reset_index()
    
    race_stats.columns = [
        'race', 'avg_margin', 'std_margin', 'min_margin', 'max_margin',
        'intra_team_battles', 'top_10_battles', 'podium_battles'
    ]
    
    # Merge back to pairwise data
    pairwise_df = pairwise_df.merge(race_stats, on='race', how='left')
    
    # Normalize margins by race
    pairwise_df['margin_normalized'] = (
        (pairwise_df['margin'] - pairwise_df['avg_margin']) / 
        (pairwise_df['std_margin'] + 1e-8)
    )
    
    print("  Added race-level features")
    return pairwise_df

def calculate_pairwise_metrics(pairwise_df):
    """Calculate pairwise comparison metrics"""
    print("Calculating pairwise metrics...")
    
    # Driver win rates
    driver_wins = pairwise_df['winner'].value_counts()
    driver_losses = pairwise_df['loser'].value_counts()
    
    # Combine wins and losses
    driver_records = pd.DataFrame({
        'driver': driver_wins.index,
        'wins': driver_wins.values,
        'losses': driver_losses.get(driver_wins.index, 0)
    })
    
    driver_records['total_battles'] = driver_records['wins'] + driver_records['losses']
    driver_records['win_rate'] = driver_records['wins'] / driver_records['total_battles']
    
    # Team performance
    team_wins = pairwise_df['winner_team'].value_counts()
    team_losses = pairwise_df['loser_team'].value_counts()
    
    team_records = pd.DataFrame({
        'team': team_wins.index,
        'wins': team_wins.values,
        'losses': team_losses.get(team_wins.index, 0)
    })
    
    team_records['total_battles'] = team_records['wins'] + team_records['losses']
    team_records['win_rate'] = team_records['wins'] / team_records['total_battles']
    
    # Head-to-head records
    h2h_records = pairwise_df.groupby(['winner', 'loser']).size().reset_index(name='wins')
    h2h_records = h2h_records.merge(
        pairwise_df.groupby(['loser', 'winner']).size().reset_index(name='losses'),
        left_on=['winner', 'loser'],
        right_on=['loser', 'winner'],
        how='outer'
    ).fillna(0)
    
    h2h_records['total_battles'] = h2h_records['wins'] + h2h_records['losses']
    h2h_records['winner_win_rate'] = h2h_records['wins'] / h2h_records['total_battles']
    
    metrics = {
        'driver_records': driver_records.sort_values('win_rate', ascending=False),
        'team_records': team_records.sort_values('win_rate', ascending=False),
        'head_to_head': h2h_records.sort_values('total_battles', ascending=False)
    }
    
    print(f"  Calculated metrics for {len(driver_records)} drivers")
    return metrics

def save_results(pairwise_df, metrics):
    """Save pairwise dataset and metrics"""
    print("Saving results...")
    
    # Save main dataset
    pairwise_df.to_csv(OUTPUT_FILE, index=False)
    print(f"  Pairwise dataset saved to: {OUTPUT_FILE}")
    
    # Save metrics
    for name, data in metrics.items():
        metric_file = f"pairwise_{name}.csv"
        data.to_csv(metric_file, index=False)
        print(f"  {name} saved to: {metric_file}")
    
    # Save metadata
    metadata = {
        'dataset_info': {
            'total_comparisons': len(pairwise_df),
            'unique_races': pairwise_df['race'].nunique(),
            'unique_drivers': len(set(pairwise_df['winner'].unique()) | set(pairwise_df['loser'].unique())),
            'unique_teams': len(set(pairwise_df['winner_team'].unique()) | set(pairwise_df['loser_team'].unique()))
        },
        'feature_columns': pairwise_df.columns.tolist(),
        'race_list': pairwise_df['race'].unique().tolist(),
        'driver_list': sorted(list(set(pairwise_df['winner'].unique()) | set(pairwise_df['loser'].unique()))),
        'team_list': sorted(list(set(pairwise_df['winner_team'].unique()) | set(pairwise_df['loser_team'].unique())))
    }
    
    with open(METADATA_FILE, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"  Metadata saved to: {METADATA_FILE}")

def main():
    """Main pipeline for building pairwise dataset"""
    print("Building Pairwise Comparison Dataset for Bradley-Terry Model")
    print("=" * 70)
    
    # Load data
    race_results, qualifying_results = load_race_data()
    if race_results is None:
        print("Failed to load race data. Exiting.")
        return
    
    # Load driver statistics if available
    try:
        driver_stats = pd.read_csv(DRIVER_STATS_FILE)
        print(f"Driver statistics loaded: {len(driver_stats)} drivers")
    except FileNotFoundError:
        print(f"{DRIVER_STATS_FILE} not found. Driver stats will be limited.")
        driver_stats = None
    
    # Create pairwise comparisons
    pairwise_df = create_pairwise_comparisons(race_results, qualifying_results)
    
    # Add driver statistics
    if driver_stats is not None:
        pairwise_df = add_driver_statistics(pairwise_df, driver_stats)
    
    # Add race features
    pairwise_df = create_race_features(pairwise_df)
    
    # Calculate metrics
    metrics = calculate_pairwise_metrics(pairwise_df)
    
    # Save results
    save_results(pairwise_df, metrics)
    
    print("\nPairwise dataset construction completed!")
    print(f"Dataset shape: {pairwise_df.shape}")
    print(f"Features: {len(pairwise_df.columns)}")
    
    # Print summary statistics
    print("\nDataset Summary:")
    print(f"  Total comparisons: {len(pairwise_df)}")
    print(f"  Races covered: {pairwise_df['race'].nunique()}")
    print(f"  Drivers: {len(set(pairwise_df['winner'].unique()) | set(pairwise_df['loser'].unique()))}")
    print(f"  Teams: {len(set(pairwise_df['winner_team'].unique()) | set(pairwise_df['loser_team'].unique()))}")
    
    # Show top drivers by win rate
    print("\nTop 5 Drivers by Win Rate:")
    top_drivers = metrics['driver_records'].head(5)
    for _, driver in top_drivers.iterrows():
        print(f"  {driver['driver']}: {driver['win_rate']:.3f} ({driver['wins']}-{driver['losses']})")

if __name__ == "__main__":
    main()
