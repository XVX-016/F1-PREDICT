#!/usr/bin/env python3
"""
Generate Monte Carlo predictions for multiple F1 races
This enables proper model evaluation across different tracks
"""

import pandas as pd
import numpy as np
from monte_carlo_simulator import F1MonteCarloSimulator
import warnings
warnings.filterwarnings('ignore')

def generate_predictions_for_multiple_races():
    """Generate predictions for multiple races to enable evaluation"""
    print("🏎️  Generating Multi-Race Monte Carlo Predictions")
    print("=" * 60)
    
    # Initialize simulator
    simulator = F1MonteCarloSimulator()
    
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
    
    # Define races to simulate (using actual 2025 F1 calendar)
    races = [
        "Bahrain Grand Prix",
        "Saudi Arabian Grand Prix", 
        "Australian Grand Prix",
        "Japanese Grand Prix",
        "Chinese Grand Prix",
        "Miami Grand Prix",
        "Emilia Romagna Grand Prix",
        "Monaco Grand Prix",
        "Canadian Grand Prix",
        "Spanish Grand Prix"
    ]
    
    # Weather conditions for each race (simplified)
    weather_conditions = {
        "Bahrain Grand Prix": {'temp': 25, 'rain': 0, 'wind': 20},
        "Saudi Arabian Grand Prix": {'temp': 30, 'rain': 0, 'wind': 15},
        "Australian Grand Prix": {'temp': 22, 'rain': 0.1, 'wind': 25},
        "Japanese Grand Prix": {'temp': 18, 'rain': 0.3, 'wind': 30},
        "Chinese Grand Prix": {'temp': 20, 'rain': 0.2, 'wind': 18},
        "Miami Grand Prix": {'temp': 28, 'rain': 0.4, 'wind': 22},
        "Emilia Romagna Grand Prix": {'temp': 19, 'rain': 0.5, 'wind': 20},
        "Monaco Grand Prix": {'temp': 22, 'rain': 0.1, 'wind': 15},
        "Canadian Grand Prix": {'temp': 18, 'rain': 0.6, 'wind': 25},
        "Spanish Grand Prix": {'temp': 24, 'rain': 0.1, 'wind': 20}
    }
    
    all_predictions = []
    
    for i, race_name in enumerate(races):
        print(f"\n🏁 Simulating {race_name} ({i+1}/{len(races)})")
        
        # Create grid for this race (based on championship standings)
        grid_df = pd.DataFrame({
            'driver': drivers,
            'grid': range(1, len(drivers) + 1),
            'constructor': constructors
        })
        
        # Get weather for this race
        weather_info = weather_conditions.get(race_name, {'temp': 22, 'rain': 0, 'wind': 20})
        
        # Run simulation
        results_df, features_df = simulator.run_monte_carlo(
            grid_df, race_name, weather_info, n_trials=1000  # Reduced trials for speed
        )
        
        if results_df is not None:
            # Add race information
            results_df['race'] = race_name
            
            # Select key columns for evaluation
            prediction_data = results_df[['driver', 'race', 'win_prob', 'podium_prob', 'expected_position']].copy()
            
            all_predictions.append(prediction_data)
            print(f"  ✅ Generated predictions for {race_name}")
        else:
            print(f"  ❌ Failed to generate predictions for {race_name}")
    
    if all_predictions:
        # Combine all predictions
        combined_predictions = pd.concat(all_predictions, ignore_index=True)
        
        # Save combined predictions
        combined_predictions.to_csv("multi_race_predictions.csv", index=False)
        print(f"\n💾 Saved {len(combined_predictions)} predictions to multi_race_predictions.csv")
        
        # Print summary
        print(f"\n📊 Prediction Summary:")
        print(f"  Total Predictions: {len(combined_predictions)}")
        print(f"  Races Simulated: {len(races)}")
        print(f"  Drivers per Race: {len(drivers)}")
        
        # Show top predictions by race
        for race in races[:5]:  # Show first 5 races
            race_preds = combined_predictions[combined_predictions['race'] == race]
            if not race_preds.empty:
                top_driver = race_preds.loc[race_preds['win_prob'].idxmax()]
                print(f"  {race}: {top_driver['driver']} ({top_driver['win_prob']*100:.1f}%)")
        
        return combined_predictions
    else:
        print("❌ No predictions generated")
        return None

def main():
    """Main function"""
    predictions = generate_predictions_for_multiple_races()
    
    if predictions is not None:
        print("\n✅ Multi-race predictions complete!")
        print("\nNext steps:")
        print("  1. Run evaluate_predictions_auto.py to evaluate model performance")
        print("  2. Review multi_race_predictions.csv for detailed predictions")
    else:
        print("\n❌ Failed to generate multi-race predictions")

if __name__ == "__main__":
    main()
