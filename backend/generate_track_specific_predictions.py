#!/usr/bin/env python3
"""
Generate Track-Specific Predictions for All Grand Prix
This script uses the TrackSpecificPredictionService to generate comprehensive
predictions for each Grand Prix with all factors including McLaren dominance.
"""

import asyncio
import sys
import os
import json
from datetime import datetime
from pathlib import Path

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def generate_all_grand_prix_predictions():
    """Generate track-specific predictions for all Grand Prix in the 2025 season"""
    print("🏁 GENERATING TRACK-SPECIFIC PREDICTIONS FOR ALL GRAND PRIX")
    print("=" * 80)
    
    try:
        from services.TrackSpecificPredictionService import TrackSpecificPredictionService
        
        # Initialize the track-specific prediction service
        service = TrackSpecificPredictionService()
        print("✅ Track-specific prediction service initialized")
        
        # Generate predictions for all Grand Prix
        print("\n🎯 Generating predictions for all Grand Prix...")
        all_predictions = await service.predict_all_grand_prix()
        
        print(f"\n✅ Generated predictions for {len(all_predictions)} Grand Prix")
        
        # Display summary for each race
        for i, prediction in enumerate(all_predictions, 1):
            print(f"\n🏆 ROUND {prediction.round}: {prediction.race_name.upper()}")
            print(f"📍 Circuit: {prediction.circuit}")
            print(f"📅 Date: {prediction.date}")
            print(f"🏁 Track Type: {prediction.track_type}")
            print(f"🌤️ Weather: {prediction.weather_condition}")
            print(f"🔄 Expected Pace: {prediction.expected_race_pace}")
            
            # Show top 5 predictions
            sorted_predictions = sorted(
                prediction.driver_predictions, 
                key=lambda x: x.win_probability, 
                reverse=True
            )
            
            print(f"\n🏆 TOP 5 PREDICTIONS:")
            print("-" * 50)
            
            for j, driver_pred in enumerate(sorted_predictions[:5], 1):
                win_prob = driver_pred.win_probability * 100
                constructor = driver_pred.constructor
                
                # Highlight McLaren drivers
                if "McLaren" in constructor:
                    print(f"🥇 {j}. {driver_pred.driver_name} ({constructor}) - {win_prob:.1f}% 🚀")
                else:
                    print(f"   {j}. {driver_pred.driver_name} ({constructor}) - {win_prob:.1f}%")
                
                # Show key factors
                factors = []
                if driver_pred.track_performance_multiplier > 1.1:
                    factors.append("Track advantage")
                if driver_pred.weather_adjustment > 1.1:
                    factors.append("Weather advantage")
                if driver_pred.tire_degradation_factor > 1.1:
                    factors.append("Tire management")
                
                if factors:
                    print(f"      ✨ Key factors: {', '.join(factors)}")
            
            # Show key race factors
            if prediction.key_factors:
                print(f"\n🔑 Key Race Factors:")
                for factor in prediction.key_factors:
                    print(f"   • {factor}")
            
            # Show surprise potential
            if prediction.surprise_potential:
                print(f"\n🎲 Surprise Potential:")
                for potential in prediction.surprise_potential:
                    print(f"   • {potential}")
            
            print("-" * 80)
        
        # Save all predictions to file
        await save_predictions_to_file(all_predictions)
        
        return all_predictions
        
    except Exception as e:
        print(f"❌ Error generating Grand Prix predictions: {e}")
        import traceback
        traceback.print_exc()
        return None

async def generate_specific_grand_prix(race_identifier: str, weather: str = "dry"):
    """Generate predictions for a specific Grand Prix"""
    print(f"\n🏁 GENERATING PREDICTIONS FOR: {race_identifier.upper()}")
    print("=" * 60)
    
    try:
        from services.TrackSpecificPredictionService import TrackSpecificPredictionService
        
        # Initialize the service
        service = TrackSpecificPredictionService()
        print("✅ Track-specific prediction service initialized")
        
        # Generate prediction
        prediction = await service.predict_grand_prix(race_identifier, weather)
        
        # Display detailed prediction
        display_detailed_prediction(prediction)
        
        return prediction
        
    except Exception as e:
        print(f"❌ Error generating predictions for {race_identifier}: {e}")
        import traceback
        traceback.print_exc()
        return None

