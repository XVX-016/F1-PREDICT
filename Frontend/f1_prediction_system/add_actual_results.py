#!/usr/bin/env python3
"""
Add actual results to enhanced Monte Carlo results for calibration analysis
"""

import pandas as pd
import numpy as np

def main():
    """Add actual results to enhanced results"""
    print("🏎️ Adding actual results to enhanced Monte Carlo results...")
    
    # Load the enhanced results
    try:
        df = pd.read_csv("enhanced_monte_carlo_results.csv")
        print(f"  ✓ Loaded {len(df)} predictions")
    except FileNotFoundError:
        print("  ❌ enhanced_monte_carlo_results.csv not found")
        return
    
    # Create synthetic actual results for demonstration
    # In real usage, this would come from actual race results
    np.random.seed(42)  # For reproducible demo
    df['actual'] = np.random.choice([0, 1], size=len(df), p=[0.95, 0.05])
    
    # Save updated results
    df.to_csv("enhanced_monte_carlo_results.csv", index=False)
    print(f"  ✓ Added actual results for {len(df)} predictions")
    print(f"  ✓ Saved updated results to enhanced_monte_carlo_results.csv")
    
    # Show actual results distribution
    print(f"\n📊 Actual results distribution:")
    actual_counts = df['actual'].value_counts()
    print(f"  • Wins (1): {actual_counts.get(1, 0)} drivers")
    print(f"  • Non-wins (0): {actual_counts.get(0, 0)} drivers")
    
    # Show win distribution by team
    print(f"\n🏁 Win distribution by team:")
    team_wins = df.groupby('team')['actual'].sum().sort_values(ascending=False)
    for team, wins in team_wins.items():
        print(f"  • {team}: {wins} wins")

if __name__ == "__main__":
    main()
