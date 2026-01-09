#!/usr/bin/env python3
"""
Generate Market Cards for Baku GP
Creates visual market cards for the Azerbaijan Grand Prix betting markets
"""

import os
import sys
import json
from datetime import datetime, timezone

# Add backend to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.MarketService import market_service
from services.BettingLifecycleService import betting_lifecycle_service

def generate_market_cards():
    """Generate and display market cards for Baku GP"""
    print("🏎️ BAKU GP BETTING MARKETS")
    print("=" * 60)
    print("🇦🇿 Azerbaijan Grand Prix - September 21, 2025")
    print("🏁 Baku City Circuit (Street Circuit)")
    print("=" * 60)
    
    try:
        # Get Baku markets
        markets_data = market_service.get_race_markets('baku')
        
        if not markets_data or not markets_data.get('markets'):
            print("❌ No markets found for Baku GP")
            return
        
        markets = markets_data['markets']
        print(f"📊 {len(markets)} Active Markets Available")
        print()
        
        # Generate cards for each market
        for i, market in enumerate(markets, 1):
            print(f"🎯 MARKET CARD #{i}")
            print("─" * 50)
            print(f"📋 Market: {market['name']}")
            print(f"📝 Description: {market['description']}")
            print(f"🆔 Market ID: {market['market_id']}")
            print(f"🏷️ Type: {market['market_type'].replace('_', ' ').title()}")
            print()
            
            # Display options with odds
            print("🎲 BETTING OPTIONS:")
            print("─" * 30)
            
            for j, option in enumerate(market['options'][:10], 1):  # Show top 10 options
                if 'driver' in option:
                    name = option['driver']
                    team = option['team']
                    odds = option['odds']
                    prob = option['probability'] * 100
                    print(f"{j:2d}. {name:<25} ({team})")
                    print(f"    💰 Odds: {odds:.2f}  📊 Probability: {prob:.1f}%")
                elif 'team' in option:
                    team = option['team']
                    odds = option['odds']
                    prob = option['probability'] * 100
                    print(f"{j:2d}. {team}")
                    print(f"    💰 Odds: {odds:.2f}  📊 Probability: {prob:.1f}%")
                print()
            
            if len(market['options']) > 10:
                print(f"    ... and {len(market['options']) - 10} more options")
                print()
            
            print("─" * 50)
            print()
        
        # Market summary
        print("📈 MARKET SUMMARY")
        print("─" * 30)
        print(f"🏁 Race: Azerbaijan Grand Prix")
        print(f"📅 Date: September 21, 2025")
        print(f"🏎️ Circuit: Baku City Circuit")
        print(f"🌍 Location: Baku, Azerbaijan")
        print(f"🏗️ Track Type: Street Circuit")
        print(f"📊 Total Markets: {len(markets)}")
        print(f"🎯 Total Options: {sum(len(m['options']) for m in markets)}")
        print(f"⏰ Created: {markets_data.get('created_at', 'Unknown')}")
        print(f"📊 Status: {markets_data.get('status', 'Unknown').title()}")
        print()
        
        # Top favorites summary
        print("⭐ TOP FAVORITES ACROSS ALL MARKETS")
        print("─" * 40)
        
        # Collect all driver odds
        driver_odds = {}
        for market in markets:
            for option in market['options']:
                if 'driver' in option:
                    driver = option['driver']
                    if driver not in driver_odds:
                        driver_odds[driver] = []
                    driver_odds[driver].append(option['odds'])
        
        # Calculate average odds for each driver
        avg_odds = {}
        for driver, odds_list in driver_odds.items():
            avg_odds[driver] = sum(odds_list) / len(odds_list)
        
        # Sort by average odds (lower = more favorite)
        sorted_drivers = sorted(avg_odds.items(), key=lambda x: x[1])
        
        for i, (driver, avg_odd) in enumerate(sorted_drivers[:5], 1):
            print(f"{i}. {driver:<25} Avg Odds: {avg_odd:.2f}")
        
        print()
        print("✅ Market cards generated successfully!")
        print("🎯 Ready for betting on the Azerbaijan Grand Prix!")
        
    except Exception as e:
        print(f"❌ Error generating market cards: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Main function"""
    print("🚀 Generating Baku GP Market Cards...")
    print()
    generate_market_cards()

if __name__ == "__main__":
    main()