def display_detailed_prediction(prediction):
    """Display detailed prediction information"""
    print(f"\n🏆 {prediction.race_name.upper()}")
    print(f"📍 Circuit: {prediction.circuit}")
    print(f"🏁 Round: {prediction.round}")
    print(f"📅 Date: {prediction.date}")
    print(f"🌍 Location: {prediction.city}, {prediction.country}")
    
    print(f"\n🏁 TRACK CHARACTERISTICS:")
    print(f"   Type: {prediction.track_type}")
    print(f"   Length: {prediction.track_length} km")
    print(f"   Corners: {prediction.corners}")
    print(f"   Straights: {prediction.straights}")
    print(f"   High-speed corners: {prediction.high_speed_corners}")
    print(f"   Medium-speed corners: {prediction.medium_speed_corners}")
    print(f"   Low-speed corners: {prediction.low_speed_corners}")
    print(f"   Overtaking opportunities: {prediction.overtaking_opportunities}")
    
    print(f"\n🌤️ ENVIRONMENTAL FACTORS:")
    print(f"   Weather: {prediction.weather_condition}")
    print(f"   Temperature: {prediction.temperature_range[0]:.1f}°C - {prediction.temperature_range[1]:.1f}°C")
    print(f"   Humidity: {prediction.humidity_range[0]:.1f}% - {prediction.humidity_range[1]:.1f}%")
    print(f"   Wind: {prediction.wind_conditions}")
    
    print(f"\n🔄 TIRE STRATEGY:")
    print(f"   Compounds: {', '.join(prediction.tire_compounds)}")
    print(f"   Expected degradation: {prediction.expected_degradation}")
    print(f"   Pit stop strategy: {prediction.pit_stop_strategy}")
    
    print(f"\n🏆 DRIVER PREDICTIONS (ALL 20 DRIVERS):")
    print("-" * 80)
    
    # Sort by win probability
    sorted_predictions = sorted(
        prediction.driver_predictions, 
        key=lambda x: x.win_probability, 
        reverse=True
    )
    
    for i, driver_pred in enumerate(sorted_predictions, 1):
        win_prob = driver_pred.win_probability * 100
        podium_prob = driver_pred.podium_probability * 100
        points_prob = driver_pred.points_probability * 100
        
        # Highlight McLaren drivers
        if "McLaren" in driver_pred.constructor:
            print(f"🥇 {i:2d}. {driver_pred.driver_name:20s} ({driver_pred.constructor:25s}) 🚀")
        else:
            print(f"    {i:2d}. {driver_pred.driver_name:20s} ({driver_pred.constructor:25s})")
        
        print(f"        🏆 Win: {win_prob:5.1f}% | 🥉 Podium: {podium_prob:5.1f}% | 📊 Points: {points_prob:5.1f}%")
        print(f"        🏁 Expected Position: {driver_pred.expected_position:.1f}")
        print(f"        🎯 Confidence: {driver_pred.confidence_score:.1%}")
        
        # Show key performance factors
        factors = []
        if driver_pred.track_performance_multiplier > 1.1:
            factors.append(f"Track +{((driver_pred.track_performance_multiplier-1)*100):.0f}%")
        if driver_pred.weather_adjustment > 1.1:
            factors.append(f"Weather +{((driver_pred.weather_adjustment-1)*100):.0f}%")
        if driver_pred.tire_degradation_factor > 1.1:
            factors.append(f"Tires +{((driver_pred.tire_degradation_factor-1)*100):.0f}%")
        if driver_pred.driver_weight > 1.1:
            factors.append(f"Driver +{((driver_pred.driver_weight-1)*100):.0f}%")
        if driver_pred.team_weight > 1.1:
            factors.append(f"Team +{((driver_pred.team_weight-1)*100):.0f}%")
        
        if factors:
            print(f"        ✨ Key advantages: {', '.join(factors)}")
        
        print()
    
    print(f"\n🔑 RACE ANALYSIS:")
    print(f"   Expected pace: {prediction.expected_race_pace}")
    
    if prediction.key_factors:
        print(f"   Key factors:")
        for factor in prediction.key_factors:
            print(f"     • {factor}")
    
    if prediction.surprise_potential:
        print(f"   Surprise potential:")
        for potential in prediction.surprise_potential:
            print(f"     • {potential}")
    
    print(f"\n📊 MODEL METADATA:")
    print(f"   Generated: {prediction.generated_at}")
    print(f"   Model version: {prediction.model_version}")
    print(f"   Simulations: {prediction.simulation_count:,}")

