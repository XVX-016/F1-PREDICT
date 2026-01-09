#!/usr/bin/env python3
"""
Generate dynamic predictions for all major F1 tracks
"""

import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
import json
import os

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

def get_track_characteristics():
    """Get characteristics for all major F1 tracks"""
    return {
        "Australian Grand Prix": {
            "type": "permanent_circuit",
            "difficulty": "medium",
            "overtaking": "moderate",
            "qualifying_importance": "high",
            "weather_sensitivity": "medium",
            "dominance_factors": ["high_speed_corners", "aero_efficiency", "tire_management"],
            "track_features": {"corners": 16, "straights": 4, "elevation_changes": "medium", "surface_grip": "high", "runoff_areas": "extensive"}
        },
        "Monaco Grand Prix": {
            "type": "street_circuit",
            "difficulty": "very_high",
            "overtaking": "very_difficult",
            "qualifying_importance": "critical",
            "weather_sensitivity": "high",
            "dominance_factors": ["qualifying_performance", "street_circuit_experience", "precision_driving"],
            "track_features": {"corners": 19, "straights": 2, "elevation_changes": "high", "surface_grip": "medium", "runoff_areas": "minimal"}
        },
        "Dutch Grand Prix": {
            "type": "permanent_circuit",
            "difficulty": "medium",
            "overtaking": "moderate",
            "qualifying_importance": "high",
            "weather_sensitivity": "medium",
            "dominance_factors": ["high_speed_corners", "aero_efficiency", "tire_management"],
            "track_features": {"corners": 14, "straights": 3, "elevation_changes": "medium", "surface_grip": "high", "runoff_areas": "extensive"}
        },
        "British Grand Prix": {
            "type": "permanent_circuit",
            "difficulty": "high",
            "overtaking": "moderate",
            "qualifying_importance": "high",
            "weather_sensitivity": "high",
            "dominance_factors": ["high_speed_corners", "weather_adaptability", "home_advantage"],
            "track_features": {"corners": 18, "straights": 4, "elevation_changes": "high", "surface_grip": "medium", "runoff_areas": "extensive"}
        },
        "Italian Grand Prix": {
            "type": "permanent_circuit",
            "difficulty": "medium",
            "overtaking": "easy",
            "qualifying_importance": "medium",
            "weather_sensitivity": "low",
            "dominance_factors": ["straight_line_speed", "engine_power", "low_downforce_setup"],
            "track_features": {"corners": 11, "straights": 5, "elevation_changes": "low", "surface_grip": "high", "runoff_areas": "extensive"}
        },
        "Singapore Grand Prix": {
            "type": "street_circuit",
            "difficulty": "very_high",
            "overtaking": "very_difficult",
            "qualifying_importance": "critical",
            "weather_sensitivity": "high",
            "dominance_factors": ["street_circuit_experience", "endurance", "precision_driving"],
            "track_features": {"corners": 23, "straights": 2, "elevation_changes": "low", "surface_grip": "medium", "runoff_areas": "minimal"}
        },
        "Spanish Grand Prix": {
            "type": "permanent_circuit",
            "difficulty": "medium",
            "overtaking": "moderate",
            "qualifying_importance": "high",
            "weather_sensitivity": "medium",
            "dominance_factors": ["aero_efficiency", "tire_management", "technical_driving"],
            "track_features": {"corners": 16, "straights": 3, "elevation_changes": "low", "surface_grip": "high", "runoff_areas": "extensive"}
        },
        "Canadian Grand Prix": {
            "type": "permanent_circuit",
            "difficulty": "medium",
            "overtaking": "easy",
            "qualifying_importance": "medium",
            "weather_sensitivity": "medium",
            "dominance_factors": ["braking_performance", "tire_management", "power_unit"],
            "track_features": {"corners": 14, "straights": 4, "elevation_changes": "low", "surface_grip": "medium", "runoff_areas": "extensive"}
        },
        "Austrian Grand Prix": {
            "type": "permanent_circuit",
            "difficulty": "medium",
            "overtaking": "easy",
            "qualifying_importance": "medium",
            "weather_sensitivity": "medium",
            "dominance_factors": ["high_speed_corners", "aero_efficiency", "power_unit"],
            "track_features": {"corners": 10, "straights": 3, "elevation_changes": "high", "surface_grip": "high", "runoff_areas": "extensive"}
        },
        "French Grand Prix": {
            "type": "permanent_circuit",
            "difficulty": "medium",
            "overtaking": "moderate",
            "qualifying_importance": "high",
            "weather_sensitivity": "low",
            "dominance_factors": ["aero_efficiency", "tire_management", "technical_driving"],
            "track_features": {"corners": 15, "straights": 3, "elevation_changes": "low", "surface_grip": "high", "runoff_areas": "extensive"}
        },
        "Belgian Grand Prix": {
            "type": "permanent_circuit",
            "difficulty": "high",
            "overtaking": "moderate",
            "qualifying_importance": "high",
            "weather_sensitivity": "high",
            "dominance_factors": ["high_speed_corners", "weather_adaptability", "aero_efficiency"],
            "track_features": {"corners": 20, "straights": 3, "elevation_changes": "high", "surface_grip": "medium", "runoff_areas": "extensive"}
        },
        "Hungarian Grand Prix": {
            "type": "permanent_circuit",
            "difficulty": "high",
            "overtaking": "difficult",
            "qualifying_importance": "critical",
            "weather_sensitivity": "medium",
            "dominance_factors": ["technical_driving", "tire_management", "aero_efficiency"],
            "track_features": {"corners": 14, "straights": 2, "elevation_changes": "low", "surface_grip": "medium", "runoff_areas": "extensive"}
        },
        "Japanese Grand Prix": {
            "type": "permanent_circuit",
            "difficulty": "high",
            "overtaking": "moderate",
            "qualifying_importance": "high",
            "weather_sensitivity": "high",
            "dominance_factors": ["high_speed_corners", "technical_driving", "weather_adaptability"],
            "track_features": {"corners": 18, "straights": 3, "elevation_changes": "high", "surface_grip": "high", "runoff_areas": "extensive"}
        },
        "United States Grand Prix": {
            "type": "permanent_circuit",
            "difficulty": "medium",
            "overtaking": "easy",
            "qualifying_importance": "medium",
            "weather_sensitivity": "medium",
            "dominance_factors": ["high_speed_corners", "tire_management", "power_unit"],
            "track_features": {"corners": 20, "straights": 3, "elevation_changes": "high", "surface_grip": "high", "runoff_areas": "extensive"}
        },
        "Mexican Grand Prix": {
            "type": "permanent_circuit",
            "difficulty": "medium",
            "overtaking": "moderate",
            "qualifying_importance": "medium",
            "weather_sensitivity": "low",
            "dominance_factors": ["high_speed_corners", "aero_efficiency", "power_unit"],
            "track_features": {"corners": 17, "straights": 3, "elevation_changes": "high", "surface_grip": "medium", "runoff_areas": "extensive"}
        },
        "Brazilian Grand Prix": {
            "type": "permanent_circuit",
            "difficulty": "medium",
            "overtaking": "easy",
            "qualifying_importance": "medium",
            "weather_sensitivity": "high",
            "dominance_factors": ["technical_driving", "tire_management", "weather_adaptability"],
            "track_features": {"corners": 15, "straights": 3, "elevation_changes": "high", "surface_grip": "medium", "runoff_areas": "extensive"}
        },
        "Las Vegas Grand Prix": {
            "type": "street_circuit",
            "difficulty": "high",
            "overtaking": "moderate",
            "qualifying_importance": "high",
            "weather_sensitivity": "low",
            "dominance_factors": ["high_speed_corners", "street_circuit_experience", "power_unit"],
            "track_features": {"corners": 17, "straights": 4, "elevation_changes": "low", "surface_grip": "high", "runoff_areas": "minimal"}
        },
        "Qatar Grand Prix": {
            "type": "permanent_circuit",
            "difficulty": "medium",
            "overtaking": "moderate",
            "qualifying_importance": "high",
            "weather_sensitivity": "medium",
            "dominance_factors": ["high_speed_corners", "aero_efficiency", "tire_management"],
            "track_features": {"corners": 16, "straights": 3, "elevation_changes": "low", "surface_grip": "high", "runoff_areas": "extensive"}
        },
        "Abu Dhabi Grand Prix": {
            "type": "permanent_circuit",
            "difficulty": "medium",
            "overtaking": "moderate",
            "qualifying_importance": "medium",
            "weather_sensitivity": "low",
            "dominance_factors": ["technical_driving", "tire_management", "aero_efficiency"],
            "track_features": {"corners": 21, "straights": 2, "elevation_changes": "low", "surface_grip": "high", "runoff_areas": "extensive"}
        }
    }

