#!/usr/bin/env python3
"""
Comparison Analysis: Independent vs Sequential Probability Approaches
Shows the improvement from constrained race simulation
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

def load_and_compare_results():
    """Load and compare old vs new simulation results"""
    print("🔍 Comparing Independent vs Sequential Probability Approaches")
    print("=" * 70)
    
    # Load old results (independent probabilities)
    try:
        old_results = pd.read_csv("monte_carlo_results.csv")
        print("  ✓ Loaded old Monte Carlo results (independent probabilities)")
    except FileNotFoundError:
        print("  ❌ monte_carlo_results.csv not found")
        return None, None
    
    # Load new results (sequential sampling)
    try:
        new_results = pd.read_csv("enhanced_monte_carlo_results.csv")
        print("  ✓ Loaded enhanced Monte Carlo results (sequential sampling)")
    except FileNotFoundError:
        print("  ❌ enhanced_monte_carlo_results.csv not found")
        return None, None
    
    return old_results, new_results

def analyze_probability_distributions(old_results, new_results):
    """Analyze the probability distributions"""
    print("\n📊 Probability Distribution Analysis")
    print("-" * 50)
    
    # Check total win probabilities
    old_total = old_results['win_prob'].sum()
    new_total = new_results['win_prob'].sum()
    
    print(f"Old Approach (Independent):")
    print(f"  Total win probability: {old_total*100:.2f}%")
    print(f"  Probability constraint valid: {'❌' if old_total != 1.0 else '✅'}")
    
    print(f"\nNew Approach (Sequential):")
    print(f"  Total win probability: {new_total*100:.2f}%")
    print(f"  Probability constraint valid: {'❌' if new_total != 1.0 else '✅'}")
    
    # Check probability spread
    old_spread = old_results['win_prob'].max() - old_results['win_prob'].min()
    new_spread = new_results['win_prob'].max() - new_results['win_prob'].min()
    
    print(f"\nProbability Spread Analysis:")
    print(f"  Old approach spread: {old_spread*100:.2f}%")
    print(f"  New approach spread: {new_spread*100:.2f}%")
    print(f"  Spread reduction: {((old_spread - new_spread) / old_spread * 100):.1f}%")
    
    return old_total, new_total, old_spread, new_spread

def compare_driver_rankings(old_results, new_results):
    """Compare driver rankings between approaches"""
    print("\n🏆 Driver Ranking Comparison")
    print("-" * 50)
    
    # Merge results for comparison
    comparison = old_results[['driver', 'win_prob']].merge(
        new_results[['driver', 'win_prob']], 
        on='driver', 
        suffixes=('_old', '_new')
    )
    
    # Calculate ranking changes
    comparison['rank_old'] = comparison['win_prob_old'].rank(ascending=False)
    comparison['rank_new'] = comparison['win_prob_new'].rank(ascending=False)
    comparison['rank_change'] = comparison['rank_old'] - comparison['rank_new']
    
    # Show top 10 changes
    print("Top 10 Drivers by Win Probability:")
    print("Driver                Old Prob  New Prob  Rank Change")
    print("-" * 55)
    
    for _, row in comparison.head(10).iterrows():
        rank_symbol = "↑" if row['rank_change'] > 0 else "↓" if row['rank_change'] < 0 else "="
        print(f"{row['driver']:<20} {row['win_prob_old']*100:6.2f}%   {row['win_prob_new']*100:6.2f}%   {rank_symbol}")
    
    # Show biggest rank changes
    print(f"\nBiggest Ranking Changes:")
    biggest_changes = comparison.sort_values('rank_change', key=abs, ascending=False).head(5)
    for _, row in biggest_changes.iterrows():
        change = int(row['rank_change'])
        direction = "up" if change > 0 else "down"
        print(f"  {row['driver']}: {abs(change)} positions {direction}")
    
    return comparison

def create_comparison_visualizations(old_results, new_results, comparison):
    """Create visualizations comparing the two approaches"""
    print("\n📈 Creating comparison visualizations...")
    
    try:
        # Set up the plotting style
        plt.style.use('seaborn-v0_8')
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle('Independent vs Sequential Probability Approaches', fontsize=16, fontweight='bold')
        
        # 1. Win probability comparison
        top_drivers = comparison.head(10)
        x = np.arange(len(top_drivers))
        width = 0.35
        
        bars1 = axes[0, 0].bar(x - width/2, top_drivers['win_prob_old']*100, width, 
                               label='Independent (Old)', alpha=0.7, color='lightcoral')
        bars2 = axes[0, 0].bar(x + width/2, top_drivers['win_prob_new']*100, width, 
                               label='Sequential (New)', alpha=0.7, color='lightblue')
        
        axes[0, 0].set_title('Win Probability Comparison (Top 10)')
        axes[0, 0].set_xlabel('Driver')
        axes[0, 0].set_ylabel('Win Probability (%)')
        axes[0, 0].set_xticks(x)
        axes[0, 0].set_xticklabels(top_drivers['driver'], rotation=45, ha='right')
        axes[0, 0].legend()
        axes[0, 0].grid(True, alpha=0.3)
        
        # 2. Probability distribution validation
        total_probs = [old_results['win_prob'].sum()*100, new_results['win_prob'].sum()*100]
        approaches = ['Independent', 'Sequential']
        colors = ['lightcoral', 'lightblue']
        
        bars = axes[0, 1].bar(approaches, total_probs, color=colors, alpha=0.7)
        axes[0, 1].set_title('Total Win Probability (Should be 100%)')
        axes[0, 1].set_ylabel('Total Probability (%)')
        axes[0, 1].axhline(y=100, color='red', linestyle='--', alpha=0.7, label='Target (100%)')
        
        # Add value labels on bars
        for bar, value in zip(bars, total_probs):
            height = bar.get_height()
            axes[0, 1].text(bar.get_x() + bar.get_width()/2., height + 0.5,
                           f'{value:.1f}%', ha='center', va='bottom')
        axes[0, 1].legend()
        axes[0, 1].grid(True, alpha=0.3)
        
        # 3. Ranking changes
        rank_changes = comparison['rank_change'].value_counts().sort_index()
        colors = ['red' if x < 0 else 'blue' if x > 0 else 'green' for x in rank_changes.index]
        
        axes[1, 0].bar(range(len(rank_changes)), rank_changes.values, color=colors, alpha=0.7)
        axes[1, 0].set_title('Driver Ranking Changes')
        axes[1, 0].set_xlabel('Rank Change (Negative = Worse, Positive = Better)')
        axes[1, 0].set_ylabel('Number of Drivers')
        axes[1, 0].set_xticks(range(len(rank_changes)))
        axes[1, 0].set_xticklabels([f"{int(x)}" for x in rank_changes.index])
        axes[1, 0].grid(True, alpha=0.3)
        
        # 4. Probability spread comparison
        spreads = [old_results['win_prob'].max() - old_results['win_prob'].min(),
                  new_results['win_prob'].max() - new_results['win_prob'].min()]
        spread_labels = ['Independent', 'Sequential']
        
        bars = axes[1, 1].bar(spread_labels, [s*100 for s in spreads], 
                              color=['lightcoral', 'lightblue'], alpha=0.7)
        axes[1, 1].set_title('Probability Spread (Lower is Better)')
        axes[1, 1].set_ylabel('Spread (%)')
        
        # Add value labels on bars
        for bar, value in zip(bars, [s*100 for s in spreads]):
            height = bar.get_height()
            axes[1, 1].text(bar.get_x() + bar.get_width()/2., height + 0.1,
                           f'{value:.2f}%', ha='center', va='bottom')
        axes[1, 1].grid(True, alpha=0.3)
        
        plt.tight_layout()
        
        # Save the plot
        plot_filename = "probability_approaches_comparison.png"
        plt.savefig(plot_filename, dpi=300, bbox_inches='tight')
        print(f"  💾 Comparison plot saved as {plot_filename}")
        
        plt.show()
        
    except Exception as e:
        print(f"  ⚠️  Could not create plots: {e}")

def print_improvement_summary(old_total, new_total, old_spread, new_spread, comparison):
    """Print a summary of improvements"""
    print("\n" + "="*70)
    print("🎯 IMPROVEMENT SUMMARY")
    print("="*70)
    
    print(f"\n✅ Probability Constraint Validation:")
    print(f"  Old approach: {old_total*100:.2f}% {'❌' if old_total != 1.0 else '✅'}")
    print(f"  New approach: {new_total*100:.2f}% {'❌' if new_total != 1.0 else '✅'}")
    
    print(f"\n📊 Probability Distribution Quality:")
    print(f"  Old approach spread: {old_spread*100:.2f}%")
    print(f"  New approach spread: {new_spread*100:.2f}%")
    print(f"  Improvement: {((old_spread - new_spread) / old_spread * 100):.1f}% reduction")
    
    print(f"\n🏆 Driver Ranking Stability:")
    drivers_improved = (comparison['rank_change'] > 0).sum()
    drivers_worsened = (comparison['rank_change'] < 0).sum()
    drivers_unchanged = (comparison['rank_change'] == 0).sum()
    
    print(f"  Drivers improved: {drivers_improved}")
    print(f"  Drivers worsened: {drivers_worsened}")
    print(f"  Drivers unchanged: {drivers_unchanged}")
    
    print(f"\n💡 Key Benefits of Sequential Approach:")
    print(f"  • Enforces realistic race constraints (only one winner)")
    print(f"  • Generates proper betting odds")
    print(f"  • Provides position-specific probabilities")
    print(f"  • More accurate for race simulation")
    
    print(f"\n📈 Next Steps:")
    print(f"  • Use enhanced simulator for all race predictions")
    print(f"  • Generate multi-race predictions with new approach")
    print(f"  • Update evaluation metrics with constrained probabilities")

def main():
    """Main function to run the comparison analysis"""
    print("🏎️  F1 Prediction Model: Approach Comparison Analysis")
    print("=" * 70)
    
    # Load results
    old_results, new_results = load_and_compare_results()
    if old_results is None or new_results is None:
        return
    
    # Analyze probability distributions
    old_total, new_total, old_spread, new_spread = analyze_probability_distributions(
        old_results, new_results
    )
    
    # Compare driver rankings
    comparison = compare_driver_rankings(old_results, new_results)
    
    # Create visualizations
    create_comparison_visualizations(old_results, new_results, comparison)
    
    # Print improvement summary
    print_improvement_summary(old_total, new_total, old_spread, new_spread, comparison)
    
    # Save comparison data
    comparison.to_csv("probability_approaches_comparison.csv", index=False)
    print(f"\n💾 Comparison data saved to probability_approaches_comparison.csv")
    
    print("\n✅ Comparison analysis complete!")

if __name__ == "__main__":
    main()
