#!/usr/bin/env python3
"""
F1 Betting Lifecycle Status Checker
Quick script to check the status of the betting lifecycle system
"""

import os
import sys
import logging
from datetime import datetime, timezone

# Add backend to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.BettingLifecycleService import betting_lifecycle_service
from services.BettingScheduler import betting_scheduler

# Configure logging
logging.basicConfig(level=logging.WARNING)  # Reduce log noise
logger = logging.getLogger(__name__)

def check_status():
    """Check and display betting lifecycle status"""
    print("🏎️ F1 Betting Lifecycle Status Check")
    print("=" * 50)
    
    try:
        # Check lifecycle status
        print("\n📊 Lifecycle Status:")
        lifecycle_status = betting_lifecycle_service.get_lifecycle_status()
        
        if lifecycle_status["status"] == "success":
            data = lifecycle_status["data"]
            print(f"   ✅ Current Time: {data['current_time']}")
            print(f"   🏁 Current Race: {data['current_race']['name'] if data['current_race'] else 'None'}")
            print(f"   🎯 Next Race: {data['next_race']['name'] if data['next_race'] else 'None'}")
            print(f"   🏪 Active Markets: {data['markets_status']['active_markets']}")
            print(f"   💰 Pending Bets: {data['bets_status']['pending_bets']}")
            
            if 'race_timeline' in data:
                timeline = data['race_timeline']
                if timeline['start_time']:
                    print(f"   ⏰ Race Start: {timeline['start_time']}")
                if timeline['end_time']:
                    print(f"   🏆 Race End: {timeline['end_time']}")
        else:
            print(f"   ❌ Error: {lifecycle_status['message']}")
        
        # Check scheduler status
        print("\n⏰ Scheduler Status:")
        scheduler_status = betting_scheduler.get_scheduler_status()
        
        if scheduler_status["status"] == "success":
            print(f"   {'✅' if scheduler_status['scheduler_running'] else '❌'} Scheduler Running: {scheduler_status['scheduler_running']}")
            print(f"   📋 Active Jobs: {len(scheduler_status['jobs'])}")
            
            for job in scheduler_status['jobs']:
                print(f"      • {job['name']} (Next: {job['next_run_time'] or 'Not scheduled'})")
        else:
            print(f"   ❌ Error: {scheduler_status['message']}")
        
        print("\n" + "=" * 50)
        print("✅ Status check completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Status check failed: {e}")
        return False
    
    return True

def main():
    """Main function"""
    success = check_status()
    
    if success:
        print("\n💡 To start the betting lifecycle service:")
        print("   python start_betting_lifecycle.py")
        print("   or run: start_betting_lifecycle.bat (Windows)")
        print("   or run: start_betting_lifecycle.ps1 (PowerShell)")
    
    return success

if __name__ == "__main__":
    main()
