#!/usr/bin/env python3
"""
Test script for F1 Betting Lifecycle System
Tests the automatic betting lifecycle management functionality
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

def test_betting_lifecycle():
    """Test the betting lifecycle system"""
    print("🧪 Testing F1 Betting Lifecycle System")
    print("=" * 50)
    
    try:
        # Test 1: Check lifecycle status
        print("\n📊 Test 1: Checking lifecycle status...")
        status = betting_lifecycle_service.get_lifecycle_status()
        if status["status"] == "success":
            print("✅ Lifecycle status check passed")
            data = status["data"]
            print(f"   Current Time: {data['current_time']}")
            print(f"   Current Race: {data['current_race']['name'] if data['current_race'] else 'None'}")
            print(f"   Next Race: {data['next_race']['name'] if data['next_race'] else 'None'}")
        else:
            print(f"❌ Lifecycle status check failed: {status['message']}")
            return False
        
        # Test 2: Check scheduler status
        print("\n⏰ Test 2: Checking scheduler status...")
        scheduler_status = betting_scheduler.get_scheduler_status()
        if scheduler_status["status"] == "success":
            print("✅ Scheduler status check passed")
            print(f"   Scheduler Running: {scheduler_status['scheduler_running']}")
            print(f"   Jobs: {len(scheduler_status['jobs'])}")
        else:
            print(f"❌ Scheduler status check failed: {scheduler_status['message']}")
            return False
        
        # Test 3: Test manual lifecycle run
        print("\n🔄 Test 3: Testing manual lifecycle run...")
        lifecycle_result = betting_lifecycle_service.run_lifecycle()
        if lifecycle_result["status"] in ["success", "info", "warning"]:
            print("✅ Manual lifecycle run completed")
            print(f"   Status: {lifecycle_result['status']}")
            print(f"   Message: {lifecycle_result['message']}")
        else:
            print(f"❌ Manual lifecycle run failed: {lifecycle_result['message']}")
            return False
        
        # Test 4: Check market service
        print("\n🏪 Test 4: Checking market service...")
        markets_status = market_service.get_markets_status()
        if "error" not in markets_status:
            print("✅ Market service check passed")
            print(f"   Active Markets: {markets_status['active_markets']}")
            print(f"   Closed Markets: {markets_status['closed_markets']}")
        else:
            print(f"❌ Market service check failed: {markets_status['error']}")
            return False
        
        # Test 5: Check bet service
        print("\n💰 Test 5: Checking bet service...")
        bets_status = bet_service.get_bets_status()
        if "error" not in bets_status:
            print("✅ Bet service check passed")
            print(f"   Pending Bets: {bets_status['pending_bets']}")
            print(f"   Settled Bets: {bets_status['settled_bets']}")
        else:
            print(f"❌ Bet service check failed: {bets_status['error']}")
            return False
        
        print("\n🎉 All tests passed! Betting lifecycle system is working correctly.")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        logger.error(f"Test error: {e}")
        return False

def test_scheduler_start_stop():
    """Test starting and stopping the scheduler"""
    print("\n🔄 Testing scheduler start/stop...")
    
    try:
        # Start scheduler
        print("🚀 Starting scheduler...")
        if betting_scheduler.start():
            print("✅ Scheduler started successfully")
        else:
            print("❌ Failed to start scheduler")
            return False
        
        # Wait a moment
        import time
        time.sleep(2)
        
        # Check status
        status = betting_scheduler.get_scheduler_status()
        if status["scheduler_running"]:
            print("✅ Scheduler is running")
        else:
            print("❌ Scheduler is not running")
            return False
        
        # Stop scheduler
        print("🛑 Stopping scheduler...")
        if betting_scheduler.stop():
            print("✅ Scheduler stopped successfully")
        else:
            print("❌ Failed to stop scheduler")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Scheduler test failed: {e}")
        return False

def main():
    """Main test function"""
    print("🏎️ F1 Betting Lifecycle System Test Suite")
    print("=" * 60)
    
    # Run basic tests
    if test_betting_lifecycle():
        print("\n✅ Basic functionality tests passed!")
    else:
        print("\n❌ Basic functionality tests failed!")
        return False
    
    # Run scheduler tests
    if test_scheduler_start_stop():
        print("\n✅ Scheduler tests passed!")
    else:
        print("\n❌ Scheduler tests failed!")
        return False
    
    print("\n🎉 All tests completed successfully!")
    print("\nTo start the betting lifecycle service in the background:")
    print("   python start_betting_lifecycle.py")
    print("   or run: start_betting_lifecycle.bat (Windows)")
    print("   or run: start_betting_lifecycle.ps1 (PowerShell)")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
