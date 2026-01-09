#!/usr/bin/env python3
"""
Generate dynamic predictions for Dutch Grand Prix using ML model and track characteristics
"""

import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from datetime import datetime
import json

def load_ml_model():
    """Load the trained ML model and scaler"""
    model_path = Path(__file__).parent / 'f1_prediction_model.joblib'
    scaler_path = Path(__file__).parent / 'f1_scaler.joblib'
    feature_path = Path(__file__).parent / 'feature_columns.csv'
    
    if model_path.exists() and scaler_path.exists():
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
        print("✅ ML model and scaler loaded successfully")
        
        if feature_path.exists():
            feature_df = pd.read_csv(feature_path)
            feature_columns = feature_df['feature'].tolist()
            print(f"✅ Loaded {len(feature_columns)} feature columns")
            return model, scaler, feature_columns
        else:
            print("⚠️ Feature columns file not found")
            return model, scaler, []
    else:
        print("⚠️ ML model files not found")
        return None, None, []

def load_driver_data():
    """Load driver statistics"""
    stats_path = Path(__file__).parent / 'driver_statistics.csv'
    if stats_path.exists():
        driver_stats = pd.read_csv(stats_path)
        print("✅ Driver statistics loaded")
        return driver_stats
    else:
        print("⚠️ Driver statistics not found")
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
        position = driver_data.get('position', [20]).iloc[0]
        
        # Calculate form score (0-1)
        max_points = 100  # Approximate max points after few races
        position_penalty = (position - 1) * 0.05
        
        form_score = min(1.0, max(0.1, (points / max_points) - position_penalty))
        return form_score
    
    return 0.5

def generate_ml_features(driver_name, driver_stats, feature_columns, track_dominance):
    """Generate ML features for prediction"""
    if not feature_columns:
        return None
    
    # Initialize feature vector with zeros
    features = np.zeros(len(feature_columns))
    
    # Get driver statistics
    driver_data = driver_stats[driver_stats['driver'] == driver_name] if not driver_stats.empty else pd.DataFrame()
    
    # Fill in available features
    for i, feature in enumerate(feature_columns):
        if feature in driver_data.columns and not driver_data.empty:
            features[i] = driver_data[feature].iloc[0]
        elif feature == 'weather_impact':
            # Dutch GP weather impact (moderate)
            features[i] = 0.9
        elif feature == 'track_advantage':
            # Track advantage based on dominance
            track_dominance_score = track_dominance.get(driver_name, {}).get('dominance_score', 0.5)
            features[i] = track_dominance_score
        elif feature == 'recent_form_score':
            # Use season form
            features[i] = calculate_driver_form(driver_name, driver_stats)
        else:
            # Use default values for missing features
            features[i] = 0.5
    
    return features.reshape(1, -1)

def predict_with_ml_model(driver_name, model, scaler, driver_stats, feature_columns, track_dominance):
    """Use ML model to predict win probability"""
    if model is None:
        return None
    
    # Generate features
    features = generate_ml_features(driver_name, driver_stats, feature_columns, track_dominance)
    if features is None:
        return None
    
    # Scale features if scaler is available
    if scaler is not None:
        features = scaler.transform(features)
    
    # Make prediction
    try:
        win_prob = model.predict_proba(features)[0, 1]  # Probability of winning
        return win_prob
    except Exception as e:
        print(f"Error predicting for {driver_name}: {e}")
        return None

def generate_dutch_gp_predictions():
    """Generate comprehensive predictions for Dutch Grand Prix"""
    print("🚀 Generating Dutch Grand Prix predictions...")
    
    # Load ML model and data
    model, scaler, feature_columns = load_ml_model()
    driver_stats = load_driver_data()
    track_dominance = get_driver_track_dominance()
    track_char = get_dutch_gp_characteristics()
    
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
        # Try ML model prediction first
        ml_win_prob = predict_with_ml_model(driver_name, model, scaler, driver_stats, feature_columns, track_dominance)
        
        if ml_win_prob is not None:
            # Use ML model prediction
            win_prob_pct = ml_win_prob * 100
            print(f"ML prediction for {driver_name}: {win_prob_pct:.2f}%")
        else:
            # Fallback to rule-based prediction
            season_form = calculate_driver_form(driver_name, driver_stats)
            track_dominance_score = track_dominance.get(driver_name, {}).get('dominance_score', 0.5)
            team_performance = 0.7  # Default team performance
            
            # Calculate base win probability
            base_prob = (season_form * 0.4 + track_dominance_score * 0.4 + team_performance * 0.2)
            
            # Apply track-specific adjustments
            if track_char["qualifying_importance"] == "high":
                # Qualifying specialists get boost
                if track_dominance.get(driver_name, {}).get('poles', 0) > 0:
                    base_prob *= 1.1
            
            win_prob_pct = base_prob * 100
            print(f"Rule-based prediction for {driver_name}: {win_prob_pct:.2f}%")
        
        # Calculate podium probability (higher than win probability)
        podium_prob_pct = min(100, win_prob_pct * 2.5)
        
        # Get team name
        team = "McLaren" if driver_name in ["Lando Norris", "Oscar Piastri"] else \
               "Red Bull Racing" if driver_name == "Max Verstappen" else \
               "Mercedes" if driver_name in ["George Russell", "Lewis Hamilton"] else \
               "Ferrari" if driver_name in ["Charles Leclerc", "Carlos Sainz"] else \
               "Aston Martin" if driver_name in ["Fernando Alonso", "Lance Stroll"] else \
               "Alpine" if driver_name in ["Pierre Gasly", "Esteban Ocon"] else \
               "Haas" if driver_name in ["Nico Hulkenberg", "Kevin Magnussen"] else \
               "RB" if driver_name in ["Yuki Tsunoda", "Daniel Ricciardo"] else \
               "Williams" if driver_name == "Alexander Albon" else \
               "Kick Sauber" if driver_name in ["Valtteri Bottas", "Zhou Guanyu"] else \
               "—"
        
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
            'predictionMethod': 'ML Model' if ml_win_prob is not None else 'Rule-based'
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
    print("🏁 Dutch Grand Prix Prediction Generator")
    print("=" * 50)
    
    # Generate predictions
    predictions = generate_dutch_gp_predictions()
    
    if not predictions:
        print("❌ Failed to generate predictions")
        return
    
    # Save predictions
    latest_file, timestamped_file, detailed_file = save_predictions(predictions)
    
    # Display top 5 predictions
    print("\n🏆 Top 5 Predictions for Dutch Grand Prix:")
    print("-" * 50)
    for i, pred in enumerate(predictions[:5]):
        print(f"{i+1}. {pred['driverName']} ({pred['team']})")
        print(f"   Win Probability: {pred['winProbPct']:.2f}%")
        print(f"   Podium Probability: {pred['podiumProbPct']:.2f}%")
        print(f"   Track History: {pred['trackHistory']['wins']} wins, {pred['trackHistory']['podiums']} podiums")
        print(f"   Method: {pred['predictionMethod']}")
        print()
    
    print("✅ Dutch Grand Prix predictions generated successfully!")
    print(f"📁 Files saved:")
    print(f"   - Latest: {latest_file}")
    print(f"   - Timestamped: {timestamped_file}")
    print(f"   - Detailed: {detailed_file}")

if __name__ == "__main__":
    main()
