#!/usr/bin/env python3
"""
Generate dynamic predictions for Dutch Grand Prix using track characteristics and driver statistics
(Simplified version without ML model dependencies)
"""

import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
import json

def load_driver_data():
    """Load driver statistics"""
    stats_path = Path(__file__).parent / 'driver_statistics.csv'
    if stats_path.exists():
        driver_stats = pd.read_csv(stats_path)
        print("✅ Driver statistics loaded")
        return driver_stats
    else:
        print("⚠️ Driver statistics not found, using default values")
        return pd.DataFrame()

def get_dutch_gp_characteristics():
    """Get Dutch Grand Prix track characteristics"""
    return {
        "type": "permanent_circuit",
        "difficulty": "medium",
        "overtaking": "moderate",
        "qualifying_importance": "high",
        "weather_sensitivity": "medium",
        "dominance_factors": ["high_speed_corners", "aero_efficiency", "tire_management"],
        "track_features": {
            "corners": 14,
            "straights": 3,
            "elevation_changes": "medium",
            "surface_grip": "high",
            "runoff_areas": "extensive"
        }
    }

def get_driver_track_dominance():
    """Get driver track dominance for Dutch GP"""
    return {
        "Max Verstappen": {
            "wins": 3, "poles": 3, "podiums": 3, 
            "dominance_score": 0.95, "avg_position": 1.0
        },
        "Lando Norris": {
            "wins": 0, "poles": 0, "podiums": 2, 
            "dominance_score": 0.60, "avg_position": 6.2
        },
        "Lewis Hamilton": {
            "wins": 0, "poles": 0, "podiums": 1, 
            "dominance_score": 0.45, "avg_position": 8.9
        },
        "Charles Leclerc": {
            "wins": 0, "poles": 0, "podiums": 1, 
            "dominance_score": 0.50, "avg_position": 7.8
        },
        "George Russell": {
            "wins": 0, "poles": 0, "podiums": 0, 
            "dominance_score": 0.40, "avg_position": 9.5
        },
        "Oscar Piastri": {
            "wins": 0, "poles": 0, "podiums": 0, 
            "dominance_score": 0.35, "avg_position": 10.2
        },
        "Carlos Sainz": {
            "wins": 0, "poles": 0, "podiums": 0, 
            "dominance_score": 0.45, "avg_position": 8.5
        },
        "Fernando Alonso": {
            "wins": 0, "poles": 0, "podiums": 0, 
            "dominance_score": 0.40, "avg_position": 9.0
        }
    }

def calculate_driver_form(driver_name, driver_stats):
    """Calculate driver's current form"""
    if driver_stats.empty:
        return 0.5
    
    driver_data = driver_stats[driver_stats['driver'] == driver_name]
    if driver_data.empty:
        return 0.5
    
    # Get recent form score if available
    if 'recent_form_score' in driver_data.columns:
        form_score = driver_data['recent_form_score'].iloc[0]
        return max(0.1, min(1.0, form_score))
    
    # Fallback calculation
    if 'total_points' in driver_data.columns:
        points = driver_data['total_points'].iloc[0]
        position = driver_data.get('position', pd.Series([20])).iloc[0]
        
        # Calculate form score (0-1)
        max_points = 100  # Approximate max points after few races
        position_penalty = (position - 1) * 0.05
        
        form_score = min(1.0, max(0.1, (points / max_points) - position_penalty))
        return form_score
    
    return 0.5

def get_team_performance():
    """Get current team performance rankings"""
    return {
        "Red Bull Racing": 0.95,
        "McLaren": 0.85,
        "Ferrari": 0.80,
        "Mercedes": 0.75,
        "Aston Martin": 0.65,
        "Alpine": 0.55,
        "Haas": 0.45,
        "RB": 0.50,
        "Williams": 0.40,
        "Kick Sauber": 0.35
    }

