#!/usr/bin/env python3
"""
Test script to generate actual predictions using HybridPredictionService
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.HybridPredictionService import HybridPredictionService

async def test_predictions():
    """Test generating actual predictions"""
    print("🚀 Testing Hybrid Prediction Generation...")
    
    try:
        # Initialize the service
        hybrid_service = HybridPredictionService()
        print("✅ Service initialized successfully")
        
        # Generate predictions for next race
        print("\n🎯 Generating predictions for Dutch Grand Prix...")
        race_prediction = await hybrid_service.predict_next_race()
        
        print(f"\n🏁 Race: {race_prediction.race}")
        print(f"📍 Round: {race_prediction.round}")
        print(f"📅 Season: {race_prediction.season}")
        print(f"🏟️ Track Type: {race_prediction.track_type}")
        print(f"🌤️ Weather: {race_prediction.weather_conditions['condition']}")
        print(f"🤖 Model Version: {race_prediction.model_version}")
        
        print(f"\n🏆 Top 10 Predictions:")
        print("-" * 80)
        print(f"{'Pos':<3} {'Driver':<20} {'Team':<20} {'Probability':<12} {'Confidence':<10}")
        print("-" * 80)
        
        for i, pred in enumerate(race_prediction.predictions[:10]):
            prob_percent = pred.probability * 100
            print(f"{i+1:<3} {pred.driverName:<20} {pred.constructor:<20} {prob_percent:>8.1f}% {pred.confidence:>8.1f}")
        
        print("-" * 80)
        
        # Show some detailed stats
        print(f"\n📊 Prediction Statistics:")
        print(f"   Total Drivers: {len(race_prediction.predictions)}")
        print(f"   Probability Sum: {sum(p.probability for p in race_prediction.predictions):.3f}")
        print(f"   Average Confidence: {sum(p.confidence for p in race_prediction.predictions) / len(race_prediction.predictions):.2f}")
        
        # Show driver tier distribution
        tier_counts = {}
        for pred in race_prediction.predictions:
            tier_mult = hybrid_service.driver_tiers.get(pred.driverId, 1.0)
            if tier_mult >= 1.3:
                tier = "Super Elite"
            elif tier_mult >= 1.15:
                tier = "Elite"
            elif tier_mult >= 1.05:
                tier = "Strong"
            elif tier_mult >= 0.95:
                tier = "Midfield"
            else:
                tier = "Developing"
            
            tier_counts[tier] = tier_counts.get(tier, 0) + 1
        
        print(f"\n👥 Driver Tier Distribution:")
        for tier, count in tier_counts.items():
            print(f"   {tier}: {count} drivers")
        
        print("\n🎉 Prediction generation completed successfully!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_predictions())