async def save_predictions_to_file(predictions):
    """Save all predictions to a JSON file"""
    try:
        # Create predictions directory if it doesn't exist
        predictions_dir = Path("predictions_cache")
        predictions_dir.mkdir(exist_ok=True)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = predictions_dir / f"track_specific_predictions_{timestamp}.json"
        
        # Convert predictions to serializable format
        serializable_predictions = []
        for prediction in predictions:
            # Convert dataclass to dict
            pred_dict = {
                "race_name": prediction.race_name,
                "circuit": prediction.circuit,
                "round": prediction.round,
                "date": prediction.date,
                "country": prediction.country,
                "city": prediction.city,
                "track_type": prediction.track_type,
                "track_length": prediction.track_length,
                "corners": prediction.corners,
                "straights": prediction.straights,
                "high_speed_corners": prediction.high_speed_corners,
                "medium_speed_corners": prediction.medium_speed_corners,
                "low_speed_corners": prediction.low_speed_corners,
                "overtaking_opportunities": prediction.overtaking_opportunities,
                "weather_condition": prediction.weather_condition,
                "temperature_range": prediction.temperature_range,
                "humidity_range": prediction.humidity_range,
                "wind_conditions": prediction.wind_conditions,
                "tire_compounds": prediction.tire_compounds,
                "expected_degradation": prediction.expected_degradation,
                "pit_stop_strategy": prediction.pit_stop_strategy,
                "expected_race_pace": prediction.expected_race_pace,
                "key_factors": prediction.key_factors,
                "surprise_potential": prediction.surprise_potential,
                "generated_at": prediction.generated_at,
                "model_version": prediction.model_version,
                "simulation_count": prediction.simulation_count,
                "driver_predictions": []
            }
            
            # Convert driver predictions
            for driver_pred in prediction.driver_predictions:
                driver_dict = {
                    "driver_id": driver_pred.driver_id,
                    "driver_name": driver_pred.driver_name,
                    "constructor": driver_pred.constructor,
                    "constructor_id": driver_pred.constructor_id,
                    "nationality": driver_pred.nationality,
                    "win_probability": driver_pred.win_probability,
                    "podium_probability": driver_pred.podium_probability,
                    "points_probability": driver_pred.points_probability,
                    "expected_position": driver_pred.expected_position,
                    "track_performance_multiplier": driver_pred.track_performance_multiplier,
                    "weather_adjustment": driver_pred.weather_adjustment,
                    "tire_degradation_factor": driver_pred.tire_degradation_factor,
                    "fuel_efficiency_bonus": driver_pred.fuel_efficiency_bonus,
                    "brake_wear_impact": driver_pred.brake_wear_impact,
                    "downforce_advantage": driver_pred.downforce_advantage,
                    "power_sensitivity_bonus": driver_pred.power_sensitivity_bonus,
                    "driver_weight": driver_pred.driver_weight,
                    "team_weight": driver_pred.team_weight,
                    "season_form": driver_pred.season_form,
                    "track_history": driver_pred.track_history,
                    "confidence_score": driver_pred.confidence_score,
                    "uncertainty_factor": driver_pred.uncertainty_factor,
                    "qualifying_potential": driver_pred.qualifying_potential,
                    "race_pace_advantage": driver_pred.race_pace_advantage,
                    "tire_management_skill": driver_pred.tire_management_skill,
                    "wet_weather_advantage": driver_pred.wet_weather_advantage
                }
                pred_dict["driver_predictions"].append(driver_dict)
            
            serializable_predictions.append(pred_dict)
        
        # Save to file
        with open(filename, 'w') as f:
            json.dump(serializable_predictions, f, indent=2)
        
        print(f"\n💾 Predictions saved to: {filename}")
        
    except Exception as e:
        print(f"❌ Error saving predictions to file: {e}")

async def main():
    """Main function to run the prediction generation"""
    print("🚀 F1 Track-Specific Prediction Generator")
    print("=" * 50)
    
    if len(sys.argv) > 1:
        # Generate predictions for specific race
        race_identifier = sys.argv[1]
        weather = sys.argv[2] if len(sys.argv) > 2 else "dry"
        await generate_specific_grand_prix(race_identifier, weather)
    else:
        # Generate predictions for all races
        await generate_all_grand_prix_predictions()
    
    print("\n✅ Prediction generation complete!")

if __name__ == "__main__":
    asyncio.run(main())