def calculate_win_probability(driver_name, driver_stats, track_dominance, team_performance, track_char):
    """Calculate win probability using rule-based approach"""
    # Get driver form
    season_form = calculate_driver_form(driver_name, driver_stats)
    
    # Get track dominance
    track_dominance_score = track_dominance.get(driver_name, {}).get('dominance_score', 0.5)
    
    # Get team performance
    team = get_driver_team(driver_name)
    team_perf = team_performance.get(team, 0.5)
    
    # Base probability calculation
    base_prob = (season_form * 0.35 + track_dominance_score * 0.35 + team_perf * 0.30)
    
    # Apply track-specific adjustments
    if track_char["qualifying_importance"] == "high":
        # Qualifying specialists get boost
        if track_dominance.get(driver_name, {}).get('poles', 0) > 0:
            base_prob *= 1.1
        
        # High qualifying performance drivers get boost
        if driver_name in ["Max Verstappen", "Charles Leclerc", "Lewis Hamilton"]:
            base_prob *= 1.05
    
    # Weather sensitivity adjustments (Dutch GP is medium sensitivity)
    if track_char["weather_sensitivity"] == "medium":
        # Some drivers are better in variable conditions
        if driver_name in ["Max Verstappen", "Lewis Hamilton"]:
            base_prob *= 1.02
    
    # Home advantage for Dutch drivers
    if "Verstappen" in driver_name:
        base_prob *= 1.15  # Max has home advantage at Dutch GP
    
    # Add some randomness for variety (±5%)
    random_factor = 0.95 + np.random.random() * 0.1
    base_prob *= random_factor
    
    return max(0.1, min(1.0, base_prob))

def get_driver_team(driver_name):
    """Get driver's team"""
    team_map = {
        "Max Verstappen": "Red Bull Racing",
        "Lando Norris": "McLaren",
        "Oscar Piastri": "McLaren",
        "George Russell": "Mercedes",
        "Lewis Hamilton": "Ferrari",
        "Charles Leclerc": "Ferrari",
        "Carlos Sainz": "Williams",
        "Fernando Alonso": "Aston Martin",
        "Lance Stroll": "Aston Martin",
        "Pierre Gasly": "Alpine",
        "Esteban Ocon": "Alpine",
        "Nico Hulkenberg": "Haas",
        "Kevin Magnussen": "Haas",
        "Yuki Tsunoda": "RB",
        "Daniel Ricciardo": "RB",
        "Alexander Albon": "Williams",
        "Valtteri Bottas": "Kick Sauber",
        "Zhou Guanyu": "Kick Sauber",
        "Andrea Kimi Antonelli": "Mercedes",
        "Oliver Bearman": "Haas"
    }
    return team_map.get(driver_name, "—")

def generate_dutch_gp_predictions():
    """Generate comprehensive predictions for Dutch Grand Prix"""
    print("🚀 Generating Dutch Grand Prix predictions...")
    
    # Load data
    driver_stats = load_driver_data()
    track_dominance = get_driver_track_dominance()
    track_char = get_dutch_gp_characteristics()
    team_performance = get_team_performance()
    
    # Base driver list (top 20 from 2025 standings)
    base_drivers = [
        "Max Verstappen", "Lando Norris", "Oscar Piastri", "George Russell", 
        "Lewis Hamilton", "Charles Leclerc", "Carlos Sainz", "Fernando Alonso",
        "Lance Stroll", "Pierre Gasly", "Esteban Ocon", "Nico Hulkenberg",
        "Kevin Magnussen", "Yuki Tsunoda", "Daniel Ricciardo", "Alexander Albon",
        "Valtteri Bottas", "Zhou Guanyu", "Andrea Kimi Antonelli", "Oliver Bearman"
    ]
    
    predictions = []
    
    for i, driver_name in enumerate(base_drivers):
        # Calculate win probability
        win_prob = calculate_win_probability(driver_name, driver_stats, track_dominance, team_performance, track_char)
        win_prob_pct = win_prob * 100
        
        print(f"Prediction for {driver_name}: {win_prob_pct:.2f}%")
        
        # Calculate podium probability (higher than win probability)
        podium_prob_pct = min(100, win_prob_pct * 2.5)
        
        # Get team name
        team = get_driver_team(driver_name)
        
        # Track history
        track_history = track_dominance.get(driver_name, {
            "wins": 0, "poles": 0, "podiums": 0, "avg_position": 10.0
        })
        
        prediction = {
            'driverId': str(i + 1),
            'driverName': driver_name,
            'team': team,
            'winProbPct': round(win_prob_pct, 2),
            'podiumProbPct': round(podium_prob_pct, 2),
            'position': i + 1,
            'trackHistory': track_history,
            'seasonForm': round(calculate_driver_form(driver_name, driver_stats), 3),
            'predictionMethod': 'Rule-based'
        }
        
        predictions.append(prediction)
    
    # Sort by win probability and reassign positions
    predictions.sort(key=lambda x: x['winProbPct'], reverse=True)
    for i, pred in enumerate(predictions):
        pred['position'] = i + 1
    
    # Normalize probabilities to sum to ~100%
    total_prob = sum(p['winProbPct'] for p in predictions)
    if total_prob > 0:
        for pred in predictions:
            pred['winProbPct'] = round((pred['winProbPct'] / total_prob) * 100, 2)
    
    return predictions

