#!/usr/bin/env python3
"""
Demo script for the F1 Hybrid Prediction System
Shows realistic race predictions with live data integration
"""

import os
import sys
from datetime import datetime

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def demo_monza_predictions():
    """Demo Monza predictions with Ferrari home advantage"""
    print("🏁 MONZA GRAND PRIX PREDICTIONS")
    print("=" * 50)
    
    try:
        # Import without Firebase dependencies
        import sys
        sys.modules['main'] = type(sys)('main')
        sys.modules['main'].predict_race_winner_probabilities = lambda *args: None
        sys.modules['main'].load_race_model = lambda: False
        
        from services.PredictionService import prediction_service
        
        result = prediction_service.get_race_predictions("Monza", 2025)
        
        print(f"📍 Circuit: {result['race']['circuit']}")
        print(f"📅 Season: {result['race']['season']}")
        print(f"📊 Data Source: {result['live_data']['data_source']}")
        print(f"🤖 ML Model: {'✅ Used' if result['metadata']['ml_model_used'] else '⚠️ Fallback'}")
        print()
        
        print("🏆 TOP 5 PREDICTIONS:")
        print("-" * 50)
        
        for i, pred in enumerate(result["predictions"][:5], 1):
            driver = pred["driver"]
            team = pred["team"]
            win_prob = pred["win_probability"] * 100
            podium_prob = pred["podium_probability"] * 100
            quali_pos = pred["qualifying_position"]
            points = pred["season_points"]
            
            # Highlight Ferrari at Monza
            if team == "Ferrari":
                print(f"🇮🇹 {i}. {driver} ({team})")
            else:
                print(f"   {i}. {driver} ({team})")
            
            print(f"      🏁 Win: {win_prob:.1f}% | 🏆 Podium: {podium_prob:.1f}%")
            print(f"      🏎️ Qualifying: P{quali_pos} | 📊 Season Points: {points}")
            
            # Show calibration factors
            factors = pred["calibration_factors"]
            print(f"      ⚙️  Calibration: Track={factors['track_factor']:.2f}, Driver={factors['driver_factor']:.2f}")
            print()
        
        # Show Ferrari advantage
        ferrari_pred = next((p for p in result["predictions"] if p["team"] == "Ferrari"), None)
        if ferrari_pred:
            track_factor = ferrari_pred["calibration_factors"]["track_factor"]
            print(f"🇮🇹 Ferrari Home Advantage: +{(track_factor-1)*100:.0f}% boost at Monza!")
            print()
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")

def demo_monaco_predictions():
    """Demo Monaco predictions with qualifying importance"""
    print("🏎️ MONACO GRAND PRIX PREDICTIONS")
    print("=" * 50)
    
    try:
        import sys
        sys.modules['main'] = type(sys)('main')
        sys.modules['main'].predict_race_winner_probabilities = lambda *args: None
        sys.modules['main'].load_race_model = lambda: False
        
        from services.PredictionService import prediction_service
        
        result = prediction_service.get_race_predictions("Monaco", 2025)
        
        print(f"📍 Circuit: {result['race']['circuit']}")
        print(f"📊 Data Source: {result['live_data']['data_source']}")
        print()
        
        print("🏆 TOP 5 PREDICTIONS (Monaco - Qualifying Critical):")
        print("-" * 50)
        
        for i, pred in enumerate(result["predictions"][:5], 1):
            driver = pred["driver"]
            team = pred["team"]
            win_prob = pred["win_probability"] * 100
            quali_pos = pred["qualifying_position"]
            
            # Highlight pole position
            if quali_pos == 1:
                print(f"🥇 {i}. {driver} ({team}) - POLE POSITION!")
            else:
                print(f"   {i}. {driver} ({team})")
            
            print(f"      🏁 Win: {win_prob:.1f}% | 🏎️ Qualifying: P{quali_pos}")
            
            # Show qualifying factor
            quali_factor = pred["calibration_factors"]["qualifying_factor"]
            if quali_factor > 1.0:
                print(f"      ⚡ Qualifying Bonus: +{(quali_factor-1)*100:.0f}%")
            print()
        
        print("💡 Monaco Insight: Qualifying position is crucial due to limited overtaking!")
        print()
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")

