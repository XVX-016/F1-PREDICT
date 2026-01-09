#!/usr/bin/env python3
"""
F1 Betting Lifecycle Demo
Demonstrates the automatic betting lifecycle management system
"""

import os
import sys
import logging
from datetime import datetime, timezone

# Add backend to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.BettingLifecycleService import betting_lifecycle_service
from services.BettingScheduler import betting_scheduler
from services.MarketService import market_service
from services.BetService import bet_service
from services.ResultService import result_service
from services.UserService import user_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def demo_betting_lifecycle():
    """Demonstrate the betting lifecycle system"""
    print("🏎️ F1 Betting Lifecycle Management Demo")
    print("=" * 50)
    
    try:
        # 1. Show current lifecycle status
        print("\n📊 Current Lifecycle Status:")
        status = betting_lifecycle_service.get_lifecycle_status()
        if status["status"] == "success":
            data = status["data"]
            print(f"   Current Time: {data['current_time']}")
            print(f"   Current Race: {data['current_race']['name'] if data['current_race'] else 'None'}")
            print(f"   Next Race: {data['next_race']['name'] if data['next_race'] else 'None'}")
            print(f"   Active Markets: {data['markets_status']['active_markets']}")
            print(f"   Pending Bets: {data['bets_status']['pending_bets']}")
        else:
            print(f"   Error: {status['message']}")
        
        # 2. Create a test user
        print("\n👤 Creating Test User:")
        user_result = user_service.create_user("demo_user_001", "Demo User", "demo@example.com")
        if user_result["status"] == "success":
            print(f"   ✅ User created: {user_result['user']['username']}")
        else:
            print(f"   ❌ Failed to create user: {user_result['message']}")
        
        # 3. Generate new markets for next race
        print("\n🎯 Generating New Markets:")
        markets_result = betting_lifecycle_service.generate_next_markets()
        if markets_result["status"] == "success":
            print(f"   ✅ Markets generated for: {markets_result['race']['name']}")
            print(f"   📈 Market result: {markets_result['market_result']}")
        else:
            print(f"   ❌ Failed to generate markets: {markets_result['message']}")
        
        # 4. Place a test bet
        print("\n💰 Placing Test Bet:")
        bet_result = bet_service.place_bet(
            user_id="demo_user_001",
            race_id="monaco",
            market_id="monaco_winner",
            selection="Max Verstappen",
            stake=25.0,
            odds=2.5
        )
        if bet_result["status"] == "success":
            print(f"   ✅ Bet placed: {bet_result['bet_id']}")
            print(f"   💵 Stake: £{bet_result['bet']['stake']}")
            print(f"   🎯 Odds: {bet_result['bet']['odds']}")
            print(f"   💰 Potential Payout: £{bet_result['bet']['potential_payout']}")
        else:
            print(f"   ❌ Failed to place bet: {bet_result['message']}")
        
        # 5. Show betting patterns
        print("\n📊 Player Betting Patterns:")
        patterns = user_service.get_player_betting_patterns()
        print(f"   Total Players: {patterns['total_players']}")
        print(f"   Average Stake: £{patterns['average_stake']:.2f}")
        print(f"   Average Odds: {patterns['average_odds']:.2f}")
        
        # 6. Run manual lifecycle check
        print("\n🔄 Running Manual Lifecycle Check:")
        lifecycle_result = betting_lifecycle_service.run_lifecycle()
        print(f"   Status: {lifecycle_result['status']}")
        print(f"   Message: {lifecycle_result['message']}")
        if lifecycle_result.get('results'):
            print(f"   Actions Taken: {len(lifecycle_result['results'])}")
        
        # 7. Show scheduler status
        print("\n⏰ Scheduler Status:")
        scheduler_status = betting_scheduler.get_scheduler_status()
        if scheduler_status["status"] == "success":
            print(f"   Running: {scheduler_status['scheduler_running']}")
            print(f"   Jobs: {len(scheduler_status['jobs'])}")
            for job in scheduler_status['jobs']:
                print(f"     - {job['name']}: {job['next_run_time']}")
        else:
            print(f"   Error: {scheduler_status['message']}")
        
        print("\n✅ Demo completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Demo failed: {e}")
        print(f"\n❌ Demo failed: {e}")

def demo_scheduler():
    """Demonstrate the scheduler functionality"""
    print("\n⏰ Scheduler Demo")
    print("=" * 30)
    
    try:
        # Start the scheduler
        print("🚀 Starting scheduler...")
        if betting_scheduler.start():
            print("✅ Scheduler started successfully")
            
            # Show status
            status = betting_scheduler.get_scheduler_status()
            print(f"📊 Scheduler Status: {status}")
            
            # Wait a moment
            import time
            print("⏳ Waiting 10 seconds...")
            time.sleep(10)
            
            # Stop the scheduler
            print("🛑 Stopping scheduler...")
            if betting_scheduler.stop():
                print("✅ Scheduler stopped successfully")
            else:
                print("❌ Failed to stop scheduler")
        else:
            print("❌ Failed to start scheduler")
            
    except Exception as e:
        logger.error(f"❌ Scheduler demo failed: {e}")
        print(f"❌ Scheduler demo failed: {e}")

def main():
    """Main demo function"""
    print("🏎️ F1 Betting Lifecycle Management System")
    print("=" * 50)
    print("This demo shows the automatic betting lifecycle management:")
    print("• Market creation and closing")
    print("• Bet settlement")
    print("• Player pattern analysis")
    print("• Automated scheduling")
    print("=" * 50)
    
    # Run the main demo
    demo_betting_lifecycle()
    
    # Ask if user wants to see scheduler demo
    try:
        response = input("\nWould you like to see the scheduler demo? (y/n): ").lower().strip()
        if response in ['y', 'yes']:
            demo_scheduler()
    except KeyboardInterrupt:
        print("\n👋 Demo interrupted by user")
    
    print("\n🎉 Demo completed! The betting lifecycle system is ready to use.")
    print("\nTo integrate with your main application:")
    print("1. Import the services in your main.py")
    print("2. Start the scheduler: betting_scheduler.start()")
    print("3. The system will automatically manage betting markets")

if __name__ == "__main__":
    main()