def save_predictions(predictions, race_name="Dutch Grand Prix"):
    """Save predictions to CSV file"""
    # Create DataFrame
    df = pd.DataFrame(predictions)
    
    # Select columns for CSV
    csv_columns = ['driverName', 'team', 'winProbPct', 'podiumProbPct', 'position']
    df_csv = df[csv_columns].copy()
    
    # Save to final_predictions directory
    output_dir = Path(__file__).parent / 'final_predictions'
    output_dir.mkdir(exist_ok=True)
    
    # Save latest version
    latest_file = output_dir / f"latest_{race_name}.csv"
    df_csv.to_csv(latest_file, index=False)
    print(f"✅ Saved latest predictions to {latest_file}")
    
    # Save timestamped version
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    timestamped_file = output_dir / f"results_{race_name}_{timestamp}.csv"
    df_csv.to_csv(timestamped_file, index=False)
    print(f"✅ Saved timestamped predictions to {timestamped_file}")
    
    # Save detailed version with all metadata
    detailed_file = output_dir / f"detailed_{race_name}_{timestamp}.json"
    with open(detailed_file, 'w') as f:
        json.dump({
            'race_name': race_name,
            'generated_at': datetime.now().isoformat(),
            'track_characteristics': get_dutch_gp_characteristics(),
            'predictions': predictions
        }, f, indent=2)
    print(f"✅ Saved detailed predictions to {detailed_file}")
    
    return latest_file, timestamped_file, detailed_file

def main():
    """Main function to generate and save Dutch GP predictions"""
    print("🏁 Dutch Grand Prix Prediction Generator (Simplified)")
    print("=" * 60)
    
    # Generate predictions
    predictions = generate_dutch_gp_predictions()
    
    if not predictions:
        print("❌ Failed to generate predictions")
        return
    
    # Save predictions
    latest_file, timestamped_file, detailed_file = save_predictions(predictions)
    
    # Display top 5 predictions
    print("\n🏆 Top 5 Predictions for Dutch Grand Prix:")
    print("-" * 60)
    for i, pred in enumerate(predictions[:5]):
        print(f"{i+1}. {pred['driverName']} ({pred['team']})")
        print(f"   Win Probability: {pred['winProbPct']:.2f}%")
        print(f"   Podium Probability: {pred['podiumProbPct']:.2f}%")
        print(f"   Track History: {pred['trackHistory']['wins']} wins, {pred['trackHistory']['podiums']} podiums")
        print(f"   Season Form: {pred['seasonForm']:.3f}")
        print(f"   Method: {pred['predictionMethod']}")
        print()
    
    print("✅ Dutch Grand Prix predictions generated successfully!")
    print(f"📁 Files saved:")
    print(f"   - Latest: {latest_file}")
    print(f"   - Timestamped: {timestamped_file}")
    print(f"   - Detailed: {detailed_file}")

if __name__ == "__main__":
    main()