def demo_silverstone_predictions():
    """Demo Silverstone predictions with McLaren home advantage"""
    print("🇬🇧 SILVERSTONE GRAND PRIX PREDICTIONS")
    print("=" * 50)
    
    try:
        import sys
        sys.modules['main'] = type(sys)('main')
        sys.modules['main'].predict_race_winner_probabilities = lambda *args: None
        sys.modules['main'].load_race_model = lambda: False
        
        from services.PredictionService import prediction_service
        
        result = prediction_service.get_race_predictions("Silverstone", 2025)
        
        print(f"📍 Circuit: {result['race']['circuit']}")
        print(f"📊 Data Source: {result['live_data']['data_source']}")
        print()
        
        print("🏆 TOP 5 PREDICTIONS:")
        print("-" * 50)
        
        for i, pred in enumerate(result["predictions"][:5], 1):
            driver = pred["driver"]
            team = pred["team"]
            win_prob = pred["win_probability"] * 100
            podium_prob = pred["podium_probability"] * 100
            
            # Highlight McLaren at Silverstone
            if team == "McLaren":
                print(f"🇬🇧 {i}. {driver} ({team}) - BRITISH TEAM!")
            else:
                print(f"   {i}. {driver} ({team})")
            
            print(f"      🏁 Win: {win_prob:.1f}% | 🏆 Podium: {podium_prob:.1f}%")
            
            # Show track factor
            track_factor = pred["calibration_factors"]["track_factor"]
            if track_factor > 1.0:
                print(f"      🏠 Home Advantage: +{(track_factor-1)*100:.0f}%")
            print()
        
        # Show McLaren advantage
        mclaren_pred = next((p for p in result["predictions"] if p["team"] == "McLaren"), None)
        if mclaren_pred:
            track_factor = mclaren_pred["calibration_factors"]["track_factor"]
            print(f"🇬🇧 McLaren Home Advantage: +{(track_factor-1)*100:.0f}% boost at Silverstone!")
            print()
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")

def demo_comparison():
    """Compare predictions across different circuits"""
    print("📊 CIRCUIT COMPARISON")
    print("=" * 50)
    
    try:
        import sys
        sys.modules['main'] = type(sys)('main')
        sys.modules['main'].predict_race_winner_probabilities = lambda *args: None
        sys.modules['main'].load_race_model = lambda: False
        
        from services.PredictionService import prediction_service
        
        circuits = ["Monza", "Monaco", "Silverstone", "Spa"]
        
        print("🏆 VERSTAPPEN WIN PROBABILITY BY CIRCUIT:")
        print("-" * 50)
        
        for circuit in circuits:
            result = prediction_service.get_race_predictions(circuit, 2025)
            verstappen_pred = next((p for p in result["predictions"] if p["driver"] == "Max Verstappen"), None)
            
            if verstappen_pred:
                win_prob = verstappen_pred["win_probability"] * 100
                track_factor = verstappen_pred["calibration_factors"]["track_factor"]
                
                print(f"📍 {circuit}: {win_prob:.1f}% (Track Factor: {track_factor:.2f})")
        
        print()
        print("🏆 FERRARI PERFORMANCE BY CIRCUIT:")
        print("-" * 50)
        
        for circuit in circuits:
            result = prediction_service.get_race_predictions(circuit, 2025)
            ferrari_pred = next((p for p in result["predictions"] if p["team"] == "Ferrari"), None)
            
            if ferrari_pred:
                driver = ferrari_pred["driver"]
                win_prob = ferrari_pred["win_probability"] * 100
                track_factor = ferrari_pred["calibration_factors"]["track_factor"]
                
                print(f"📍 {circuit}: {driver} - {win_prob:.1f}% (Track Factor: {track_factor:.2f})")
        
        print()
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")

def main():
    """Run all demos"""
    print("🚀 F1 Hybrid Prediction System Demo")
    print("=" * 60)
    print()
    
    demos = [
        ("Monza Predictions", demo_monza_predictions),
        ("Monaco Predictions", demo_monaco_predictions),
        ("Silverstone Predictions", demo_silverstone_predictions),
        ("Circuit Comparison", demo_comparison)
    ]
    
    for demo_name, demo_func in demos:
        try:
            demo_func()
            print("\n" + "=" * 60 + "\n")
        except Exception as e:
            print(f"❌ {demo_name} failed: {e}")
            print()
    
    print("🎯 Demo Complete!")
    print("📝 Next steps:")
    print("   1. Get a Jolpica API key for live 2024/2025 data")
    print("   2. Run: python setup_env.py")
    print("   3. Test with real API data")
    print("   4. Integrate with your frontend!")

if __name__ == "__main__":
    main()