def get_driver_track_dominance():
    """Get driver track dominance for all tracks"""
    return {
        "Max Verstappen": {
            "Monaco Grand Prix": {"wins": 2, "poles": 3, "podiums": 4, "dominance_score": 0.85, "avg_position": 2.2},
            "Dutch Grand Prix": {"wins": 3, "poles": 3, "podiums": 3, "dominance_score": 0.95, "avg_position": 1.0},
            "British Grand Prix": {"wins": 1, "poles": 2, "podiums": 3, "dominance_score": 0.75, "avg_position": 3.1},
            "Italian Grand Prix": {"wins": 1, "poles": 1, "podiums": 2, "dominance_score": 0.70, "avg_position": 4.2},
            "Singapore Grand Prix": {"wins": 1, "poles": 1, "podiums": 2, "dominance_score": 0.65, "avg_position": 4.8},
            "Australian Grand Prix": {"wins": 2, "poles": 2, "podiums": 3, "dominance_score": 0.80, "avg_position": 2.5},
            "Spanish Grand Prix": {"wins": 2, "poles": 2, "podiums": 3, "dominance_score": 0.75, "avg_position": 3.0},
            "Canadian Grand Prix": {"wins": 1, "poles": 1, "podiums": 2, "dominance_score": 0.70, "avg_position": 3.5},
            "Austrian Grand Prix": {"wins": 2, "poles": 2, "podiums": 3, "dominance_score": 0.80, "avg_position": 2.8},
            "Belgian Grand Prix": {"wins": 2, "poles": 2, "podiums": 3, "dominance_score": 0.75, "avg_position": 3.2},
            "Japanese Grand Prix": {"wins": 1, "poles": 1, "podiums": 2, "dominance_score": 0.70, "avg_position": 3.8},
            "United States Grand Prix": {"wins": 1, "poles": 1, "podiums": 2, "dominance_score": 0.65, "avg_position": 4.0},
            "Brazilian Grand Prix": {"wins": 1, "poles": 1, "podiums": 2, "dominance_score": 0.70, "avg_position": 3.5},
            "Abu Dhabi Grand Prix": {"wins": 2, "poles": 2, "podiums": 3, "dominance_score": 0.75, "avg_position": 2.8}
        },
        "Lando Norris": {
            "Monaco Grand Prix": {"wins": 0, "poles": 0, "podiums": 1, "dominance_score": 0.45, "avg_position": 8.5},
            "Dutch Grand Prix": {"wins": 0, "poles": 0, "podiums": 2, "dominance_score": 0.60, "avg_position": 6.2},
            "British Grand Prix": {"wins": 0, "poles": 1, "podiums": 1, "dominance_score": 0.55, "avg_position": 7.1},
            "Italian Grand Prix": {"wins": 0, "poles": 0, "podiums": 0, "dominance_score": 0.40, "avg_position": 9.3},
            "Singapore Grand Prix": {"wins": 0, "poles": 0, "podiums": 0, "dominance_score": 0.35, "avg_position": 10.1},
            "Australian Grand Prix": {"wins": 0, "poles": 0, "podiums": 1, "dominance_score": 0.50, "avg_position": 7.5},
            "Spanish Grand Prix": {"wins": 0, "poles": 0, "podiums": 0, "dominance_score": 0.45, "avg_position": 8.2},
            "Canadian Grand Prix": {"wins": 0, "poles": 0, "podiums": 0, "dominance_score": 0.40, "avg_position": 9.0},
            "Austrian Grand Prix": {"wins": 0, "poles": 0, "podiums": 1, "dominance_score": 0.55, "avg_position": 6.8},
            "Belgian Grand Prix": {"wins": 0, "poles": 0, "podiums": 0, "dominance_score": 0.45, "avg_position": 8.5},
            "Japanese Grand Prix": {"wins": 0, "poles": 0, "podiums": 0, "dominance_score": 0.40, "avg_position": 9.2},
            "United States Grand Prix": {"wins": 0, "poles": 0, "podiums": 0, "dominance_score": 0.45, "avg_position": 8.8},
            "Brazilian Grand Prix": {"wins": 0, "poles": 0, "podiums": 0, "dominance_score": 0.40, "avg_position": 9.5},
            "Abu Dhabi Grand Prix": {"wins": 0, "poles": 0, "podiums": 0, "dominance_score": 0.45, "avg_position": 8.3}
        },
        "Lewis Hamilton": {
            "Monaco Grand Prix": {"wins": 3, "poles": 3, "podiums": 5, "dominance_score": 0.80, "avg_position": 2.8},
            "Dutch Grand Prix": {"wins": 0, "poles": 0, "podiums": 1, "dominance_score": 0.45, "avg_position": 8.9},
            "British Grand Prix": {"wins": 8, "poles": 7, "podiums": 12, "dominance_score": 0.90, "avg_position": 1.9},
            "Italian Grand Prix": {"wins": 5, "poles": 4, "podiums": 8, "dominance_score": 0.85, "avg_position": 2.4},
            "Singapore Grand Prix": {"wins": 4, "poles": 3, "podiums": 6, "dominance_score": 0.80, "avg_position": 2.7},
            "Australian Grand Prix": {"wins": 2, "poles": 2, "podiums": 4, "dominance_score": 0.75, "avg_position": 3.2},
            "Spanish Grand Prix": {"wins": 6, "poles": 5, "podiums": 8, "dominance_score": 0.85, "avg_position": 2.5},
            "Canadian Grand Prix": {"wins": 7, "poles": 6, "podiums": 9, "dominance_score": 0.90, "avg_position": 2.1},
            "Austrian Grand Prix": {"wins": 1, "poles": 1, "podiums": 3, "dominance_score": 0.65, "avg_position": 4.5},
            "Belgian Grand Prix": {"wins": 4, "poles": 3, "podiums": 6, "dominance_score": 0.80, "avg_position": 3.0},
            "Japanese Grand Prix": {"wins": 1, "poles": 1, "podiums": 2, "dominance_score": 0.60, "avg_position": 5.2},
            "United States Grand Prix": {"wins": 6, "poles": 5, "podiums": 8, "dominance_score": 0.85, "avg_position": 2.8},
            "Brazilian Grand Prix": {"wins": 3, "poles": 2, "podiums": 5, "dominance_score": 0.75, "avg_position": 3.5},
            "Abu Dhabi Grand Prix": {"wins": 5, "poles": 4, "podiums": 7, "dominance_score": 0.80, "avg_position": 2.9}
        },
        "Charles Leclerc": {
            "Monaco Grand Prix": {"wins": 1, "poles": 2, "podiums": 2, "dominance_score": 0.70, "avg_position": 3.5},
            "Dutch Grand Prix": {"wins": 0, "poles": 0, "podiums": 1, "dominance_score": 0.50, "avg_position": 7.8},
            "British Grand Prix": {"wins": 0, "poles": 1, "podiums": 2, "dominance_score": 0.60, "avg_position": 6.5},
            "Italian Grand Prix": {"wins": 1, "poles": 1, "podiums": 3, "dominance_score": 0.75, "avg_position": 4.1},
            "Singapore Grand Prix": {"wins": 0, "poles": 0, "podiums": 1, "dominance_score": 0.45, "avg_position": 8.2},
            "Australian Grand Prix": {"wins": 0, "poles": 1, "podiums": 1, "dominance_score": 0.55, "avg_position": 6.8},
            "Spanish Grand Prix": {"wins": 1, "poles": 2, "podiums": 2, "dominance_score": 0.65, "avg_position": 5.5},
            "Canadian Grand Prix": {"wins": 0, "poles": 0, "podiums": 1, "dominance_score": 0.50, "avg_position": 7.2},
            "Austrian Grand Prix": {"wins": 0, "poles": 0, "podiums": 1, "dominance_score": 0.55, "avg_position": 6.5},
            "Belgian Grand Prix": {"wins": 0, "poles": 0, "podiums": 1, "dominance_score": 0.50, "avg_position": 7.8},
            "Japanese Grand Prix": {"wins": 0, "poles": 0, "podiums": 0, "dominance_score": 0.45, "avg_position": 8.5},
            "United States Grand Prix": {"wins": 0, "poles": 0, "podiums": 1, "dominance_score": 0.50, "avg_position": 7.5},
            "Brazilian Grand Prix": {"wins": 0, "poles": 0, "podiums": 1, "dominance_score": 0.50, "avg_position": 7.2},
            "Abu Dhabi Grand Prix": {"wins": 0, "poles": 0, "podiums": 1, "dominance_score": 0.50, "avg_position": 7.0}
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
    track_dominance_score = track_dominance.get(driver_name, {}).get(track_char.get('name', ''), {}).get('dominance_score', 0.5)
    
    # Get team performance
    team = get_driver_team(driver_name)
    team_perf = team_performance.get(team, 0.5)
    
    # Base probability calculation
    base_prob = (season_form * 0.35 + track_dominance_score * 0.35 + team_perf * 0.30)
    
    # Apply track-specific adjustments
    if track_char["qualifying_importance"] == "critical":
        # Qualifying specialists get boost
        if track_dominance.get(driver_name, {}).get(track_char.get('name', ''), {}).get('poles', 0) > 0:
            base_prob *= 1.1
        
        # High qualifying performance drivers get boost
        if driver_name in ["Max Verstappen", "Charles Leclerc", "Lewis Hamilton"]:
            base_prob *= 1.05
    
    # Weather sensitivity adjustments
    if track_char["weather_sensitivity"] == "high":
        # Some drivers are better in variable conditions
        if driver_name in ["Max Verstappen", "Lewis Hamilton"]:
            base_prob *= 1.02
    
    # Home advantage
    if "British" in track_char.get('name', '') and "Hamilton" in driver_name:
        base_prob *= 1.15  # Hamilton has home advantage at British GP
    elif "Dutch" in track_char.get('name', '') and "Verstappen" in driver_name:
        base_prob *= 1.15  # Verstappen has home advantage at Dutch GP
    elif "Italian" in track_char.get('name', '') and "Leclerc" in driver_name:
        base_prob *= 1.10  # Leclerc has home advantage at Italian GP
    
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

def generate_predictions_for_track(race_name, driver_stats, track_dominance, team_performance, track_char):
    """Generate predictions for a specific track"""
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
        
        # Calculate podium probability (higher than win probability)
        podium_prob_pct = min(100, win_prob_pct * 2.5)
        
        # Get team name
        team = get_driver_team(driver_name)
        
        # Track history
        track_history = track_dominance.get(driver_name, {}).get(race_name, {
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

def save_predictions(predictions, race_name):
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
    
    return latest_file, timestamped_file

def main():
    """Main function to generate predictions for all tracks"""
    print("🏁 All Track Prediction Generator")
    print("=" * 60)
    
    # Load data
    driver_stats = load_driver_data()
    track_dominance = get_driver_track_dominance()
    team_performance = get_team_performance()
    track_characteristics = get_track_characteristics()
    
    # Generate predictions for each track
    for race_name, track_char in track_characteristics.items():
        print(f"\n🚀 Generating predictions for {race_name}...")
        
        # Add race name to track characteristics for reference
        track_char['name'] = race_name
        
        # Generate predictions
        predictions = generate_predictions_for_track(race_name, driver_stats, track_dominance, team_performance, track_char)
        
        if predictions:
            # Save predictions
            latest_file, timestamped_file = save_predictions(predictions, race_name)
            
            # Display top 3 predictions
            print(f"🏆 Top 3 Predictions for {race_name}:")
            for i, pred in enumerate(predictions[:3]):
                print(f"   {i+1}. {pred['driverName']} ({pred['team']}) - {pred['winProbPct']:.2f}%")
        else:
            print(f"❌ Failed to generate predictions for {race_name}")
    
    print("\n✅ All track predictions generated successfully!")

if __name__ == "__main__":
    main()
