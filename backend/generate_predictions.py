#!/usr/bin/env python3
"""
Generate Predictions from the Hybrid Prediction System
This script demonstrates how to use the hybrid prediction system to generate
comprehensive race predictions with ML models, calibration factors, and live data.
"""

import asyncio
import sys
import os
from datetime import datetime

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def generate_next_race_predictions():
    """Generate predictions for the next upcoming race"""
    print("🏁 GENERATING NEXT RACE PREDICTIONS")
    print("=" * 60)
    
    try:
        from services.HybridPredictionService import HybridPredictionService
        
        # Initialize the hybrid prediction service
        hybrid_service = HybridPredictionService()
        print("✅ Hybrid prediction service initialized")
        
        # Generate predictions for the next race
        print("🎯 Generating predictions for next race...")
        race_prediction = await hybrid_service.predict_next_race()
        
        # Display race information
        print(f"\n📍 Race: {race_prediction.race}")
        print(f"🏁 Round: {race_prediction.round}")
        print(f"📅 Season: {race_prediction.season}")
        print(f"📅 Date: {race_prediction.date}")
        print(f"🏎️ Track Type: {race_prediction.track_type}")
        print(f"🌤️ Weather: {race_prediction.weather_conditions.get('condition', 'Unknown')}")
        print(f"🤖 Model Version: {race_prediction.model_version}")
        print(f"⏰ Generated: {race_prediction.generated_at}")
        
        # Display predictions
        print(f"\n🏆 TOP 10 PREDICTIONS:")
        print("-" * 60)
        
        for i, driver_pred in enumerate(race_prediction.predictions[:10], 1):
            driver_name = driver_pred.driverName
            constructor = driver_pred.constructor
            probability = driver_pred.probability * 100
            confidence = driver_pred.confidence * 100
            
            # Highlight top 3
            if i <= 3:
                print(f"🥇 {i}. {driver_name} ({constructor})")
            else:
                print(f"   {i}. {driver_name} ({constructor})")
            
            print(f"      🏁 Win Probability: {probability:.1f}%")
            print(f"      🎯 Confidence: {confidence:.1f}%")
            
            # Show additional metadata if available
            if driver_pred.qualifying_position:
                print(f"      🏎️ Qualifying: P{driver_pred.qualifying_position}")
            if driver_pred.season_points > 0:
                print(f"      📊 Season Points: {driver_pred.season_points}")
            if driver_pred.track_history != 1.0:
                print(f"      🏁 Track History: {driver_pred.track_history:.2f}x")
            if driver_pred.weather_factor != 1.0:
                print(f"      🌤️ Weather Factor: {driver_pred.weather_factor:.2f}x")
            
            print()
        
        # Show model statistics
        total_drivers = len(race_prediction.predictions)
        avg_confidence = sum(p.confidence for p in race_prediction.predictions) / total_drivers
        print(f"📊 Model Statistics:")
        print(f"   Total Drivers: {total_drivers}")
        print(f"   Average Confidence: {avg_confidence:.1%}")
        print(f"   Top Driver Probability: {race_prediction.predictions[0].probability:.1%}")
        
        return race_prediction
        
    except Exception as e:
        print(f"❌ Error generating next race predictions: {e}")
        import traceback
        traceback.print_exc()
        return None

async def generate_specific_race_predictions(race_identifier: str):
    """Generate predictions for a specific race"""
    print(f"\n🏁 GENERATING PREDICTIONS FOR: {race_identifier.upper()}")
    print("=" * 60)
    
    try:
        from services.HybridPredictionService import HybridPredictionService
        
        # Initialize the hybrid prediction service
        hybrid_service = HybridPredictionService()
        print("✅ Hybrid prediction service initialized")
        
        # Generate predictions for the specific race
        print(f"🎯 Generating predictions for {race_identifier}...")
        race_prediction = await hybrid_service.predict_race(race_identifier)
        
        # Display race information
        print(f"\n📍 Race: {race_prediction.race}")
        print(f"🏁 Round: {race_prediction.round}")
        print(f"📅 Season: {race_prediction.season}")
        print(f"📅 Date: {race_prediction.date}")
        print(f"🏎️ Track Type: {race_prediction.track_type}")
        print(f"🌤️ Weather: {race_prediction.weather_conditions.get('condition', 'Unknown')}")
        
        # Display top 5 predictions
        print(f"\n🏆 TOP 5 PREDICTIONS:")
        print("-" * 60)
        
        for i, driver_pred in enumerate(race_prediction.predictions[:5], 1):
            driver_name = driver_pred.driverName
            constructor = driver_pred.constructor
            probability = driver_pred.probability * 100
            confidence = driver_pred.confidence * 100
            
            print(f"{i}. {driver_name} ({constructor})")
            print(f"   🏁 Win Probability: {probability:.1f}%")
            print(f"   🎯 Confidence: {confidence:.1f}%")
            print()
        
        return race_prediction
        
    except Exception as e:
        print(f"❌ Error generating predictions for {race_identifier}: {e}")
        import traceback
        traceback.print_exc()
        return None

async def generate_multiple_race_predictions():
    """Generate predictions for multiple races"""
    print("\n🏁 GENERATING MULTIPLE RACE PREDICTIONS")
    print("=" * 60)
    
    # List of races to predict
    races = [
        "Monaco Grand Prix",
        "Monza",
        "Silverstone",
        "Spa-Francorchamps"
    ]
    
    results = {}
    
    for race in races:
        try:
            print(f"\n🎯 Predicting {race}...")
            prediction = await generate_specific_race_predictions(race)
            if prediction:
                results[race] = prediction
                print(f"✅ {race}: {prediction.predictions[0].driverName} favored ({prediction.predictions[0].probability:.1%})")
            else:
                print(f"❌ Failed to generate predictions for {race}")
        except Exception as e:
            print(f"❌ Error with {race}: {e}")
    
    return results

async def main():
    """Main function to run all prediction generation"""
    print("🚀 F1 HYBRID PREDICTION SYSTEM")
    print("=" * 60)
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Generate next race predictions
        next_race_pred = await generate_next_race_predictions()
        
        if next_race_pred:
            print(f"\n✅ Successfully generated next race predictions for {next_race_pred.race}")
        
        # Generate specific race predictions
        print("\n" + "="*60)
        monaco_pred = await generate_specific_race_predictions("Monaco Grand Prix")
        
        if monaco_pred:
            print(f"✅ Successfully generated Monaco predictions")
        
        # Generate multiple race predictions
        print("\n" + "="*60)
        multiple_preds = await generate_multiple_race_predictions()
        
        print(f"\n📊 SUMMARY:")
        print(f"   Next Race: {'✅' if next_race_pred else '❌'}")
        print(f"   Monaco: {'✅' if monaco_pred else '❌'}")
        print(f"   Multiple Races: {len(multiple_preds)}/4 generated")
        
        print(f"\n🎉 Prediction generation completed!")
        print(f"⏰ Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
    except Exception as e:
        print(f"❌ Main execution failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Run the async main function
    asyncio.run(main())
