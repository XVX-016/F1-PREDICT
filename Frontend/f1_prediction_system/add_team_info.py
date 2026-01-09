#!/usr/bin/env python3
"""
Add team information to enhanced Monte Carlo results
"""

import pandas as pd

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


def main():
    """Add team information to enhanced results"""
    print("🏎️ Adding team information to enhanced Monte Carlo results...")
    
    # Load the enhanced results
    try:
        df = pd.read_csv("enhanced_monte_carlo_results.csv")
        print(f"  ✓ Loaded {len(df)} predictions")
    except FileNotFoundError:
        print("  ❌ enhanced_monte_carlo_results.csv not found")
        return
    
    # Add team information
    driver_team_map = get_driver_team_mapping()
    df['team'] = df['driver'].map(driver_team_map)
    
    # Check for any missing teams
    missing_teams = df[df['team'].isna()]
    if not missing_teams.empty:
        print(f"  ⚠️  {len(missing_teams)} drivers without team info:")
        for driver in missing_teams['driver'].unique():
            print(f"    • {driver}")
    
    # Save updated results
    df.to_csv("enhanced_monte_carlo_results.csv", index=False)
    print(f"  ✓ Added team information for {len(df)} predictions")
    print(f"  ✓ Saved updated results to enhanced_monte_carlo_results.csv")
    
    # Show team distribution
    print(f"\n📊 Team distribution:")
    team_counts = df['team'].value_counts()
    for team, count in team_counts.items():
        print(f"  • {team}: {count} drivers")

if __name__ == "__main__":
    main()
